// convex/payments/index.ts
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import { COIN_PACKAGES, getCoinPackageByKey } from "./catalog";


export interface CreateCoinOrderResult {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  packageTitle: string;
  coins: number;
  prefill: {
    name: string;
    email: string;
  };
}

export interface VerifyCoinPaymentResult {
  success: boolean;
  coinsCredited: number;
}

// Helper: HMAC-SHA256 hex digest using Web Crypto API
async function computeHmacSha256Hex(
  secret: string,
  payload: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// 1. Public Query: List available INR Coin Packages
export const listCoinPackages = query({
  args: {},
  handler: async () => {
    return COIN_PACKAGES;
  },
});

// 2. Internal Query: Validate session token inside Actions
export const resolveSessionForAction = internalQuery({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return null;
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) return null;

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
    };
  },
});

// 3. Internal Mutation: Save newly created Razorpay order
export const recordCreatedOrder = internalMutation({
  args: {
    userId: v.id("users"),
    orderId: v.string(),
    packageKey: v.string(),
    amountPaise: v.number(),
    coins: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("paymentOrders", {
      userId: args.userId,
      provider: "razorpay",
      orderId: args.orderId,
      packageKey: args.packageKey,
      amountPaise: args.amountPaise,
      currency: "INR",
      coins: args.coins,
      status: "created",
      createdAt: Date.now(),
    });
  },
});

// 4. Internal Mutation: Idempotent Atomic Coin Credit (Safe against duplicate calls!)
export const fulfillCoinOrder = internalMutation({
  args: {
    orderId: v.string(),
    paymentId: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("paymentOrders")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .first();

    if (!order) {
      throw new ConvexError("Payment order not found.");
    }

    // IDEMPOTENCY GUARD: Already fulfilled by client callback or webhook
    if (order.status === "paid") {
      return {
        alreadyProcessed: true,
        coinsCredited: order.coins,
      };
    }

    const now = Date.now();

    // 1. Mark order paid
    await ctx.db.patch(order._id, {
      status: "paid",
      paymentId: args.paymentId,
      paidAt: now,
    });

    // 2. Credit userWallets atomically
    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", order.userId))
      .first();

    if (wallet) {
      await ctx.db.patch(wallet._id, {
        coins: wallet.coins + order.coins,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userWallets", {
        userId: order.userId,
        coins: order.coins,
        xp: 0,
        boughtItems: [],
        updatedAt: now,
      });
    }

    // 3. Append immutable ledger entry
    await ctx.db.insert("coinTransactions", {
      userId: order.userId,
      type: "purchase",
      coinsDelta: order.coins,
      referenceId: order.orderId,
      description: `Purchased ${order.coins} Coins (₹${order.amountPaise / 100})`,
      createdAt: now,
    });

    return {
      alreadyProcessed: false,
      coinsCredited: order.coins,
    };
  },
});

// 5. Action: Create Razorpay Order (Called when user taps "Buy ₹49")
export const createCoinOrder = action({
  args: {
    sessionToken: v.string(),
    packageKey: v.string(),
  },
  handler: async (ctx, args): Promise<CreateCoinOrderResult> => {
    const user = await ctx.runQuery(
      internal.payments.index.resolveSessionForAction,
      { sessionToken: args.sessionToken }
    );
    if (!user) {
      throw new ConvexError("Session expired. Please sign in again.");
    }

    const pkg = getCoinPackageByKey(args.packageKey);
    if (!pkg) {
      throw new ConvexError("Invalid coin package selected.");
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new ConvexError("Payment gateway keys are not configured.");
    }

    const basicAuth = btoa(`${keyId}:${keySecret}`);
    const receipt = `hp_${Date.now()}_${pkg.key}`;

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: pkg.amountPaise,
        currency: "INR",
        receipt,
        notes: {
          userId: user.userId,
          packageKey: pkg.key,
          coins: String(pkg.coins),
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Razorpay order creation failed:", errText);
      throw new ConvexError("Could not initiate payment order. Please try again.");
    }

    const razorpayOrder = (await response.json()) as {
      id: string;
      amount: number;
      currency: string;
    };

    await ctx.runMutation(internal.payments.index.recordCreatedOrder, {
      userId: user.userId,
      orderId: razorpayOrder.id,
      packageKey: pkg.key,
      amountPaise: pkg.amountPaise,
      coins: pkg.coins,
    });

    return {
      keyId,
      orderId: razorpayOrder.id,
      amountPaise: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      packageTitle: pkg.title,
      coins: pkg.coins,
      prefill: {
        name: user.name,
        email: user.email,
      },
    };
  },
});

// 6. Action: Verify Payment Signature & Credit Coins Immediately
export const verifyCoinPayment = action({
  args: {
    sessionToken: v.string(),
    razorpayOrderId: v.string(),
    razorpayPaymentId: v.string(),
    razorpaySignature: v.string(),
  },
  handler: async (ctx, args): Promise<VerifyCoinPaymentResult> => {
    const user = await ctx.runQuery(
      internal.payments.index.resolveSessionForAction,
      { sessionToken: args.sessionToken }
    );
    if (!user) {
      throw new ConvexError("Session expired. Please sign in again.");
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new ConvexError("Payment gateway secret missing.");
    }

    // Razorpay signature specification: HMAC_SHA256(order_id + "|" + payment_id, secret)
    const expectedSignature = await computeHmacSha256Hex(
      keySecret,
      `${args.razorpayOrderId}|${args.razorpayPaymentId}`
    );

    if (!timingSafeEqual(expectedSignature, args.razorpaySignature)) {
      throw new ConvexError("Payment signature verification failed!");
    }

    const result = await ctx.runMutation(
      internal.payments.index.fulfillCoinOrder,
      {
        orderId: args.razorpayOrderId,
        paymentId: args.razorpayPaymentId,
      }
    );

    return {
      success: true,
      coinsCredited: result.coinsCredited,
    };
  },
});


// Show user payment history:
export const getMyTransactions = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return [];
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken!))
      .first();
    if (!session || session.expiresAt < Date.now()) return [];

    const txns = await ctx.db
      .query("coinTransactions")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .order("desc")
      .take(20);

    return txns;
  },
});
// convex/http.ts (or merge into existing httpRouter)
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

async function verifyWebhookSignature(
  secret: string,
  rawBody: string,
  signatureHeader: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody)
  );
  const expectedHex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expectedHex.length !== signatureHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }
  return diff === 0;
}

http.route({
  path: "/webhooks/razorpay",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const rawBody = await request.text();

    const isValid = await verifyWebhookSignature(
      webhookSecret,
      rawBody,
      signature
    );
    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(rawBody);
    if (event.event === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId: string | undefined = paymentEntity?.order_id;
      const paymentId: string | undefined = paymentEntity?.id;

      if (orderId && paymentId) {
        await ctx.runMutation(internal.payments.index.fulfillCoinOrder, {
          orderId,
          paymentId,
        });
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
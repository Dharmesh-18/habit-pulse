// src/components/shop/CoinPacksSection.tsx
import React, { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { Coins, Sparkles, ShieldCheck } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { NeuCard } from "../ui/NeuCard";
import { NeuButton } from "../ui/NeuButton";
import { loadRazorpayCheckoutScript } from "../../lib/razorpay";
import { useToast } from "../../context/ToastContext";
import { parseConvexError } from "../../lib/errorUtils";

interface CoinPacksSectionProps {
  sessionToken: string;
}

export const CoinPacksSection: React.FC<CoinPacksSectionProps> = ({
  sessionToken,
}) => {
  const toast = useToast();
  const [activePackKey, setActivePackKey] = useState<string | null>(null);

  const packages = useQuery(api.payments.index.listCoinPackages);
  const createCoinOrder = useAction(api.payments.index.createCoinOrder);
  const verifyCoinPayment = useAction(api.payments.index.verifyCoinPayment);

  const handleBuyPack = async (packageKey: string) => {
    try {
      setActivePackKey(packageKey);

      const sdkLoaded = await loadRazorpayCheckoutScript();
      if (!sdkLoaded) {
        toast.error("Could not load Razorpay checkout. Check your connection.");
        setActivePackKey(null);
        return;
      }

      const order = await createCoinOrder({
        sessionToken,
        packageKey,
      });

      const RazorpayConstructor = (window as any).Razorpay;
      const rzp = new RazorpayConstructor({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "Habit Pulse",
        description: `${order.packageTitle} (${order.coins} Coins)`,
        order_id: order.orderId,
        prefill: {
          name: order.prefill.name,
          email: order.prefill.email,
        },
        theme: {
          color: "#6366f1",
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verification = await verifyCoinPayment({
              sessionToken,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success(
              `+${verification.coinsCredited.toLocaleString()} Coins added to your wallet!`
            );
          } catch (err: unknown) {
            toast.error(parseConvexError(err));
          } finally {
            setActivePackKey(null);
          }
        },
        modal: {
          ondismiss: () => {
            setActivePackKey(null);
          },
        },
      });

      rzp.on("payment.failed", (failureResponse: any) => {
        toast.error(
          failureResponse?.error?.description || "Payment failed. No coins deducted."
        );
        setActivePackKey(null);
      });

      rzp.open();
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
      setActivePackKey(null);
    }
  };

  if (!packages || packages.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-extrabold uppercase tracking-wider text-neu-muted flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Top Up Coins</span>
        </span>
        <span className="text-[11px] font-semibold text-neu-muted flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>UPI • GPay • Cards</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {packages.map((pkg) => {
          const isProcessing = activePackKey === pkg.key;

          return (
            <NeuCard
              key={pkg.key}
              className="relative p-4 flex flex-col items-center text-center justify-between gap-3"
            >
              {pkg.badge && (
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-500 text-white shadow">
                  {pkg.badge}
                </span>
              )}

              <div className="flex flex-col items-center gap-1.5 pt-1">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <Coins className="w-5 h-5 stroke-[2.5]" />
                </div>
                <p className="text-base font-black text-neu-dark tabular-nums">
                  {pkg.coins.toLocaleString()} Coins
                </p>
                <p className="text-[11px] font-semibold text-neu-muted">
                  {pkg.title}
                </p>
              </div>

              <NeuButton
                size="sm"
                variant="primary"
                disabled={activePackKey !== null}
                onClick={() => handleBuyPack(pkg.key)}
                className="w-full font-extrabold tabular-nums"
              >
                {isProcessing ? "Opening..." : `₹${pkg.amountInr}`}
              </NeuButton>
            </NeuCard>
          );
        })}
      </div>
    </div>
  );
};
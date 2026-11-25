// src/pages/ShopPage.tsx
import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import {
  Coins,
  Store,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Snowflake,
  ShieldCheck,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { NeuCard } from "../components/ui/NeuCard";
import { NeuButton } from "../components/ui/NeuButton";
import { ConfirmActionModal } from "../components/ui/ConfirmActionModal";
import { LegalFooter } from "../components/ui/LegalFooter";
import { useToast } from "../context/ToastContext";
import { parseConvexError } from "../lib/errorUtils";
import { CoinPacksSection } from "../components/shop/CoinPacksSection";

interface ShopPageProps {
  sessionToken: string;
}

export const ShopPage: React.FC<ShopPageProps> = ({ sessionToken }) => {
  const toast = useToast();
  const navigate = useNavigate();

  const [pendingBuyItem, setPendingBuyItem] = useState<{
    itemKey: string;
    title: string;
    price: number;
    itemType: string;
  } | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  const ensureSeeded = useMutation(api.shop.index.ensureShopSeeded);
  const buyItemMutation = useMutation(api.shop.index.buyItem);

  const wallet = useQuery(api.shop.index.getMyWallet, { sessionToken });
  const allItems = useQuery(api.shop.index.listShopItems, { sessionToken });

  const powerups = (allItems ?? []).filter((i) => i.itemType === "powerup");
  const avatars = (allItems ?? []).filter((i) => i.itemType === "avatar");

  // Auto-seed catalog if empty or missing powerups
  useEffect(() => {
    if (allItems && (allItems.length === 0 || powerups.length === 0)) {
      ensureSeeded({ sessionToken }).catch(() => {});
    }
  }, [allItems, powerups.length, ensureSeeded, sessionToken]);

  const coins = wallet?.coins ?? 0;
  const shields = wallet?.shields ?? 0;
  const boughtSet = new Set(wallet?.boughtItems ?? []);

  const handleConfirmPurchase = async () => {
    if (!pendingBuyItem) return;
    try {
      setIsBuying(true);
      const res = await buyItemMutation({
        sessionToken,
        itemKey: pendingBuyItem.itemKey,
      });

      if (pendingBuyItem.itemType === "powerup") {
        toast.success(
          `❄️ Streak Freeze Shield added! (${res.shields}/3 in inventory)`,
        );
      } else {
        toast.success(
          `Unlocked "${pendingBuyItem.title}"! Tap Equip to wear it.`,
        );
      }
      setPendingBuyItem(null);
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
      setPendingBuyItem(null);
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <NeuCard className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-neu-bg shadow-neu-flat flex items-center justify-center text-neu-accent shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-neu-dark">
              Rewards Shop
            </h2>
            <p className="text-xs text-neu-muted">
              Protect streaks with Power-Ups or unlock exclusive avatars
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neu-bg shadow-neu-pressed text-sky-500">
            <Snowflake className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-extrabold tabular-nums">
              {shields}/3 Shields
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neu-bg shadow-neu-pressed">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-xs sm:text-sm font-extrabold text-neu-dark tabular-nums">
              {coins.toLocaleString()} Coins
            </span>
          </div>
        </div>
      </NeuCard>

      {/* 1. Power-Ups Section (Above Avatars) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-neu-dark">
              Power-Ups
            </h3>
          </div>
          <span className="text-[11px] font-bold text-neu-muted">
            Max 3 per inventory
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {powerups.map((item) => {
            const isMaxed = shields >= 3;
            const canAfford = coins >= item.price;

            return (
              <NeuCard
                key={item._id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 border border-sky-500/15"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 shadow-neu-pressed-sm flex items-center justify-center text-sky-500 shrink-0">
                    <Snowflake className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-neu-dark">
                        {item.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/10 text-sky-600 tabular-nums">
                        Owned: {shields}/3
                      </span>
                    </div>
                    <p className="text-xs text-neu-muted mt-1 leading-relaxed">
                      Protects a missed yesterday on any habit so your streak
                      chain stays intact.
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <NeuButton
                    size="sm"
                    variant={!isMaxed && canAfford ? "primary" : "secondary"}
                    disabled={!isMaxed && !canAfford}
                    onClick={() => {
                      if (isMaxed) {
                        toast.error(
                          "Maximum 3 Streak Freeze Shields allowed in inventory!",
                        );
                        return;
                      }
                      setPendingBuyItem({
                        itemKey: item.itemKey,
                        title: item.title,
                        price: item.price,
                        itemType: item.itemType,
                      });
                    }}
                    className="flex items-center gap-1.5 font-bold whitespace-nowrap"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isMaxed ? "Maxed (3/3)" : `${item.price}`}</span>
                  </NeuButton>
                </div>
              </NeuCard>
            );
          })}
        </div>
      </div>

      {/* 2. Avatars Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neu-accent" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-neu-dark">
              Avatars
            </h3>
          </div>
          <span className="text-[11px] font-bold text-neu-muted">
            {boughtSet.size}/{avatars.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {avatars.map((item) => {
            const isOwned = boughtSet.has(item.itemKey);
            const canAfford = coins >= item.price;

            return (
              <NeuCard
                key={item._id}
                className="p-4 flex flex-col items-center text-center gap-3 justify-between"
              >
                <div className="flex flex-col items-center gap-2.5 w-full">
                  <div className="relative w-20 h-20 rounded-full bg-neu-bg shadow-neu-flat p-1">
                    <img
                      src={item.assetPath}
                      alt={item.title}
                      className="w-full h-full rounded-full object-cover"
                      loading="lazy"
                    />
                    {isOwned && (
                      <span
                        title="Owned"
                        className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-neu-dark">
                      {item.title}
                    </h3>
                    {!isOwned ? (
                      <p className="text-xs font-bold text-amber-500 flex items-center justify-center gap-1 mt-0.5 tabular-nums">
                        <Coins className="w-3 h-3" />
                        <span>{item.price}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                        Purchased
                      </p>
                    )}
                  </div>
                </div>

                {isOwned ? (
                  <NeuButton
                    size="sm"
                    onClick={() =>
                      navigate(
                        `/profile?equip=${encodeURIComponent(item.itemKey)}`,
                      )
                    }
                    className="w-full flex items-center justify-center gap-1.5 font-bold text-neu-accent"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Equip</span>
                  </NeuButton>
                ) : (
                  <NeuButton
                    size="sm"
                    variant={canAfford ? "primary" : "secondary"}
                    disabled={!canAfford}
                    onClick={() =>
                      setPendingBuyItem({
                        itemKey: item.itemKey,
                        title: item.title,
                        price: item.price,
                        itemType: item.itemType,
                      })
                    }
                    className="w-full flex items-center justify-center gap-1.5 font-bold"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>
                      {canAfford
                        ? `Buy • ${item.price}`
                        : `${item.price} Coins`}
                    </span>
                  </NeuButton>
                )}
              </NeuCard>
            );
          })}
        </div>
      </div>

      {/* Coin Packs Top-Up Section */}
      <CoinPacksSection sessionToken={sessionToken} />

      {/* Legal Footer */}
      <div className="pt-2 border-t border-black/5">
        <LegalFooter />
      </div>

      {/* Purchase Confirmation Modal */}
      <ConfirmActionModal
        isOpen={pendingBuyItem !== null}
        variant="primary"
        title={
          pendingBuyItem?.itemType === "powerup"
            ? "Buy Streak Freeze Shield?"
            : `Unlock ${pendingBuyItem?.title ?? "Avatar"}?`
        }
        description={
          pendingBuyItem?.itemType === "powerup"
            ? `Spend ${pendingBuyItem?.price ?? 0} coins to add 1 Streak Freeze Shield to your inventory (${shields + 1}/3)?`
            : `Spend ${pendingBuyItem?.price ?? 0} coins to add "${pendingBuyItem?.title}" to your permanent avatar collection?`
        }
        confirmLabel={`Buy for ${pendingBuyItem?.price ?? 0} Coins`}
        isLoading={isBuying}
        onConfirm={handleConfirmPurchase}
        onCancel={() => setPendingBuyItem(null)}
      />
    </div>
  );
};
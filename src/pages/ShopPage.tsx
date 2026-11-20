// src/pages/ShopPage.tsx
import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { Coins, Store, CheckCircle2, Sparkles, ShoppingBag } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { NeuCard } from "../components/ui/NeuCard";
import { NeuButton } from "../components/ui/NeuButton";
import { ConfirmActionModal } from "../components/ui/ConfirmActionModal";
import { useToast } from "../context/ToastContext";
import { parseConvexError } from "../lib/errorUtils";

interface ShopPageProps {
  sessionToken: string;
}

type ShopCategory = "avatar"; // Easily extend later: | "frame" | "badge"

const SHOP_CATEGORIES: { id: ShopCategory; label: string }[] = [
  { id: "avatar", label: "Avatars" },
];

export const ShopPage: React.FC<ShopPageProps> = ({ sessionToken }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory>("avatar");
  const [pendingBuyItem, setPendingBuyItem] = useState<{
    itemKey: string;
    title: string;
    price: number;
  } | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  const ensureSeeded = useMutation(api.shop.index.ensureShopSeeded);
  const buyItemMutation = useMutation(api.shop.index.buyItem);

  const wallet = useQuery(api.shop.index.getMyWallet, { sessionToken });
  const items = useQuery(api.shop.index.listShopItems, {
    sessionToken,
    itemType: selectedCategory,
  });

  // Auto-seed initial shop items if DB table is empty
  useEffect(() => {
    if (items && items.length === 0) {
      ensureSeeded({ sessionToken }).catch(() => {});
    }
  }, [items, ensureSeeded, sessionToken]);

  const coins = wallet?.coins ?? 0;
  const boughtSet = new Set(wallet?.boughtItems ?? []);

  const handleConfirmPurchase = async () => {
    if (!pendingBuyItem) return;
    try {
      setIsBuying(true);
      await buyItemMutation({
        sessionToken,
        itemKey: pendingBuyItem.itemKey,
      });
      toast.success(`Unlocked "${pendingBuyItem.title}"! Tap Equip to wear it.`);
      setPendingBuyItem(null);
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
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
            <h2 className="text-lg font-extrabold text-neu-dark">Rewards Shop</h2>
            <p className="text-xs text-neu-muted">
              Earn +5 coins per habit & bonus coins on streak milestones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neu-bg shadow-neu-pressed self-start sm:self-auto">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-extrabold text-neu-dark tabular-nums">
            {coins.toLocaleString()} Coins
          </span>
        </div>
      </NeuCard>

      {/* Category Pills (Ready for future item types) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SHOP_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === cat.id
                ? "bg-neu-bg text-neu-accent shadow-neu-pressed-sm"
                : "bg-neu-bg text-neu-muted shadow-neu-flat-sm hover:text-neu-dark"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {(items ?? []).map((item) => {
          const isOwned = boughtSet.has(item.itemKey);
          const canAfford = coins >= item.price;

          return (
            <NeuCard
              key={item._id}
              className="p-4 flex flex-col items-center text-center gap-3 justify-between"
            >
              <div className="flex flex-col items-center gap-2.5 w-full">
                {/* Avatar Preview Circle */}
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

              {/* Action CTA: Equip vs Buy */}
              {isOwned ? (
                <NeuButton
                  size="sm"
                  onClick={() => navigate(`/profile?equip=${encodeURIComponent(item.itemKey)}`)}
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
                    })
                  }
                  className="w-full flex items-center justify-center gap-1.5 font-bold"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{canAfford ? `Buy • ${item.price}` : `${item.price} Coins`}</span>
                </NeuButton>
              )}
            </NeuCard>
          );
        })}
      </div>

      {/* Purchase Confirmation Modal */}
      <ConfirmActionModal
        isOpen={pendingBuyItem !== null}
        variant="primary"
        title={`Unlock ${pendingBuyItem?.title ?? "Avatar"}?`}
        description={`Spend ${pendingBuyItem?.price ?? 0} coins to add "${pendingBuyItem?.title}" to your permanent avatar collection?`}
        confirmLabel={`Buy for ${pendingBuyItem?.price ?? 0} Coins`}
        isLoading={isBuying}
        onConfirm={handleConfirmPurchase}
        onCancel={() => setPendingBuyItem(null)}
      />
    </div>
  );
};
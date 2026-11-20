// src/components/profile/BoughtAvatarsShelf.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Check, Store } from "lucide-react";

interface BoughtAvatarItem {
  itemKey: string;
  title: string;
  assetPath: string;
}

interface BoughtAvatarsShelfProps {
  avatars: BoughtAvatarItem[];
  selectedPresetId?: string;
  hasCustomPhoto: boolean;
  onSelectAvatar: (item: BoughtAvatarItem) => void;
}

export const BoughtAvatarsShelf: React.FC<BoughtAvatarsShelfProps> = ({
  avatars,
  selectedPresetId,
  hasCustomPhoto,
  onSelectAvatar,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-neu-muted tracking-wide uppercase flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-neu-accent" />
          <span>My Avatars ({avatars.length})</span>
        </span>
        <button
          type="button"
          onClick={() => navigate("/shop")}
          className="text-[11px] font-bold text-neu-accent hover:underline flex items-center gap-1"
        >
          <Store className="w-3 h-3" />
          <span>Get More</span>
        </button>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto py-2 px-1">
        {avatars.map((item) => {
          const isSelected = !hasCustomPhoto && selectedPresetId === item.itemKey;
          return (
            <button
              key={item.itemKey}
              type="button"
              onClick={() => onSelectAvatar(item)}
              className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            >
              <div
                className={`relative w-12 h-12 rounded-full p-0.5 transition-all ${
                  isSelected
                    ? "ring-2 ring-neu-accent scale-105 shadow-neu-flat"
                    : "shadow-neu-flat-sm group-hover:scale-105"
                }`}
              >
                <img
                  src={item.assetPath}
                  alt={item.title}
                  className="w-full h-full rounded-full object-cover"
                />
                {isSelected && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-neu-accent text-white flex items-center justify-center shadow">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  isSelected ? "text-neu-accent" : "text-neu-muted"
                }`}
              >
                {item.title}
              </span>
            </button>
          );
        })}

        {/* Quick Link Card to Shop */}
        <button
          type="button"
          onClick={() => navigate("/shop")}
          className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
        >
          <div className="w-12 h-12 rounded-full bg-neu-bg shadow-neu-pressed flex items-center justify-center text-neu-accent group-hover:scale-105 transition-all">
            <Store className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold text-neu-muted">Shop</span>
        </button>
      </div>
    </div>
  );
};
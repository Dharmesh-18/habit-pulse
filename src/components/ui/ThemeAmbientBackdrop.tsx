// src/components/ui/ThemeAmbientBackdrop.tsx
import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { getThemeMeta } from "../../lib/themes";

export const ThemeAmbientBackdrop: React.FC = () => {
  const { theme } = useTheme();
  const meta = getThemeMeta(theme);

  if (!meta.ambientOrbColors) return null;
  const [primaryOrb, secondaryOrb] = meta.ambientOrbColors;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
    >
      {/* Top-Left Floating Orb */}
      <div
        className="absolute -top-28 -left-28 w-[460px] h-[460px] rounded-full animate-ambient-float"
        style={{
          background: `radial-gradient(circle, ${primaryOrb} 0%, transparent 70%)`,
        }}
      />

      {/* Bottom-Right Floating Orb */}
      <div
        className="absolute -bottom-32 -right-24 w-[520px] h-[520px] rounded-full animate-ambient-float"
        style={{
          background: `radial-gradient(circle, ${secondaryOrb} 0%, transparent 70%)`,
          animationDelay: "-7s",
        }}
      />
    </div>
  );
};
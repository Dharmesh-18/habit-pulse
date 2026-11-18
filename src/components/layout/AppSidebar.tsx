// src/components/layout/AppSidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Trophy, UserCircle, Award } from "lucide-react";
import { cn } from "../../lib/utils";

interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/achievements", label: "Achievements", icon: Award },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

export const AppSidebar: React.FC = () => {
  return (
    <>
      {/* 1. Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 sticky top-22 self-start gap-2 p-3 rounded-2xl bg-neu-bg shadow-neu-flat">
        <span className="px-3 pt-1 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-neu-muted">
          Menu
        </span>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all",
                  isActive
                    ? "bg-neu-bg text-neu-accent shadow-neu-pressed-sm"
                    : "text-neu-muted hover:text-neu-dark hover:bg-black/[0.02]"
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </aside>

      {/* 2. Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-neu-bg/95 backdrop-blur-md border-t border-black/5 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                    isActive
                      ? "bg-neu-bg text-neu-accent shadow-neu-pressed-sm"
                      : "text-neu-muted active:text-neu-dark"
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};
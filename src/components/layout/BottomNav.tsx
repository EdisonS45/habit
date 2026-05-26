import React from "react";
import { useHabitStore } from "../../context/HabitContext";
import { CheckSquare, Grid, Calendar, BarChart3, Settings as SettingsIcon } from "lucide-react";

export const BottomNav: React.FC = () => {
  const { activeView, setActiveView, settings } = useHabitStore();

  const navItems = [
    { id: "today", label: "Today", icon: CheckSquare },
    { id: "week", label: "Week", icon: Grid },
    { id: "month", label: "Month", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  const activeColor = settings.accentColor || "#7C9EFF";

  return (
    <nav
      id="bottom-nav-bar"
      className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-white dark:bg-neutral-900 border-t border-gray-150 dark:border-neutral-800 flex items-center justify-around pb-1 px-4 z-40 shadow-lg"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = activeView === item.id;

        return (
          <button
            key={item.id}
            id={`bottom-nav-item-${item.id}`}
            onClick={() => setActiveView(item.id)}
            style={{
              color: active ? activeColor : undefined,
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] cursor-pointer transition-colors ${
              active
                ? "font-bold"
                : "text-gray-400 dark:text-neutral-500 hover:text-gray-600"
            }`}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

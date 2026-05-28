import React from "react";
import { useHabitStore } from "../../context/HabitContext";
import { CheckSquare, Grid, Calendar, BarChart3, Settings as SettingsIcon } from "lucide-react";

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, settings } = useHabitStore();

  const navItems = [
    { id: "today", label: "Today tracking", icon: CheckSquare },
    { id: "week", label: "Weekly Grid Board", icon: Grid },
    { id: "month", label: "Monthly Calendar", icon: Calendar },
    { id: "analytics", label: "Statistics & Charts", icon: BarChart3 },
    { id: "settings", label: "Hub Settings", icon: SettingsIcon },
  ];

  const activeColor = settings.accentColor || "#7C9EFF";

  return (
    <aside
      id="desktop-left-sidebar"
      className="hidden md:flex flex-col w-64 bg-white dark:bg-neutral-900 border-r border-gray-150 dark:border-neutral-800 h-screen sticky top-0 shrink-0 select-none pb-6"
    >
      {/* Brand Header */}
      <div className="p-6 pb-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#7C9EFF]/10 rounded-xl flex items-center justify-center text-xl">
          🌱
        </div>
        <div className="min-w-0">
          <span className="block font-black text-gray-900 dark:text-neutral-100 tracking-tight leading-tight">
            CraftedByYours
          </span>
          <span className="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            Habit Companion
          </span>
        </div>
      </div>

      {/* Nav Link Stack */}
      <nav id="sidebar-nav" className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;

          return (
            <button
              key={item.id}
              id={`sidebar-nav-item-${item.id}`}
              onClick={() => setActiveView(item.id)}
              style={{
                borderColor: active ? activeColor : "transparent",
                color: active ? activeColor : undefined,
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl border text-xs font-extrabold capitalize cursor-pointer transition-all ${
                active
                  ? "bg-slate-50/50 dark:bg-neutral-800/20 font-black"
                  : "border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200 hover:bg-gray-50/50 dark:hover:bg-neutral-800/10"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile & theme switch block */}
      <div className="px-4 mt-auto space-y-3 pt-4 border-t border-gray-100 dark:border-neutral-800">
        {/* Profile Card */}
        {settings.userName && (
          <div className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 dark:bg-neutral-800/30 border border-gray-100 dark:border-neutral-800/50 rounded-xl min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#7C9EFF]/10 text-gray-800 dark:text-neutral-300 flex items-center justify-center font-bold text-xs shrink-0 capitalize">
              {settings.userName.charAt(0)}
            </div>
            <div className="truncate min-w-0 leading-tight">
              <span className="block text-[11px] font-bold text-gray-800 dark:text-neutral-200 truncate">
                {settings.userName}
              </span>
              <span className="text-[9px] text-gray-400 block font-semibold">Track active</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

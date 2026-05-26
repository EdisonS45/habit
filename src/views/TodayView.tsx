import React, { useState } from "react";
import { useHabitStore } from "../context/HabitContext";
import { format } from "date-fns";
import { HabitCard } from "../components/habits/HabitCard";
import { BottomSheet } from "../components/ui/BottomSheet";
import { HabitForm } from "../components/habits/HabitForm";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Plus, ListFilter } from "lucide-react";
import { HabitCategory } from "../types";
import { CATEGORY_STYLES } from "../components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";

export const TodayView: React.FC = () => {
  const { habits, logs, settings, addHabit } = useHabitStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<HabitCategory, boolean>>({
    health: false,
    fitness: false,
    study: false,
    mindfulness: false,
    productivity: false,
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const formattedToday = format(new Date(), "EEEE, MMMM d");

  // Get active habits
  const activeHabits = habits.filter((h) => h.isActive);
  const totalCount = activeHabits.length;

  const todayLogs = logs[todayStr] || [];
  const completedCount = activeHabits.filter((h) => todayLogs.includes(h.id)).length;
  const actualPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleCategoryCollapse = (category: HabitCategory) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleCreateHabitSubmit = (habitData: {
    name: string;
    category: HabitCategory;
    color: string;
    emoji: string;
    goalDaysPerWeek: number;
  }) => {
    addHabit(habitData);
    setIsAddOpen(false);
  };

  const categoriesList: HabitCategory[] = ["health", "fitness", "study", "mindfulness", "productivity"];

  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Sticky top header */}
      <div id="today-view-header" className="flex justify-between items-start pt-2 select-none">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-neutral-50 leading-tight">
            Good morning, {settings.userName || "Friend"} 👋
          </h2>
          <p className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest leading-none">
            {formattedToday}
          </p>
        </div>
        
        {/* Subtle Wordmark branding */}
        <div className="text-right leading-none">
          <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#7C9EFF] block">
            CraftedByYours
          </span>
          <span className="text-[9px] font-bold text-gray-400/50 block mt-1">v1.1</span>
        </div>
      </div>

      {/* Progress summary card */}
      {totalCount > 0 && (
        <div id="today-progress-card" className="progress-card p-5 space-y-3.5">
          <div className="flex justify-between items-center select-none">
            <div className="space-y-1">
              <span className="block text-xs uppercase tracking-widest font-extrabold text-gray-400 dark:text-neutral-500">
                Daily Achievements
              </span>
              <span className="text-xs font-bold text-gray-600 dark:text-neutral-300">
                {completedCount} of {totalCount} habits completed today
              </span>
            </div>
            <div className="text-right">
              <span 
                className="text-2xl font-black text-[#7C9EFF]" 
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {actualPercent}%
              </span>
            </div>
          </div>
          
          <ProgressBar value={actualPercent} color={settings.accentColor || "#7C9EFF"} height="h-2.5" />
        </div>
      )}

      {/* Directory filter section */}
      {totalCount > 0 && (
        <div className="flex justify-between items-center pt-2 select-none">
          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#AAAAAA]">
            Habit Directory
          </h3>
          <button
            type="button"
            id="toggle-group-btn"
            onClick={() => setGroupByCategory(!groupByCategory)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-150 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-400 hover:border-gray-300 pointer-events-auto cursor-pointer transition-colors"
          >
            <ListFilter size={13} />
            <span>{groupByCategory ? "Show Single List" : "Group by Category"}</span>
          </button>
        </div>
      )}

      {/* Empty State / Cards Render */}
      {totalCount === 0 ? (
        <div 
          id="today-empty-state" 
          className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-3xl min-h-[380px] shadow-sm select-none"
        >
          {/* Animated Float Illustration (Journal with pen) */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
            className="w-36 h-36 flex items-center justify-center text-[#7C9EFF]/20 mb-3"
          >
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" fill="currentColor" fillOpacity="0.1" />
              <path d="M5 6h2M5 11h2M5 16h2" strokeWidth="2" stroke="#9CA3AF" />
              <path d="M10 7h6M10 11h6M10 15h4" stroke="#9CA3AF" strokeOpacity="0.5" />
              <path d="M18 18l-3-3M15 15l4-4 2 2-4 4-2-2z" stroke="#7C9EFF" strokeWidth="1.8" />
            </svg>
          </motion.div>
          
          <h3 className="text-lg font-black text-gray-900 dark:text-neutral-100 tracking-tight mb-1">
            Your journey starts here
          </h3>
          <p className="text-xs font-semibold text-secondary max-w-[280px] mb-8 leading-relaxed">
            Add your first habit and begin building the life you want. Crafted with your custom targets.
          </p>
          
          <button
            id="empty-add-habit-btn"
            onClick={() => setIsAddOpen(true)}
            className="w-full md:w-auto px-6 py-3 text-xs uppercase tracking-widest font-extrabold bg-[#7C9EFF] text-white hover:bg-[#688CEB] active:scale-95 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            Add My First Habit →
          </button>
        </div>
      ) : groupByCategory ? (
        <div id="grouped-habits" className="space-y-4">
          <AnimatePresence mode="popLayout">
            {categoriesList.map((cat) => {
              const catHabits = activeHabits.filter((h) => h.category === cat);
              if (catHabits.length === 0) return null;

              const isCollapsed = collapsedCategories[cat];
              const catStyle = CATEGORY_STYLES[cat];

              return (
                <motion.div 
                  key={cat} 
                  id={`cat-section-${cat}`} 
                  className="space-y-2"
                  layout
                >
                  {/* Collapsible Section Header */}
                  <button
                    type="button"
                    id={`cat-collapse-btn-${cat}`}
                    onClick={() => toggleCategoryCollapse(cat)}
                    className="w-full flex justify-between items-center py-2 text-left font-bold select-none cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${catStyle.dot}`} />
                      <span className="text-xs font-bold tracking-wide uppercase text-gray-800 dark:text-neutral-450">
                        {cat}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 font-mono">
                        {catHabits.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-600 dark:group-hover:text-neutral-300 uppercase tracking-wider transition-colors">
                      {isCollapsed ? "Expand" : "Collapse"}
                    </span>
                  </button>

                  {/* Habits list inside this category */}
                  {!isCollapsed && (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      {catHabits.map((habit) => (
                        <HabitCard key={habit.id} habit={habit} dateStr={todayStr} />
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div id="ungrouped-habits" className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {activeHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} dateStr={todayStr} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* FAB with rotation and zoom-spring reactions */}
      <motion.button
        id="fab-add-habit"
        whileHover={{ scale: 1.08, rotate: 45 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-6 w-14 h-14 bg-[#7C9EFF] hover:bg-[#688CEB] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl cursor-pointer z-40 border border-white/10"
        title="Add Habit"
      >
        <Plus size={24} strokeWidth={2.5} />
      </motion.button>

      {/* Create Habit Drawer Sheet */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Form New Habit"
      >
        <HabitForm onSubmit={handleCreateHabitSubmit} onCancel={() => setIsAddOpen(false)} />
      </BottomSheet>
    </motion.div>
  );
};

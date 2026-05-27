import React, { useState, useEffect } from "react";
import { useHabitStore } from "../context/HabitContext";
import { format, addDays } from "date-fns";
import { HabitCard } from "../components/habits/HabitCard";
import { BottomSheet } from "../components/ui/BottomSheet";
import { HabitForm } from "../components/habits/HabitForm";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Plus, ListFilter, ChevronRight, ChevronDown, RotateCcw, AlertCircle } from "lucide-react";
import { Category, Habit } from "../types";
import { CATEGORY_STYLES } from "../components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";
import { StreakCelebration } from "../components/ui/StreakCelebration";

export const TodayView: React.FC = () => {
  const {
    habits,
    logs,
    settings,
    celebrated,
    addHabit,
    lastDeleted,
    restoreLastDeleted,
    clearLastDeleted,
    celebrateMilestone,
  } = useHabitStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [collapsedCats, setCollapsedCats] = useState<Set<Category>>(new Set());
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Active milestone celebration trigger state
  const [activeCel, setActiveCel] = useState<{ habitName: string; streakCount: number } | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const uppercaseFormattedToday = format(new Date(), "EEEE, MMMM d").toUpperCase();

  // Get active habits
  const activeHabits = habits.filter((h) => h.isActive);
  const totalCount = activeHabits.length;

  const todayLogs = logs[todayStr] || [];
  const completedCount = activeHabits.filter((h) => todayLogs.includes(h.id)).length;
  const actualPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Time-aware greetings
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) return "Good morning";
    if (hours >= 12 && hours < 17) return "Good afternoon";
    if (hours >= 17 && hours < 21) return "Good evening";
    return "Good night";
  };

  // 1. Monitor deletions and trigger 5-second fading Undo Toast
  useEffect(() => {
    if (lastDeleted) {
      setShowUndoToast(true);
      const timer = setTimeout(() => {
        setShowUndoToast(false);
        clearLastDeleted();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastDeleted]);

  // 2. Scan for uncelebrated milestones (3, 7, 14, 21, 30 day streaks) to open modal
  useEffect(() => {
    const milestones = [3, 7, 14, 21, 30];
    for (const h of activeHabits) {
      // Calculate current streak backward
      let streakCount = 0;
      let checkDate = new Date();
      const todayKey = format(checkDate, "yyyy-MM-dd");
      if (!logs[todayKey]?.includes(h.id)) {
        checkDate = addDays(checkDate, -1);
      }
      while (true) {
        const key = format(checkDate, "yyyy-MM-dd");
        if (logs[key]?.includes(h.id)) {
          streakCount++;
          checkDate = addDays(checkDate, -1);
        } else {
          break;
        }
      }

      if (milestones.includes(streakCount)) {
        const key = `${h.id}-${streakCount}`;
        if (!celebrated[key]) {
          setActiveCel({ habitName: h.name, streakCount });
          celebrateMilestone(h.id, streakCount);
          break; // trigger one at a time
        }
      }
    }
  }, [logs, habits, celebrated]);

  const toggleCategoryCollapse = (category: Category) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleCreateHabitSubmit = (habitData: {
    name: string;
    category: Category;
    color: string;
    emoji: string;
    goalDaysPerWeek: number;
  }) => {
    addHabit(habitData);
    setIsAddOpen(false);
  };

  const categoriesList: Category[] = ["health", "fitness", "study", "mindfulness", "productivity"];

  const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
  };

  // Order habits list: unchecked on top, checked at the bottom
  const orderHabits = (list: Habit[]) => {
    const unchecked = list.filter((h) => !todayLogs.includes(h.id));
    const checked = list.filter((h) => todayLogs.includes(h.id));
    return [...unchecked, ...checked];
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 select-none relative pb-16"
    >
      {/* Time greet / Date Wordmark */}
      <div id="today-view-header" className="flex justify-between items-start pt-2">
        <div className="space-y-0.5">
          <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-neutral-50 leading-tight">
            {getGreeting()}, {settings.userName || "Friend"} 👋
          </h2>
          <p className="text-[10px] font-extrabold text-[#7C9EFF] tracking-widest leading-none">
            {uppercaseFormattedToday}
          </p>
        </div>
        
        {/* wordmark top-right */}
        <div className="text-right leading-none">
          <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-gray-400 dark:text-neutral-500 block">
            CraftedByYours
          </span>
          <span className="text-[8px] font-bold text-gray-400/40 block mt-0.5">v1.1</span>
        </div>
      </div>

      {/* Daily achievements summary stats progress card */}
      {totalCount > 0 && (
        <div id="today-progress-card" className="progress-card p-5 space-y-3.5 relative">
          <div className="flex justify-between items-center select-none">
            <div className="space-y-0.5">
              <span className="block text-[10px] uppercase tracking-widest font-extrabold text-[#AAAAAA]">
                Daily Achievements
              </span>
              <span className="text-xs font-bold text-gray-600 dark:text-neutral-300">
                {completedCount} of {totalCount} habits completed today
              </span>
            </div>
            <div className="text-right">
              <span 
                className="text-xl font-black text-[#7C9EFF] font-mono"
              >
                {actualPercent}%
              </span>
            </div>
          </div>
          
          <ProgressBar value={actualPercent} color={settings.accentColor || "#7C9EFF"} height="h-2.5" />

          {/* celebration sweep shown inline below the bar under 100% completions */}
          {actualPercent === 100 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3.5 py-1.5 px-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold text-center inline-block"
            >
              🎉 Perfect day! You crushed it.
            </motion.div>
          )}
        </div>
      )}

      {/* Habit list sorting and filter controls */}
      {totalCount > 0 && (
        <div className="flex justify-between items-center pt-2">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#AAAAAA]">
            HABIT DIRECTORY
          </h3>
          <button
            type="button"
            id="toggle-group-btn"
            onClick={() => setGroupByCategory(!groupByCategory)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-gray-150 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-400 hover:border-gray-300 cursor-pointer transition-colors"
          >
            <ListFilter size={11} />
            <span>{groupByCategory ? "Show Single List" : "Group by Category"}</span>
          </button>
        </div>
      )}

      {/* Render Lists */}
      {totalCount === 0 ? (
        <div 
          id="today-empty-state" 
          className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-3xl min-h-[350px] shadow-sm"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-32 h-32 flex items-center justify-center text-[#7C9EFF]/20 mb-2"
          >
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" fill="currentColor" fillOpacity="0.08" />
              <path d="M5 6h2M5 11h2M5 16h2" strokeWidth="2" stroke="#9CA3AF" />
              <path d="M10 7h6M10 11h6" stroke="#9CA3AF" strokeOpacity="0.5" />
            </svg>
          </motion.div>
          
          <h3 className="text-base font-black text-gray-900 dark:text-neutral-100 tracking-tight mb-1">
            Rebuild your schedule
          </h3>
          <p className="text-xs font-semibold text-secondary max-w-[260px] mb-6">
            Add a habit using the FAB (+) button below. Focus on what brings value to your lifestyle.
          </p>
        </div>
      ) : groupByCategory ? (
        <div id="grouped-by-category-container" className="space-y-4">
          {categoriesList.map((cat) => {
            const catHabits = orderHabits(activeHabits.filter((h) => h.category === cat));
            if (catHabits.length === 0) return null;
            const isCollapsed = collapsedCats.has(cat);
            const styleValues = CATEGORY_STYLES[cat];

            return (
              <div key={cat} className="space-y-2 border border-gray-150/50 dark:border-neutral-800/50 rounded-2xl p-3 bg-white/40 dark:bg-neutral-900/30">
                {/* Category Header with Collapse action */}
                <div
                  onClick={() => toggleCategoryCollapse(cat)}
                  className="flex justify-between items-center cursor-pointer select-none py-1 px-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${styleValues.dot}`} />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                      {cat} ({catHabits.length})
                    </span>
                  </div>
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </div>

                {/* Habit Cards Grid inside categories */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {catHabits.map((habit) => (
                        <HabitCard key={habit.id} habit={habit} dateStr={todayStr} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <div id="single-flat-list-container" className="space-y-2">
          {orderHabits(activeHabits).map((habit) => (
            <HabitCard key={habit.id} habit={habit} dateStr={todayStr} />
          ))}
        </div>
      )}

      {/* Floating Action Button (FAB) bottom sheet creator toggle */}
      <button
        type="button"
        id="add-habit-fab"
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-safe shadow-lg right-6 w-14 h-14 bg-[#7C9EFF] hover:bg-[#688CEB] active:scale-95 text-white rounded-full flex items-center justify-center transition-all cursor-pointer z-40 group hover:rotate-90"
      >
        <Plus className="w-6 h-6 transform transition-transform duration-300" />
      </button>

      {/* Bottom Sheet Creator Modal */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Form New Habit"
      >
        <HabitForm onSubmit={handleCreateHabitSubmit} onCancel={() => setIsAddOpen(false)} />
      </BottomSheet>

      {/* Floating Streak celebration popover overlay modals */}
      {activeCel && (
        <StreakCelebration
          isOpen={true}
          habitName={activeCel.habitName}
          streakCount={activeCel.streakCount}
          onDismiss={() => setActiveCel(null)}
        />
      )}

      {/* 5-second slide-up Undo Toast */}
      <AnimatePresence>
        {showUndoToast && lastDeleted && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-4 left-4 right-4 md:left-[270px] md:right-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between text-white z-[60] shadow-2xl selection:bg-purple-500"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-[#7C9EFF]" />
              <span className="text-xs font-bold leading-none">
                Deleted habit "{lastDeleted.habit.name}"
              </span>
            </div>
            <button
              onClick={() => {
                restoreLastDeleted();
                setShowUndoToast(false);
              }}
              className="flex items-center gap-1.5 bg-[#7C9EFF]/20 hover:bg-[#7C9EFF]/35 border border-[#7C9EFF]/30 text-[#7C9EFF] px-3.5 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-extrabold cursor-pointer transition-colors"
            >
              <RotateCcw size={12} />
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

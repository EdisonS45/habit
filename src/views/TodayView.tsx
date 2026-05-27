import React, { useState, useEffect } from "react";
import { useHabitStore } from "../context/HabitContext";
import { format, addDays } from "date-fns";
import { HabitCard } from "../components/habits/HabitCard";
import { Flame, Sparkles, ChevronRight, RotateCcw, AlertCircle, Plus } from "lucide-react";
import { Category, Habit } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { StreakCelebration } from "../components/ui/StreakCelebration";
import { CircularProgress } from "../components/ui/CircularProgress";
import { BottomSheet } from "../components/ui/BottomSheet";
import { HabitForm } from "../components/habits/HabitForm";

export const TodayView: React.FC = () => {
  const {
    habits,
    logs,
    settings,
    celebrated,
    toggleLog,
    lastDeleted,
    restoreLastDeleted,
    clearLastDeleted,
    celebrateMilestone,
    addHabit,
  } = useHabitStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("flat");

  const getCategoryColor = (cat: Category) => {
    switch (cat) {
      case "health": return "#10B981"; // emerald
      case "fitness": return "#EF4444"; // red
      case "study": return "#3B82F6"; // blue
      case "mindfulness": return "#8B5CF6"; // violet
      case "productivity": return "#F59E0B"; // amber
      default: return "#9CA3AF";
    }
  };

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

  // Clean, fast, incredibly calm greeting text
  const getGreetingText = () => {
    const hours = new Date().getHours();
    const name = settings.userName?.trim() || "Friend";
    if (hours >= 5 && hours < 12) return `Good morning, ${name}`;
    if (hours >= 12 && hours < 17) return `Ready for today, ${name}?`;
    if (hours >= 17 && hours < 21) return `Good evening, ${name}`;
    return `Let’s begin, ${name}`;
  };

  // Find next up incomplete habit
  const nextUpHabit = activeHabits.find((h) => !todayLogs.includes(h.id));

  // Determine maximum active habit streak
  const getMaximumActiveStreak = (): number => {
    let max = 0;
    activeHabits.forEach((h) => {
      let count = 0;
      let checkDate = new Date();
      const todayKey = format(checkDate, "yyyy-MM-dd");
      if (!logs[todayKey]?.includes(h.id)) {
        checkDate = addDays(checkDate, -1);
      }
      while (true) {
        const key = format(checkDate, "yyyy-MM-dd");
        if (logs[key]?.includes(h.id)) {
          count++;
          checkDate = addDays(checkDate, -1);
        } else {
          break;
        }
      }
      if (count > max) max = count;
    });
    return max;
  };

  const activeMaxStreak = getMaximumActiveStreak();

  // Get dynamic focus status pace
  const getPaceText = () => {
    if (totalCount === 0) return "No habits";
    if (actualPercent === 100) return "Done for today!";
    if (actualPercent >= 66) return "Fluid pace";
    if (actualPercent >= 33) return "Balanced pace";
    return "Calm pace";
  };
  const paceText = getPaceText();

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
      className="space-y-6 select-none relative pb-10"
    >
      {/* Premium Minimal Header with Overall Completion */}
      <div id="today-view-header" className="flex items-center justify-between pt-1 select-none">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-neutral-55 leading-none">
            {getGreetingText()}
          </h2>
          <p className="text-xs font-bold text-gray-400 dark:text-neutral-500 tracking-wide mt-1.5 uppercase">
            {uppercaseFormattedToday}
          </p>
        </div>
        
        {totalCount > 0 && (
          <div className="shrink-0 pr-1 select-none">
            <CircularProgress 
              percentage={actualPercent} 
              size={44} 
              strokeWidth={2.5} 
              showText={true} 
            />
          </div>
        )}
      </div>

      {/* Redesigned Ambient Stats Pill Strip */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-neutral-800 bg-white dark:bg-[#161616] border border-gray-100 dark:border-neutral-850/80 p-3.5 rounded-[24px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.015)] text-center select-none">
        <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-gray-700 dark:text-neutral-300">
          <Flame size={13} className="text-amber-500 fill-amber-500" />
          <span>{activeMaxStreak} day streak</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-gray-700 dark:text-neutral-300">
          <span className="text-xs">⚡</span>
          <span>{totalCount - completedCount} habits left</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-gray-700 dark:text-neutral-300">
          <span className="text-xs">🌱</span>
          <span>{paceText}</span>
        </div>
      </div>

      {/* TODAY Title Row, Filter View, & Add Habit Button */}
      <div className="flex items-center justify-between pt-2 select-none">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black tracking-widest text-[#888888] uppercase select-none">TODAY</span>
          
          {totalCount > 0 && (
            <div className="flex items-center bg-gray-50 dark:bg-neutral-900 border border-gray-150/40 dark:border-neutral-850/80 p-0.5 rounded-full text-[10px] font-bold select-none shadow-3xs">
              <button
                type="button"
                onClick={() => setViewMode("flat")}
                className={`px-2.5 py-0.5 rounded-full transition-all duration-150 cursor-pointer text-[9px] font-extrabold uppercase ${
                  viewMode === "flat"
                    ? "bg-white dark:bg-neutral-800 text-[#7C9EFF] dark:text-white shadow-3xs border border-gray-100 dark:border-neutral-750"
                    : "text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 border border-transparent"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grouped")}
                className={`px-2.5 py-0.5 rounded-full transition-all duration-150 cursor-pointer text-[9px] font-extrabold uppercase ${
                  viewMode === "grouped"
                    ? "bg-white dark:bg-neutral-800 text-[#7C9EFF] dark:text-white shadow-3xs border border-gray-100 dark:border-neutral-750"
                    : "text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 border border-transparent"
                }`}
              >
                Categories
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          id="today-add-habit-btn"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4.5 py-1.5 rounded-full border border-gray-150 dark:border-neutral-800 bg-white dark:bg-[#161616] text-[11px] font-extrabold text-gray-700 dark:text-neutral-300 hover:bg-gray-50/50 dark:hover:bg-neutral-850 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <Plus size={11} strokeWidth={3} />
          <span>Add Habit</span>
        </button>
      </div>

      {/* Perfect Day Accomplishment Ribbon (100% complete) */}
      {actualPercent === 100 && totalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 3 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="py-3 px-4.5 rounded-[22px] bg-emerald-500/[0.04] border border-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between shadow-2xs select-none"
        >
          <span className="flex items-center gap-2">
            <span className="text-sm select-none">✨</span>
            <span className="font-bold">A completely quiet, satisfying day accomplished.</span>
          </span>
          <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
            Quiet Pride
          </span>
        </motion.div>
      )}

      {/* Main Directory List container */}
      {totalCount === 0 ? (
        <div 
          id="today-empty-state" 
          className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-850 rounded-[28px] min-h-[300px] shadow-sm select-none"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-24 h-24 flex items-center justify-center text-[#7C9EFF]/20 mb-2"
          >
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" fill="currentColor" fillOpacity="0.08" />
              <path d="M5 6h2M5 11h2M5 16h2" strokeWidth="2" stroke="#9CA3AF" />
              <path d="M10 7h6M10 11h6" stroke="#9CA3AF" strokeOpacity="0.5" />
            </svg>
          </motion.div>
          
          <h3 className="text-sm font-black text-gray-900 dark:text-neutral-100 tracking-tight mb-1">
            Rebuild your schedule
          </h3>
          <p className="text-xs font-semibold text-secondary max-w-[260px] mb-6 leading-normal">
            Add a habit to focus on today. Keep it simple and stress-free.
          </p>
        </div>
      ) : viewMode === "flat" ? (
        <div id="single-flat-list-container" className="space-y-4">
          {orderHabits(activeHabits).map((habit) => (
            <HabitCard key={habit.id} habit={habit} dateStr={todayStr} />
          ))}
        </div>
      ) : (
        <div id="grouped-by-category-container" className="space-y-6">
          {(["health", "fitness", "productivity", "mindfulness", "study"] as Category[]).map((cat) => {
            const catHabits = orderHabits(activeHabits.filter((h) => h.category === cat));
            if (catHabits.length === 0) return null;

            return (
              <div key={cat} className="space-y-3 pt-1">
                {/* Minimal premium category subtitle header */}
                <div className="flex items-center gap-2 pl-1 select-none animate-fade-in">
                  <span 
                    className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" 
                    style={{ backgroundColor: getCategoryColor(cat) }} 
                  />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500">
                    {cat}
                  </h4>
                  <div className="h-[1px] bg-gray-150/40 dark:bg-neutral-850/60 flex-1 ml-2 opacity-30" />
                </div>
                
                {/* Category Habit Cards list */}
                <div className="space-y-4">
                  {catHabits.map((habit) => (
                    <HabitCard key={habit.id} habit={habit} dateStr={todayStr} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reduced-choice ADHD "Next Best Action" Banner */}
      {nextUpHabit && (
        <div 
          id="next-action-strip" 
          onClick={() => toggleLog(nextUpHabit.id, todayStr)}
          className="bg-[#FCFAF4] hover:bg-[#FAF6EB] dark:bg-amber-400/[0.02] border border-[#F2EFE6] dark:border-amber-400/10 p-5 rounded-[28px] flex items-center justify-between gap-4 text-xs select-none shadow-[0_2px_18px_-4px_rgba(0,0,0,0.01)] transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] duration-150"
        >
          <div className="flex flex-col text-left min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 flex items-center gap-1.5 mb-1">
              <Sparkles size={11} className="animate-pulse" />
              <span>NEXT BEST ACTION</span>
            </span>
            <span className="font-extrabold text-[15px] text-gray-950 dark:text-neutral-100 truncate mt-0.5">
              Complete your {nextUpHabit.name}
            </span>
          </div>
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-white dark:bg-neutral-850 border border-gray-100 dark:border-neutral-805 flex items-center justify-center text-amber-500 shadow-md transform group-hover:translate-x-1 transition-transform cursor-pointer shrink-0"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Add Habit BottomSheet overlay */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create a Habit"
      >
        <HabitForm
          onSubmit={(habitData) => {
            addHabit(habitData);
            setIsAddOpen(false);
          }}
          onCancel={() => setIsAddOpen(false)}
        />
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


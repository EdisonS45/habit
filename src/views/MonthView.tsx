import React, { useState, useMemo } from "react";
import { useHabitStore } from "../context/HabitContext";
import { format, addMonths, subMonths, eachDayOfInterval, startOfMonth, endOfMonth, parseISO, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, Award, Flame, Zap, CheckCircle2 } from "lucide-react";
import { HeatmapCalendar } from "../components/charts/HeatmapCalendar";
import { BottomSheet } from "../components/ui/BottomSheet";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Habit } from "../types";
import { motion } from "framer-motion";

export const MonthView: React.FC = () => {
  const { habits, logs, toggleLog, settings } = useHabitStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Track selected day detail date string
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  const prevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const monthLabel = format(currentMonth, "MMMM yyyy");

  const activeHabits = habits.filter((h) => h.isActive);
  const totalActiveCount = activeHabits.length;

  const startOfSelected = startOfMonth(currentMonth);
  const endOfSelected = endOfMonth(currentMonth);

  const daysInSelectedMonth = eachDayOfInterval({
    start: startOfSelected,
    end: endOfSelected,
  });

  const totalDaysInSelectedMonth = daysInSelectedMonth.length;

  // --- MONTH LEVEL CALCULATIONS ---
  const monthAnalytics = useMemo(() => {
    let totalCompletions = 0;
    let fullCompletionDays = 0;

    const habitCompletedCount: Record<string, number> = {};
    activeHabits.forEach((h) => {
      habitCompletedCount[h.id] = 0;
    });

    daysInSelectedMonth.forEach((day) => {
      const dStr = format(day, "yyyy-MM-dd");
      const list = logs[dStr] || [];
      const validInDay = list.filter((id) => activeHabits.some((h) => h.id === id));
      
      totalCompletions += validInDay.length;

      validInDay.forEach((hId) => {
        if (habitCompletedCount[hId] !== undefined) {
          habitCompletedCount[hId]++;
        }
      });

      if (totalActiveCount > 0 && validInDay.length >= totalActiveCount) {
        fullCompletionDays++;
      }
    });

    let mostConsistentHabit: { habit: Habit; rate: number } | null = null;
    let maxLogs = -1;

    activeHabits.forEach((h) => {
      const completedDaysCount = habitCompletedCount[h.id] || 0;
      const rate = Math.round((completedDaysCount / totalDaysInSelectedMonth) * 100);
      if (completedDaysCount > maxLogs) {
        maxLogs = completedDaysCount;
        mostConsistentHabit = { habit: h, rate };
      }
    });

    // Compute longest streak across all habits
    let bestStreak = 0;
    activeHabits.forEach((h) => {
      // Calculate current streak backward from today
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
      if (count > bestStreak) {
        bestStreak = count;
      }
    });

    const sortedProgress = activeHabits
      .map((h) => {
        const complCount = habitCompletedCount[h.id] || 0;
        const rate = Math.round((complCount / totalDaysInSelectedMonth) * 100);
        return {
          habit: h,
          completions: complCount,
          percentage: rate,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);

    return {
      totalCompletions,
      fullCompletionDays,
      bestStreak,
      mostConsistentHabit,
      sortedProgress,
    };
  }, [logs, habits, activeHabits, daysInSelectedMonth, totalActiveCount, totalDaysInSelectedMonth]);

  const handleSelectedDay = (dateStr: string) => {
    setSelectedDayStr(dateStr);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.2 } }
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      id="month-view" 
      className="space-y-6 select-none"
    >
      {/* Month Navigation Row */}
      <div id="month-nav-row" className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 p-3 rounded-2xl shadow-xs">
        <button
          onClick={prevMonth}
          className="p-2 border border-gray-150 dark:border-neutral-800 rounded-lg bg-gray-50 dark:bg-neutral-850 hover:bg-gray-100 text-gray-700 dark:text-neutral-300 transition-colors cursor-pointer animate-none"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-gray-850 dark:text-neutral-100 uppercase tracking-widest leading-none">
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          className="p-2 border border-gray-150 dark:border-neutral-800 rounded-lg bg-gray-50 dark:bg-neutral-850 hover:bg-gray-100 text-gray-700 dark:text-neutral-300 transition-colors cursor-pointer animate-none"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 2x2 Stats Summary Card Grid */}
      <div id="month-summary-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total completions */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="block text-[9px] uppercase font-black text-gray-400 dark:text-neutral-500 tracking-wider">
              Total Logs
            </span>
            <span className="block text-lg font-black text-gray-800 dark:text-neutral-100 leading-tight">
              {monthAnalytics.totalCompletions}
            </span>
          </div>
        </div>

        {/* Card 2: Best streak */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            <Flame size={18} />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="block text-[9px] uppercase font-black text-gray-400 dark:text-neutral-500 tracking-wider">
              Best Streak
            </span>
            <span className="block text-lg font-black text-gray-800 dark:text-neutral-100 leading-tight font-mono">
              {monthAnalytics.bestStreak}d
            </span>
          </div>
        </div>

        {/* Card 3: Most consistent */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4 rounded-2xl shadow-xs flex items-center gap-3 col-span-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Award size={18} />
          </div>
          <div className="min-w-0 truncate leading-tight">
            <span className="block text-[9px] uppercase font-black text-gray-400 dark:text-neutral-500 tracking-wider">
              Consistent
            </span>
            <span className="block text-xs font-black text-gray-800 dark:text-neutral-100 truncate">
              {monthAnalytics.mostConsistentHabit
                ? `${monthAnalytics.mostConsistentHabit.habit.emoji} ${monthAnalytics.mostConsistentHabit.habit.name}`
                : "None yet"}
            </span>
            {monthAnalytics.mostConsistentHabit && (
              <span className="text-[9px] font-bold text-emerald-500 block uppercase tracking-wider">
                {monthAnalytics.mostConsistentHabit.rate}% rate
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Perfect days */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Zap size={18} />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="block text-[9px] uppercase font-black text-gray-400 dark:text-neutral-500 tracking-wider">
              Perfect Days
            </span>
            <span className="block text-lg font-black text-gray-800 dark:text-neutral-100">
              {monthAnalytics.fullCompletionDays}
            </span>
          </div>
        </div>
      </div>

      {/* Grid calendar view and horizontal sorted progress lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Heatmap module */}
        <div className="md:col-span-2">
          <HeatmapCalendar currentMonth={currentMonth} onSelectedDay={handleSelectedDay} />
        </div>

        {/* Per-habit monthly lists */}
        <div id="month-habits-progress" className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-5 shadow-xs flex flex-col">
          <h4 className="text-[10px] font-extrabold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-4">
            COMPLETIONS RATE
          </h4>

          {monthAnalytics.sortedProgress.length === 0 ? (
            <div className="text-center py-10 text-xs font-bold text-gray-400 dark:text-neutral-500 flex-1 flex items-center justify-center">
              No active habits tracking currently.
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto flex-1 pr-1 border-t border-transparent">
              {monthAnalytics.sortedProgress.map(({ habit, completions, percentage }) => (
                <div key={habit.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 min-w-0 font-bold text-gray-700 dark:text-neutral-300">
                      <span className="select-none">{habit.emoji}</span>
                      <span className="truncate">{habit.name}</span>
                    </div>
                    <div className="shrink-0 font-extrabold text-gray-500 font-mono text-[11px]">
                      <span>{percentage}%</span>
                      <span className="text-[10px] text-gray-300 font-bold ml-1 select-none">
                        ({completions}d)
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={percentage} color={habit.color} height="h-1.5" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tapped Day Detail Modal drawer checklist logging switcher */}
      <BottomSheet
        isOpen={selectedDayStr !== null}
        onClose={() => setSelectedDayStr(null)}
        title={selectedDayStr ? `Log checklist for ${format(parseISO(selectedDayStr), "MMMM d, yyyy")}` : "Daily Log"}
      >
        {selectedDayStr && (
          <div className="space-y-4 select-none text-left">
            {activeHabits.length === 0 ? (
              <div className="text-center py-6 text-xs text-secondary font-bold">
                No active tracking habits. Build habits in the 'Today tracking' view first.
              </div>
            ) : (
              <div className="space-y-2.5">
                <span className="block text-[10px] font-extrabold text-[#AAAAAA] uppercase tracking-widest mb-2">
                  Retroactive Tracking for {format(parseISO(selectedDayStr), "MMM d, yyyy")}
                </span>
                <div className="space-y-2">
                  {activeHabits.map((h) => {
                    const isChecked = logs[selectedDayStr]?.includes(h.id);
                    return (
                      <div
                        key={h.id}
                        onClick={() => toggleLog(h.id, selectedDayStr)}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-850 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-150 dark:border-neutral-800 rounded-2xl cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg shrink-0">{h.emoji}</span>
                          <span className={`text-xs font-bold truncate ${isChecked ? 'line-through text-gray-400 dark:text-neutral-500' : 'text-gray-800 dark:text-neutral-100'}`}>
                            {h.name}
                          </span>
                        </div>
                        
                        <div
                          style={{
                            borderColor: isChecked ? h.color : undefined,
                            backgroundColor: isChecked ? h.color : "transparent",
                          }}
                          className="w-[22px] h-[22px] rounded-full border-2 border-gray-300 dark:border-neutral-700 flex items-center justify-center shrink-0 transition-all"
                        >
                          {isChecked && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-white font-black leading-none shrink-0">
                              <path
                                d="M5 13l4 4L19 7"
                                stroke="currentColor"
                                strokeWidth="4.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </motion.div>
  );
};

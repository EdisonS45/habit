import React, { useState, useMemo } from "react";
import { useHabitStore } from "../context/HabitContext";
import { format, addMonths, subMonths, eachDayOfInterval, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Award, Flame, Zap, CheckCircle2 } from "lucide-react";
import { HeatmapCalendar } from "../components/charts/HeatmapCalendar";
import { BottomSheet } from "../components/ui/BottomSheet";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Habit } from "../types";
import { motion } from "framer-motion";

export const MonthView: React.FC = () => {
  const { habits, logs, getLongestStreakForHabit } = useHabitStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Tapped Day Detail Modal
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ dateStr: string; completedHabits: Habit[] } | null>(null);

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

    let bestStreak = 0;
    activeHabits.forEach((h) => {
      const hStreak = getLongestStreakForHabit(h.id);
      if (hStreak > bestStreak) {
        bestStreak = hStreak;
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
  }, [logs, activeHabits, daysInSelectedMonth, totalActiveCount, totalDaysInSelectedMonth, getLongestStreakForHabit]);

  const handleSelectedDay = (dateStr: string, completedHabits: Habit[]) => {
    setSelectedDayInfo({
      dateStr,
      completedHabits,
    });
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
          className="p-2 border border-gray-150 dark:border-neutral-800 rounded-lg bg-gray-50 dark:bg-neutral-850 hover:bg-gray-100 text-gray-700 dark:text-neutral-300 transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-gray-850 dark:text-neutral-100 uppercase tracking-widest">
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          className="p-2 border border-gray-150 dark:border-neutral-800 rounded-lg bg-gray-50 dark:bg-neutral-850 hover:bg-gray-100 text-gray-700 dark:text-neutral-300 transition-colors cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 2x2 Stats Summary Card Grid */}
      <div id="month-summary-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total completions */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">
              Total Logs
            </span>
            <span className="block text-xl font-extrabold text-gray-800 dark:text-neutral-100 leading-tight">
              {monthAnalytics.totalCompletions}
            </span>
          </div>
        </div>

        {/* Card 2: Best streak */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            <Flame size={20} />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">
              Best Streak
            </span>
            <span className="block text-xl font-extrabold text-gray-800 dark:text-neutral-100 leading-tight">
              {monthAnalytics.bestStreak}d
            </span>
          </div>
        </div>

        {/* Card 3: Most consistent */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4 rounded-2xl shadow-xs flex items-center gap-3 col-span-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Award size={20} />
          </div>
          <div className="min-w-0 truncate">
            <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">
              Consistent
            </span>
            <span className="block text-xs font-bold text-gray-800 dark:text-neutral-100 leading-tight truncate">
              {monthAnalytics.mostConsistentHabit
                ? `${monthAnalytics.mostConsistentHabit.habit.emoji} ${monthAnalytics.mostConsistentHabit.habit.name}`
                : "None yet"}
            </span>
            {monthAnalytics.mostConsistentHabit && (
              <span className="text-[10px] font-semibold text-emerald-500 block">
                {monthAnalytics.mostConsistentHabit.rate}% rate
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Perfect days */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Zap size={20} />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">
              Perfect Days
            </span>
            <span className="block text-xl font-extrabold text-gray-800 dark:text-neutral-100 leading-tight">
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
        <div id="month-habits-progress" className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-4 md:p-6 shadow-xs flex flex-col">
          <h4 className="text-sm font-extrabold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-4">
            Completions Rate
          </h4>

          {monthAnalytics.sortedProgress.length === 0 ? (
            <div className="text-center py-10 text-xs font-semibold text-gray-400 dark:text-neutral-500 flex-1 flex items-center justify-center">
              No active habits tracking currently.
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto flex-1 pr-1">
              {monthAnalytics.sortedProgress.map(({ habit, completions, percentage }) => (
                <div key={habit.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 min-w-0 font-bold text-gray-700 dark:text-neutral-300">
                      <span>{habit.emoji}</span>
                      <span className="truncate">{habit.name}</span>
                    </div>
                    <div className="shrink-0 font-bold text-gray-500">
                      <span>{percentage}%</span>
                      <span className="text-[10px] text-gray-300 font-semibold ml-1">
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

      {/* Tapped Day Detail Modal drawer */}
      <BottomSheet
        isOpen={selectedDayInfo !== null}
        onClose={() => setSelectedDayInfo(null)}
        title={selectedDayInfo ? `Logs for ${format(parseISO(selectedDayInfo.dateStr), "MMMM d, yyyy")}` : "Daily Log"}
      >
        {selectedDayInfo && (
          <div className="space-y-4 select-none">
            {selectedDayInfo.completedHabits.length === 0 ? (
              <div className="text-center py-6 text-sm text-secondary font-medium">
                No checked logs recorded for this day. 🌿
              </div>
            ) : (
              <div className="space-y-2.5">
                <span className="block text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
                  Completed List ({selectedDayInfo.completedHabits.length})
                </span>
                {selectedDayInfo.completedHabits.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl"
                  >
                    <span className="text-xl shrink-0">{h.emoji}</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-neutral-200 truncate">
                      {h.name}
                    </span>
                    <span
                      style={{ backgroundColor: h.color }}
                      className="w-2.5 h-2.5 rounded-full ml-auto shrink-0"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </motion.div>
  );
};

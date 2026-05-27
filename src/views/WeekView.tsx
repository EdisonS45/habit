import React, { useState } from "react";
import { useHabitStore } from "../context/HabitContext";
import { format, startOfWeek, addDays, subDays, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Check, Flame } from "lucide-react";
import { WeeklyBarChart } from "../components/charts/WeeklyBarChart";
import { CircularProgress } from "../components/ui/CircularProgress";
import { motion } from "framer-motion";
import { getStreak } from "../hooks/useAnalytics";

export const WeekView: React.FC = () => {
  const { habits, logs, toggleLog, settings } = useHabitStore();
  
  // Weekly navigation anchor state
  const [refDate, setRefDate] = useState(new Date());

  const activeHabits = habits.filter((h) => h.isActive);
  const totalCount = activeHabits.length;

  const currentMon = startOfWeek(refDate, { weekStartsOn: 1 });
  const currentSun = addDays(currentMon, 6);

  const prevWeek = () => setRefDate((prev) => subDays(prev, 7));
  const nextWeek = () => setRefDate((prev) => addDays(prev, 7));

  // Range Label
  const rangeLabel = `${format(currentMon, "MMM d")} – ${format(currentSun, "MMM d, yyyy")}`;

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(currentMon, i));

  // Construct data for Weekly Bar Chart
  const chartData = weekDates.map((wDate) => {
    const dStr = format(wDate, "yyyy-MM-dd");
    const dayLogs = logs[dStr] || [];
    const validCount = dayLogs.filter((id) => activeHabits.some((h) => h.id === id)).length;
    return {
      day: format(wDate, "EEE"),
      completions: validCount,
    };
  });

  let totalCompletionsThisWeek = 0;
  weekDates.forEach((wDate) => {
    const dStr = format(wDate, "yyyy-MM-dd");
    const dayLogs = logs[dStr] || [];
    totalCompletionsThisWeek += dayLogs.filter((id) => activeHabits.some((h) => h.id === id)).length;
  });

  const weekConsistencyScore = totalCount > 0 
    ? Math.round((totalCompletionsThisWeek / (totalCount * 7)) * 100) 
    : 0;

  const isFuture = (date: Date) => {
    const today = new Date();
    const check = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const normalizeToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return check.getTime() > normalizeToday.getTime();
  };

  const handleCellClick = (habitId: string, wDate: Date) => {
    if (isFuture(wDate)) return;
    const dStr = format(wDate, "yyyy-MM-dd");
    toggleLog(habitId, dStr);
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
      id="week-view" 
      className="space-y-6 select-none"
    >
      {/* Week selection navigation */}
      <div id="week-nav-bar" className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 p-3 rounded-2xl shadow-xs">
        <button
          onClick={prevWeek}
          className="p-2 border border-gray-150 dark:border-neutral-800 rounded-lg bg-gray-50 dark:bg-neutral-850 hover:bg-gray-100 text-gray-700 dark:text-neutral-300 transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-gray-850 dark:text-neutral-100 uppercase tracking-widest">
          {rangeLabel}
        </span>
        <button
          onClick={nextWeek}
          className="p-2 border border-gray-150 dark:border-neutral-800 rounded-lg bg-gray-50 dark:bg-neutral-850 hover:bg-gray-100 text-gray-700 dark:text-neutral-300 transition-colors cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Row showing weekly metric stats card and chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Large premium circular consistency score ring */}
        <div id="week-metric-card" className="stats-card p-6 shadow-xs flex flex-col justify-center items-center text-center space-y-4">
          <span className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest block">
            Weekly Consistency
          </span>
          <CircularProgress
            percentage={weekConsistencyScore}
            size={110}
            strokeWidth={9}
            color={settings.accentColor || "#7C9EFF"}
            showText={true}
          />
          <p className="text-[11px] text-secondary max-w-xs font-semibold leading-relaxed">
            Score is based on completed checks of {totalCount} active habits over this 7-day period.
          </p>
        </div>

        {/* Weekly Bar Chart */}
        <div className="md:col-span-2">
          <WeeklyBarChart data={chartData} color={settings.accentColor || "#7C9EFF"} />
        </div>
      </div>

      {/* Interactive Habit Grid Table */}
      <div id="grid-sheet-card" className="stats-card p-4 md:p-6 shadow-xs space-y-4">
        <h4 className="text-[11px] font-extrabold text-[#7C9EFF] uppercase tracking-[0.12em]">
          Weekly Grid Board
        </h4>

        {totalCount === 0 ? (
          <div className="text-center py-6 text-xs text-secondary font-medium">
            No active habits configured. Configure habits first to inspect consistency logs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[640px] space-y-3">
              {/* Table Header: Weekday column layout */}
              <div className="grid grid-cols-12 gap-2 text-center text-[10px] font-extrabold text-gray-450 uppercase tracking-widest pb-2.5 border-b border-gray-100 dark:border-neutral-800">
                <div className="col-span-4 text-left pl-2">Habit</div>
                {weekdays.map((wd, idx) => (
                  <div key={wd} className="col-span-1">
                    <div>{wd}</div>
                    <div className="text-[10px] text-gray-300 dark:text-neutral-600 font-bold">{format(weekDates[idx], "d")}</div>
                  </div>
                ))}
                <div className="col-span-1">Goal</div>
              </div>

              {/* Grid Record Rows */}
              {activeHabits.map((habit) => {
                let habitCompletionsThisWeek = 0;
                weekDates.forEach((wDate) => {
                  const dStr = format(wDate, "yyyy-MM-dd");
                  const dayLogs = logs[dStr] || [];
                  if (dayLogs.includes(habit.id)) {
                    habitCompletionsThisWeek++;
                  }
                });

                const currentStreak = getStreak(habit.id, logs);

                return (
                  <div
                    key={habit.id}
                    id={`grid-row-${habit.id}`}
                    className="grid grid-cols-12 gap-2 items-center text-center p-1.5 hover:bg-gray-50/50 dark:hover:bg-neutral-850/20 rounded-xl transition-all border border-transparent"
                  >
                    {/* Habit Profile Column */}
                    <div className="col-span-4 text-left flex items-center gap-2 min-w-0 pl-1">
                      <span className="text-lg shrink-0 select-none">{habit.emoji}</span>
                      <div className="truncate min-w-0">
                        <span className="block text-sm font-bold truncate text-gray-800 dark:text-neutral-200">
                          {habit.name}
                        </span>
                        {currentStreak > 0 && (
                          <span className="inline-flex items-center text-[10px] text-orange-500 font-bold gap-0.5">
                            <Flame size={10} fill="currentColor" />
                            {currentStreak}d
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mon - Sun cells with spring scaling button feedback */}
                    {weekDates.map((wDate) => {
                      const dStr = format(wDate, "yyyy-MM-dd");
                      const done = (logs[dStr] || []).includes(habit.id);
                      const isFutureDay = isFuture(wDate);
                      const isTodayDay = isToday(wDate);

                      return (
                        <div key={dStr} className="col-span-1 flex justify-center">
                          <motion.button
                            type="button"
                            whileHover={{ scale: isFutureDay ? 1 : 1.15 }}
                            whileTap={{ scale: isFutureDay ? 1 : 0.85 }}
                            id={`grid-cell-${habit.id}-${dStr}`}
                            onClick={() => handleCellClick(habit.id, wDate)}
                            disabled={isFutureDay}
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                              isFutureDay
                                ? "border-transparent bg-gray-50 dark:bg-neutral-850/10 text-transparent cursor-not-allowed"
                                : done
                                ? "text-white"
                                : "hover:border-gray-400 dark:hover:border-neutral-600 border-gray-150 dark:border-neutral-800 bg-transparent cursor-pointer"
                            } ${isTodayDay && !done ? "ring-2 ring-emerald-400" : ""}`}
                            style={{
                              backgroundColor: done ? habit.color : undefined,
                              borderColor: done ? habit.color : undefined,
                            }}
                          >
                            {done ? <Check size={14} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-neutral-700" />}
                          </motion.button>
                        </div>
                      );
                    })}

                    {/* Weekly Target metrics column */}
                    <div className="col-span-1 font-semibold text-xs text-gray-500">
                      <span className="block font-bold text-gray-800 dark:text-neutral-300">
                        {habitCompletionsThisWeek}d
                      </span>
                      <span className="text-[10px] text-gray-400">
                        / {habit.goalDaysPerWeek}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

import React, { useState } from "react";
import { useHabitStore } from "../context/HabitContext";
import { format, startOfWeek, addDays, subDays, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Check, Flame } from "lucide-react";
import { WeeklyBarChart } from "../components/charts/WeeklyBarChart";
import { CircularProgress } from "../components/ui/CircularProgress";
import { motion } from "framer-motion";
import { getStreak } from "../hooks/useAnalytics";
import { Tooltip } from "../components/ui/Tooltip";

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

  // Total logged days across entire history to detect learning state
  const totalLoggedInDays = Object.keys(logs).filter((key) => logs[key] && logs[key].length > 0).length;

  // Count how many distinct days in this week had at least 1 check completed
  let uniqueDaysShownUp = 0;
  weekDates.forEach((wDate) => {
    const dStr = format(wDate, "yyyy-MM-dd");
    const dayLogs = logs[dStr] || [];
    const completedOnThisDay = dayLogs.some((id) => activeHabits.some((h) => h.id === id));
    if (completedOnThisDay) {
      uniqueDaysShownUp++;
    }
  });

  const hasFewerThan7DaysData = totalLoggedInDays < 7;

  // Narratives based on days shown up
  const progressText = uniqueDaysShownUp === 0
    ? "Ready to build momentum? Let's take one tiny step today."
    : uniqueDaysShownUp === 1
    ? "You showed up 1 day this week — that counts! Excellent start."
    : `You showed up ${uniqueDaysShownUp} days this week — look at that momentum building!`;

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
        {/* Dynamic, ADHD-Friendly Weekly Momentum Card */}
        <div id="week-metric-card" className="stats-card p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-4 bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800">
          {hasFewerThan7DaysData ? (
            <div className="space-y-3.5 py-2 animate-fade-in text-left md:text-center">
              <span className="text-3xl block select-none mb-1 text-center">🌱</span>
              <h5 className="text-[11px] font-extrabold text-[#7C9EFF] dark:text-[#9FB7FF] uppercase tracking-wider text-center block">
                Your Momentum Is Loading
              </h5>
              <div className="space-y-1.5">
                <p className="text-xs font-black text-gray-800 dark:text-neutral-150 text-center leading-snug">
                  Habits are built day by day.
                </p>
                <p className="text-[10px] text-gray-500 dark:text-neutral-400 font-semibold leading-relaxed text-center">
                  Consistency is a practice, not a score. Check in on habits dynamically to light up your momentum board. You're doing great!
                </p>
              </div>
              <div className="pt-1.5 flex justify-center">
                <span className="px-3 py-1 bg-[#7C9EFF]/10 text-[#7293FD] border border-[#7C9EFF]/20 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                  Tiny Starts count
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4 animate-fade-in text-left">
              <span className="text-xs font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest pl-1 inline-flex items-center gap-1.5 align-middle">
                Your Weekly Momentum
                <Tooltip content="Tracks how many days this week you completed or skipped at least one active habit to secure your streak." />
              </span>
              
              {/* Custom visual momentum bar filling up */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-wider text-gray-850 dark:text-neutral-205 pl-1 pr-1">
                  <span>Progress Bar</span>
                  <span style={{ color: settings.accentColor }}>{uniqueDaysShownUp} of 7 days</span>
                </div>
                <div className="w-full h-3.5 bg-gray-100 dark:bg-neutral-950 border border-gray-150 dark:border-neutral-800/80 rounded-2xl overflow-hidden p-0.5 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(uniqueDaysShownUp / 7) * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{ backgroundColor: settings.accentColor || "#7C9EFF" }}
                    className="h-full rounded-2xl shadow-3xs"
                  />
                </div>
              </div>

              {/* Narratives of days loaded */}
              <div className="bg-gray-50/50 dark:bg-neutral-950/40 border border-gray-150 dark:border-neutral-800/60 p-3 rounded-2xl space-y-1">
                <span className="text-[9px] font-extrabold uppercase text-[#7C9EFF] tracking-wider block">
                  Weekly Narrative
                </span>
                <p className="text-[11px] text-gray-700 dark:text-neutral-300 font-bold leading-relaxed">
                  {progressText}
                </p>
              </div>

              <p className="text-[10px] text-secondary font-semibold leading-relaxed pl-1">
                This tracking accounts for at least one checked off activity of {totalCount} habits configured over the 7-day period.
              </p>
            </div>
          )}
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

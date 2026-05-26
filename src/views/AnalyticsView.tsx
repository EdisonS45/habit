import React, { useState, useMemo } from "react";
import { useHabitStore } from "../context/HabitContext";
import { useAnalytics } from "../hooks/useAnalytics";
import { TrendLineChart } from "../components/charts/TrendLineChart";
import { HeatmapCalendar } from "../components/charts/HeatmapCalendar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";

export const AnalyticsView: React.FC = () => {
  const { habits, getTodayCompletedCount, getTotalCompletedAllTime, settings } = useHabitStore();
  
  const [selectedHabitId, setSelectedHabitId] = useState<string>("all");
  const [individualInterval, setIndividualInterval] = useState<7 | 30 | 90>(30);

  const activeHabits = habits.filter((h) => h.isActive);
  const totalTrackedHabits = habits.length;

  // Analytics API
  const { categoryAnalytics, streaksLeaderboard, monthlyCompletionTrend, individualHabitStats } = 
    useAnalytics(selectedHabitId !== "all" ? selectedHabitId : undefined);

  // Global maximum longest streak ever
  const maxLongestStreakEver = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(0, ...streaksLeaderboard.map((item) => item.longestStreak ?? 0));
  }, [habits, streaksLeaderboard]);

  const activeAccentColor = settings.accentColor || "#7C9EFF";

  // Individual statistics mapping
  const activeIndividualStats = selectedHabitId !== "all" ? individualHabitStats : null;

  const totalCompletedCount = getTotalCompletedAllTime();

  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.2 } }
  };

  if (totalCompletedCount === 0) {
    return (
      <motion.div 
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        id="analytics-empty-state"
        className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-3xl min-h-[380px] shadow-sm select-none"
      >
        {/* Wandering magnifying glass animation over static bars */}
        <div className="relative w-40 h-40 flex items-center justify-center text-[#7C9EFF]/20 mb-3">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200 dark:text-neutral-800">
            <rect x="3" y="14" width="4" height="6" rx="1" fill="currentColor" fillOpacity="0.1" />
            <rect x="10" y="8" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.1" />
            <rect x="17" y="11" width="4" height="9" rx="1" fill="currentColor" fillOpacity="0.1" />
          </svg>
          
          <motion.div
            animate={{ x: [-8, 8, -8], y: [-3, 3, -3] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute text-[#7C9EFF] w-12 h-12 flex items-center justify-center"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="6" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </motion.div>
        </div>

        <h3 className="text-lg font-black text-gray-900 dark:text-neutral-100 tracking-tight mb-1">
          No logs found
        </h3>
        <p className="text-xs font-semibold text-secondary max-w-[280px] mb-8 leading-relaxed">
          Complete habit check-ins to view dynamic data. Live charts, trends, and leaderboard scores will appear here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      id="analytics-view" 
      className="space-y-6 select-none"
    >
      {/* 1. Global Stat Banner Row */}
      <div id="analytics-banner-row" className="grid grid-cols-3 gap-4">
        {/* Total tracked */}
        <div className="stats-card p-4 shadow-xs flex flex-col justify-center">
          <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">
            Habits Tracking
          </span>
          <span className="text-xl md:text-2xl font-extrabold text-gray-800 dark:text-neutral-50 leading-tight">
            {totalTrackedHabits}
          </span>
        </div>

        {/* Completions all time */}
        <div className="stats-card p-4 shadow-xs flex flex-col justify-center">
          <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">
            All-Time Logs
          </span>
          <span className="text-xl md:text-2xl font-extrabold text-gray-800 dark:text-neutral-50 leading-tight">
            {getTotalCompletedAllTime()}
          </span>
        </div>

        {/* Max longest streak */}
        <div className="stats-card p-4 shadow-xs flex flex-col justify-center">
          <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">
            Longest Streak
          </span>
          <span className="text-xl md:text-2xl font-extrabold text-gray-800 dark:text-neutral-50 leading-tight flex items-center gap-1">
            {maxLongestStreakEver}d
          </span>
        </div>
      </div>

      {/* 2. Horizontal Scrollable Habit Selector Tabs */}
      <div id="analytics-habit-tabs" className="flex items-center gap-2 overflow-x-auto pb-2.5 border-b border-gray-100 dark:border-neutral-800 no-scrollbar pr-2">
        <button
          onClick={() => setSelectedHabitId("all")}
          id="tab-all-selector"
          className={`px-4 py-2 text-xs font-bold rounded-full cursor-pointer transition-all shrink-0 border ${
            selectedHabitId === "all"
              ? "bg-[#1A1A1A] border-[#1A1A1A] text-white dark:bg-white dark:text-[#111111]"
              : "border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-400 hover:border-gray-300"
          }`}
        >
          All Habits
        </button>
        {activeHabits.map((habit) => (
          <button
            key={habit.id}
            id={`tab-selector-${habit.id}`}
            onClick={() => setSelectedHabitId(habit.id)}
            className={`px-4 py-2 text-xs font-bold rounded-full cursor-pointer transition-all shrink-0 border flex items-center gap-1.5 ${
              selectedHabitId === habit.id
                ? "text-white "
                : "border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-400 hover:border-gray-300"
            }`}
            style={{
              backgroundColor: selectedHabitId === habit.id ? habit.color : undefined,
              borderColor: selectedHabitId === habit.id ? habit.color : undefined,
            }}
          >
            <span>{habit.emoji}</span>
            <span>{habit.name}</span>
          </button>
        ))}
      </div>

      {/* 3. Conditional Layout Engine */}
      {selectedHabitId === "all" ? (
        // --- ALL LABELS DASHBOARD ---
        <div id="analytics-global-view" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category Consistency Scores */}
            <div id="category-chart-card" className="stats-card p-4 md:p-6 shadow-xs space-y-4">
              <h4 className="text-sm font-extrabold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                Category Achievements
              </h4>
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryAnalytics} layout="vertical" margin={{ left: -15, right: 10, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#6B6B6B", fontSize: 12, fontWeight: 700 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E1E1E",
                        borderColor: "#2A2A2A",
                        borderRadius: "12px",
                        color: "#F5F5F5",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="rate"
                      fill={activeAccentColor}
                      radius={[0, 4, 4, 0]}
                      background={{ fill: "rgba(107, 107, 107, 0.05)", radius: 4 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top 3 Leaderboards */}
            <div id="streaks-leaderboard" className="stats-card p-4 md:p-6 shadow-xs space-y-4">
              <h4 className="text-sm font-extrabold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                Streak Leaderboard
              </h4>
              
              {streaksLeaderboard.length === 0 ? (
                <div className="text-center py-10 text-xs text-secondary font-medium">
                  Log logs to write custom streaks.
                </div>
              ) : (
                <div className="space-y-3">
                  {streaksLeaderboard.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-100 dark:border-neutral-900 rounded-2xl"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 font-extrabold text-sm">
                        {idx + 1}
                      </div>
                      <span className="text-xl shrink-0">{item.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-gray-800 dark:text-neutral-200 truncate">
                          {item.name}
                        </span>
                        <span className="block text-[10px] text-gray-400 font-semibold capitalize">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-extrabold text-orange-500 flex items-center gap-0.5 justify-end">
                          <Flame size={14} fill="currentColor" />
                          {item.streak}d
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold block">
                          Best: {item.longestStreak}d
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* 30-Day Completion Area Trend Chart */}
          <div id="trend-line-container">
            <TrendLineChart data={monthlyCompletionTrend} color={activeAccentColor} />
          </div>
        </div>
      ) : (
        // --- INDIVIDUAL HABIT VIEW ---
        <div id="analytics-habit-view" className="space-y-6">
          {activeIndividualStats ? (
            <>
              {/* Header profile label */}
              <div
                id="habit-profile-header"
                style={{ borderLeftColor: activeIndividualStats.habit.color }}
                className="p-5 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 border-l-[6px] rounded-2xl flex items-center gap-4 justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-3xl shrink-0">{activeIndividualStats.habit.emoji}</span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-neutral-50 truncate">
                      {activeIndividualStats.habit.name}
                    </h3>
                    <p className="text-xs text-secondary font-semibold capitalize">
                      Category: {activeIndividualStats.habit.category} • {activeIndividualStats.habit.goalDaysPerWeek}d target
                    </p>
                  </div>
                </div>

                {/* Flame highlight */}
                {activeIndividualStats.currentStreak > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 border border-orange-100 dark:border-orange-500/20 font-extrabold text-sm shadow-2xs shrink-0">
                    <Flame size={18} fill="currentColor" className="animate-pulse" />
                    <span>{activeIndividualStats.currentStreak} day streak</span>
                  </div>
                )}
              </div>

              {/* Stat card summaries */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Consecutive summary */}
                <div className="stats-card p-5 shadow-xs space-y-4 flex flex-col justify-between">
                  <span className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider block">
                    Streak Records
                  </span>
                  <div className="flex items-center justify-around py-2">
                    <div className="text-center">
                      <span className="block text-3xl font-extrabold text-orange-500">
                        {activeIndividualStats.currentStreak}d
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">Current</span>
                    </div>
                    <div className="w-px h-10 bg-gray-150 dark:bg-neutral-800" />
                    <div className="text-center">
                      <span className="block text-3xl font-extrabold text-amber-500">
                        {activeIndividualStats.longestStreak}d
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">Longest Ever</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic interval completion rate */}
                <div className="stats-card p-5 shadow-xs space-y-4 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                      Completion Score Rate
                    </span>
                    {/* Interval pill selector tabs */}
                    <div className="flex gap-1 bg-gray-100 dark:bg-neutral-950 p-0.5 rounded-lg border border-gray-100 dark:border-neutral-800">
                      {[7, 30, 90].map((int) => (
                        <button
                          key={int}
                          type="button"
                          onClick={() => setIndividualInterval(int as typeof individualInterval)}
                          className={`px-2 py-1 text-[10px] font-bold rounded-md ${
                            individualInterval === int
                              ? "bg-slate-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                              : "text-gray-400 hover:text-black"
                          }`}
                        >
                          {int}d
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 py-1">
                    <div className="text-5xl font-extrabold text-blue-500 shrink-0">
                      {individualInterval === 7
                        ? activeIndividualStats.rate7
                        : individualInterval === 30
                        ? activeIndividualStats.rate30
                        : activeIndividualStats.rate90}
                      %
                    </div>
                    <div className="text-xs text-secondary font-medium leading-normal">
                      Completed logs index of this specific habit over the past {individualInterval} calendar days interval.
                    </div>
                  </div>
                </div>

              </div>

              {/* Heatmap specifically for this habit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <HeatmapCalendar
                    currentMonth={new Date()}
                    filterHabitId={selectedHabitId}
                  />
                </div>

                {/* Completions volume per week for past 8 weeks */}
                <div className="stats-card p-4 md:p-6 shadow-xs flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                      Weekly Log Volume
                    </h4>
                    <p className="text-xs font-medium text-secondary">
                      Completions logged count per week block over the preceding 8 weeks history.
                    </p>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    {activeIndividualStats.completionsPastWeeks.map((wk) => (
                      <div key={wk.weekLabel} className="space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
                          <span>{wk.weekLabel === "Wk -0" ? "This Week" : wk.weekLabel}</span>
                          <span>{wk.completions} of 7 days</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(wk.completions / 7) * 100}%`,
                              backgroundColor: activeIndividualStats.habit.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-xs font-semibold text-gray-400">
              Failed to fetch individual statistics.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

import React, { useState, useMemo } from "react";
import { useHabitStore } from "../context/HabitContext";
import { useAnalytics } from "../hooks/useAnalytics";
import { TrendLineChart } from "../components/charts/TrendLineChart";
import { HeatmapCalendar } from "../components/charts/HeatmapCalendar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";

export const AnalyticsView: React.FC = () => {
  const { habits, logs, settings } = useHabitStore();
  
  const [selectedHabitId, setSelectedHabitId] = useState<string>("all");
  const [individualInterval, setIndividualInterval] = useState<7 | 30 | 90>(30);

  const activeHabits = habits.filter((h) => h.isActive);
  const totalTrackedHabits = habits.length;

  // Bulk analytical selectors
  const { categoryAnalytics, streaksLeaderboard, monthlyCompletionTrend, individualHabitStats } = 
    useAnalytics(selectedHabitId !== "all" ? selectedHabitId : undefined);

  // Compute total completed check-ins of all time
  const totalCompletedCount = useMemo(() => {
    let sum = 0;
    Object.keys(logs).forEach((date) => {
      // only count completions for habits that actually exist to ignore legacy/deleted logs
      const valid = (logs[date] || []).filter((hId) => habits.some((h) => h.id === hId));
      sum += valid.length;
    });
    return sum;
  }, [logs, habits]);

  // Compute maximum streak among active habits
  const maxLongestStreakEver = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(0, ...streaksLeaderboard.map((item) => item.longestStreak ?? 0));
  }, [habits, streaksLeaderboard]);

  const activeAccentColor = settings.accentColor || "#7C9EFF";
  const activeIndividualStats = selectedHabitId !== "all" ? individualHabitStats : null;

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
        className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-3xl min-h-[350px] shadow-sm select-none"
      >
        <div className="relative w-36 h-36 flex items-center justify-center text-[#7C9EFF]/20 mb-2">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200 dark:text-neutral-800">
            <rect x="3" y="14" width="4" height="6" rx="1" fill="currentColor" fillOpacity="0.08" />
            <rect x="10" y="8" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.08" />
            <rect x="17" y="11" width="4" height="9" rx="1" fill="currentColor" fillOpacity="0.08" />
          </svg>
          
          <motion.div
            animate={{ x: [-6, 6, -6], y: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute text-[#7C9EFF] w-10 h-10 flex items-center justify-center"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="5" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </motion.div>
        </div>

        <h3 className="text-base font-black text-gray-900 dark:text-neutral-100 tracking-tight mb-1">
          Awaiting analytics log data
        </h3>
        <p className="text-xs font-semibold text-secondary max-w-[260px] mb-6">
          Log completions daily first. Your progress charts, streak counts, and leaderboards will trigger here.
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
      {/* Stat grid row overview */}
      <div id="analytics-banner-row" className="grid grid-cols-3 gap-4">
        <div className="stats-card p-4 shadow-xs flex flex-col justify-center">
          <span className="text-[9px] uppercase font-black text-[#AAAAAA] tracking-wider leading-none mb-1">
            Habits Tracking
          </span>
          <span className="text-lg md:text-xl font-black text-gray-800 dark:text-neutral-50 leading-tight">
            {totalTrackedHabits}
          </span>
        </div>

        <div className="stats-card p-4 shadow-xs flex flex-col justify-center">
          <span className="text-[9px] uppercase font-black text-[#AAAAAA] tracking-wider leading-none mb-1">
            All-Time Logs
          </span>
          <span className="text-lg md:text-xl font-black text-gray-800 dark:text-neutral-50 leading-tight">
            {totalCompletedCount}
          </span>
        </div>

        <div className="stats-card p-4 shadow-xs flex flex-col justify-center">
          <span className="text-[9px] uppercase font-black text-[#AAAAAA] tracking-wider leading-none mb-1">
            Longest Streak
          </span>
          <span className="text-lg md:text-xl font-black text-gray-800 dark:text-neutral-50 leading-tight font-mono">
            {maxLongestStreakEver}d
          </span>
        </div>
      </div>

      {/* Habit Selector Tabs */}
      <div id="analytics-habit-tabs" className="flex items-center gap-2 overflow-x-auto pb-2.5 border-b border-gray-150 dark:border-neutral-800 no-scrollbar pr-2">
        <button
          onClick={() => setSelectedHabitId("all")}
          id="tab-all-selector"
          className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-full cursor-pointer transition-all shrink-0 border ${
            selectedHabitId === "all"
              ? "bg-[#111111] border-[#111111] text-white dark:bg-white dark:text-[#111111]"
              : "border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-500 hover:border-gray-300"
          }`}
        >
          All Habits
        </button>
        {activeHabits.map((h) => (
          <button
            key={h.id}
            id={`tab-selector-${h.id}`}
            onClick={() => setSelectedHabitId(h.id)}
            className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-full cursor-pointer transition-all shrink-0 border flex items-center gap-1.5 ${
              selectedHabitId === h.id
                ? "text-white "
                : "border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-500 hover:border-gray-300"
            }`}
            style={{
              backgroundColor: selectedHabitId === h.id ? h.color : undefined,
              borderColor: selectedHabitId === h.id ? h.color : undefined,
            }}
          >
            <span>{h.emoji}</span>
            <span>{h.name}</span>
          </button>
        ))}
      </div>

      {/* Layout Engine switcher */}
      {selectedHabitId === "all" ? (
        <div id="analytics-global-view" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category consistency breakdown grid bar */}
            <div id="category-chart-card" className="stats-card p-5 shadow-xs space-y-4">
              <h4 className="text-[10px] font-extrabold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">
                Category Achievements
              </h4>
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryAnalytics} layout="vertical" margin={{ left: 10, right: 15, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={90}
                      tick={{ fill: "#888888", fontSize: 11, fontWeight: 700, textAnchor: "end" }}
                      className="capitalize"
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.02)" }}
                      contentStyle={{
                        backgroundColor: "#111111",
                        borderColor: "#222222",
                        borderRadius: "12px",
                        color: "#EEEEEE",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    />
                    <Bar
                      dataKey="rate"
                      fill={activeAccentColor}
                      radius={[0, 4, 4, 0]}
                      background={{ fill: "rgba(100, 100, 100, 0.05)", radius: 4 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Streak leaderboard rankers */}
            <div id="streaks-leaderboard" className="stats-card p-5 shadow-xs space-y-4">
              <h4 className="text-[10px] font-extrabold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">
                Streak Leaderboard
              </h4>
              
              {streaksLeaderboard.length === 0 ? (
                <div className="text-center py-10 text-xs font-bold text-gray-400 dark:text-neutral-500">
                  Compile streaks to inspect leaderboards.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {streaksLeaderboard.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-850 border border-gray-150 dark:border-neutral-800 rounded-2xl"
                    >
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 font-extrabold text-xs">
                        {idx + 1}
                      </div>
                      <span className="text-lg shrink-0 select-none">{item.emoji}</span>
                      <div className="min-w-0 flex-1 leading-tight">
                        <span className="block text-xs font-bold text-gray-800 dark:text-neutral-100 truncate">
                          {item.name}
                        </span>
                        <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-orange-500 flex items-center gap-0.5 justify-end">
                          <Flame size={12} fill="currentColor" />
                          {item.streak}d
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold block mt-0.5 uppercase">
                          Peak: {item.longestStreak}d
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* 30-day Completion graph Area trend */}
          <div id="trend-line-container">
            <TrendLineChart data={monthlyCompletionTrend} color={activeAccentColor} />
          </div>
        </div>
      ) : (
        <div id="analytics-habit-view" className="space-y-6">
          {activeIndividualStats ? (
            <>
              {/* Header Profile Info banner */}
              <div
                id="habit-profile-header"
                style={{ borderLeftColor: activeIndividualStats.habit.color }}
                className="p-5 bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 border-l-[6px] rounded-2xl flex items-center gap-4 justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0 text-left">
                  <span className="text-3xl shrink-0 select-none">{activeIndividualStats.habit.emoji}</span>
                  <div className="min-w-0 leading-tight">
                    <h3 className="text-base font-black text-gray-800 dark:text-neutral-50 truncate">
                      {activeIndividualStats.habit.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 dark:text-neutral-500 font-extrabold uppercase mt-1 tracking-wider">
                      Category: {activeIndividualStats.habit.category} • {activeIndividualStats.habit.goalDaysPerWeek}d target
                    </p>
                  </div>
                </div>

                {activeIndividualStats.currentStreak > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 font-black text-xs shrink-0 h-9">
                    <Flame size={14} fill="currentColor" className="animate-pulse" />
                    <span>{activeIndividualStats.currentStreak} day streak</span>
                  </div>
                )}
              </div>

              {/* Personal streak & rates grid summaries */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stats-card p-5 shadow-xs space-y-4 flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold text-gray-400 dark:text-neutral-500 uppercase tracking-widest block">
                    Streak Records
                  </span>
                  <div className="flex items-center justify-around py-1">
                    <div className="text-center">
                      <span className="block text-2xl font-black text-orange-500 font-mono">
                        {activeIndividualStats.currentStreak}d
                      </span>
                      <span className="text-[9px] text-[#A0A0A0] uppercase font-black tracking-wider leading-none">Current</span>
                    </div>
                    <div className="w-px h-8 bg-gray-150 dark:bg-neutral-800" />
                    <div className="text-center">
                      <span className="block text-2xl font-black text-amber-500 font-mono">
                        {activeIndividualStats.longestStreak}d
                      </span>
                      <span className="text-[9px] text-[#A0A0A0] uppercase font-black tracking-wider leading-none">Longest Ever</span>
                    </div>
                  </div>
                </div>

                {/* Interval percentage completions list tracker */}
                <div className="stats-card p-5 shadow-xs space-y-4 md:col-span-2 text-left">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-[10px] font-extrabold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">
                      Completion Score Rate
                    </span>
                    <div className="flex gap-1 bg-gray-100 dark:bg-neutral-950 p-0.5 rounded-lg border border-gray-150 dark:border-neutral-800">
                      {[7, 30, 90].map((int) => (
                        <button
                          key={int}
                          type="button"
                          onClick={() => setIndividualInterval(int as typeof individualInterval)}
                          className={`px-2 py-1 text-[10px] font-extrabold rounded-md cursor-pointer ${
                            individualInterval === int
                              ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                              : "text-gray-400 hover:text-neutral-900"
                          }`}
                        >
                          {int}d
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 py-1 select-none">
                    <div className="text-4xl font-extrabold text-[#7C9EFF] shrink-0 font-mono">
                      {individualInterval === 7
                        ? activeIndividualStats.rate7
                        : individualInterval === 30
                        ? activeIndividualStats.rate30
                        : activeIndividualStats.rate90}
                      %
                    </div>
                    <div className="text-xs text-secondary font-semibold leading-relaxed">
                      This represents your checking rate of this specific habit over the preceding {individualInterval}-day calendar period.
                    </div>
                  </div>
                </div>
              </div>

              {/* Dedicated Heatmap mapping for the chosen habit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <HeatmapCalendar
                    currentMonth={new Date()}
                    filterHabitId={selectedHabitId}
                  />
                </div>

                {/* Past 8 weeks activity volume stats levels */}
                <div className="stats-card p-5 shadow-xs flex flex-col justify-between text-left">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-extrabold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">
                      Weekly Log Volume
                    </h4>
                    <p className="text-xs font-semibold text-secondary leading-normal">
                      Completed checks compiled per weekly segment.
                    </p>
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    {activeIndividualStats.completionsPastWeeks.map((wk) => (
                      <div key={wk.weekLabel} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-[#999999] tracking-wider leading-none">
                          <span>{wk.weekLabel === "Wk -0" ? "This Week" : wk.weekLabel}</span>
                          <span className="font-mono text-gray-500 font-bold">{wk.completions} of 7d</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-150 dark:bg-neutral-800 overflow-hidden">
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
            <div className="text-center py-10 text-xs font-extrabold text-gray-400 select-none">
              Failed to display individual metrics.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

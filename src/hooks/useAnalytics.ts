import { useMemo } from "react";
import { format, subDays, startOfWeek, addDays } from "date-fns";
import { Habit, LogMap, Category } from "../types";
import { useHabitStore } from "../context/HabitContext";

// Exact required formulas
export function getStreak(habitId: string, logs: LogMap): number {
  let count = 0;
  let date = new Date();
  const todayKey = format(date, "yyyy-MM-dd");
  if (!logs[todayKey]?.includes(habitId)) {
    date = subDays(date, 1);
  }
  while (true) {
    const key = format(date, "yyyy-MM-dd");
    if (logs[key]?.includes(habitId)) {
      count++;
      date = subDays(date, 1);
    } else {
      break;
    }
  }
  return count;
}

export function getLongestStreak(habitId: string, logs: LogMap): number {
  const loggedDates = Object.keys(logs)
    .filter((dStr) => logs[dStr]?.includes(habitId))
    .sort();

  if (loggedDates.length === 0) return 0;
  
  let maxStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < loggedDates.length; i++) {
    const prev = new Date(loggedDates[i - 1] + "T00:00:00");
    const curr = new Date(loggedDates[i] + "T00:00:00");
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      currentRun++;
      if (currentRun > maxStreak) {
        maxStreak = currentRun;
      }
    } else if (diff > 1) {
      currentRun = 1;
    }
  }
  return maxStreak;
}

export function getCompletionRate(habitId: string, logs: LogMap, days = 30): number {
  let completed = 0;
  for (let i = 0; i < days; i++) {
    const key = format(subDays(new Date(), i), "yyyy-MM-dd");
    if (logs[key]?.includes(habitId)) completed++;
  }
  return Math.round((completed / days) * 100);
}

export function getWeeklyConsistency(habits: Habit[], logs: LogMap): number {
  const activeHabits = habits.filter((h) => h.isActive);
  if (!activeHabits.length) return 0;
  
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const key = format(addDays(monday, i), "yyyy-MM-dd");
    total += (logs[key] ?? []).filter((id) =>
      activeHabits.some((h) => h.id === id)
    ).length;
  }
  return Math.round((total / (activeHabits.length * 7)) * 100);
}

// Custom hook signature aligned with Analytics views
export function useAnalytics(selectedHabitId?: string) {
  const { habits, logs } = useHabitStore();

  // Category Breakdown: health, fitness, study, mindfulness, productivity
  const categoryAnalytics = useMemo(() => {
    const categories: Category[] = ["health", "fitness", "study", "mindfulness", "productivity"];
    
    return categories.map((cat) => {
      const catHabits = habits.filter((h) => h.category === cat && h.isActive);
      if (catHabits.length === 0) {
        return { name: cat.charAt(0).toUpperCase() + cat.slice(1), rate: 0, count: 0 };
      }
      
      const totalRate = catHabits.reduce((sum, h) => sum + getCompletionRate(h.id, logs, 30), 0);
      const avgRate = Math.round(totalRate / catHabits.length);
      
      return {
        name: cat.charAt(0).toUpperCase() + cat.slice(1), // Health, Fitness, Study, Mindfulness, Productivity
        rate: avgRate,
        count: catHabits.length,
      };
    });
  }, [habits, logs]);

  // Leaders list
  const streaksLeaderboard = useMemo(() => {
    const activeHabits = habits.filter((h) => h.isActive);
    const scored = activeHabits.map((h) => ({
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      category: h.category,
      streak: getStreak(h.id, logs),
      longestStreak: getLongestStreak(h.id, logs),
    }));

    return scored.sort((a, b) => b.streak - a.streak);
  }, [habits, logs]);

  // Daily tracker last 30 days
  const monthlyCompletionTrend = useMemo(() => {
    const trend = [];
    const d = new Date();
    for (let i = 29; i >= 0; i--) {
      const targetDate = subDays(d, i);
      const dateStr = format(targetDate, "yyyy-MM-dd");
      const labelStr = format(targetDate, "MMM d");
      
      const completedList = logs[dateStr] || [];
      const count = completedList.filter((id) => habits.some((h) => h.id === id)).length;

      trend.push({
        date: labelStr,
        completions: count,
      });
    }
    return trend;
  }, [logs, habits]);

  // Individual statistics computed over a selected habit ID
  const individualHabitStats = useMemo(() => {
    if (!selectedHabitId || selectedHabitId === "all") return null;

    const habit = habits.find((h) => h.id === selectedHabitId);
    if (!habit) return null;

    const currentStreak = getStreak(selectedHabitId, logs);
    const longestStreak = getLongestStreak(selectedHabitId, logs);
    
    const rate7 = getCompletionRate(selectedHabitId, logs, 7);
    const rate30 = getCompletionRate(selectedHabitId, logs, 30);
    const rate90 = getCompletionRate(selectedHabitId, logs, 90);

    const completionsPastWeeks = [];
    const today = new Date();
    for (let w = 7; w >= 0; w--) {
      const weekDate = subDays(today, w * 7);
      const mon = startOfWeek(weekDate, { weekStartsOn: 1 });
      
      let logsInWeek = 0;
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkStr = format(addDays(mon, dayOffset), "yyyy-MM-dd");
        if ((logs[checkStr] || []).includes(selectedHabitId)) {
          logsInWeek++;
        }
      }

      completionsPastWeeks.push({
        weekLabel: `Wk -${w}`,
        completions: logsInWeek,
      });
    }

    return {
      habit,
      currentStreak,
      longestStreak,
      rate7,
      rate30,
      rate90,
      completionsPastWeeks,
    };
  }, [selectedHabitId, habits, logs]);

  return {
    categoryAnalytics,
    streaksLeaderboard,
    monthlyCompletionTrend,
    individualHabitStats,
  };
}

import { useMemo } from "react";
import { useHabitStore } from "../context/HabitContext";
import { format, subDays, startOfWeek, addDays } from "date-fns";
import { HabitCategory } from "../types";

export function useAnalytics(habitId?: string) {
  const { habits, logs, getCompletionRate, getStreakForHabit, getLongestStreakForHabit } = useHabitStore();

  // 1. Completion rate per category (Calculated over last 30 days)
  const categoryAnalytics = useMemo(() => {
    const categories: HabitCategory[] = ["health", "fitness", "study", "mindfulness", "productivity"];
    
    return categories.map((cat) => {
      const catHabits = habits.filter((h) => h.category === cat && h.isActive);
      if (catHabits.length === 0) {
        return { name: cat, rate: 0, count: 0 };
      }
      
      const totalRate = catHabits.reduce((sum, h) => sum + getCompletionRate(h.id, 30), 0);
      const avgRate = Math.round(totalRate / catHabits.length);
      
      return {
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        rate: avgRate,
        count: catHabits.length,
      };
    });
  }, [habits, getCompletionRate]);

  // 2. Streaks Leaderboard (Top 3 streaks of active habits)
  const streaksLeaderboard = useMemo(() => {
    const activeHabits = habits.filter((h) => h.isActive);
    const scored = activeHabits.map((h) => ({
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      category: h.category,
      streak: getStreakForHabit(h.id),
      longestStreak: getLongestStreakForHabit(h.id),
    }));

    // Sort by stream desc, then by name
    return scored.sort((a, b) => b.streak - a.streak).slice(0, 3);
  }, [habits, getStreakForHabit, getLongestStreakForHabit]);

  // 3. Completion trend for last 30 days
  // Returns array of { date: "May 1", completions: number } for charts
  const monthlyCompletionTrend = useMemo(() => {
    const trend = [];
    let d = new Date();
    // Generate dates backwards and then reverse for chronological order
    for (let i = 29; i >= 0; i--) {
      const targetDate = subDays(d, i);
      const dateStr = format(targetDate, "yyyy-MM-dd");
      const labelStr = format(targetDate, "MMM d");
      
      const completedList = logs[dateStr] || [];
      // Count existing active/inactive habits logged
      const count = completedList.filter((id) => habits.some((h) => h.id === id)).length;

      trend.push({
        date: labelStr,
        completions: count,
      });
    }
    return trend;
  }, [logs, habits]);

  // If a specific habitId is targeted:
  const individualHabitStats = useMemo(() => {
    if (!habitId) return null;

    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return null;

    const currentStreak = getStreakForHabit(habitId);
    const longestStreak = getLongestStreakForHabit(habitId);
    
    const rate7 = getCompletionRate(habitId, 7);
    const rate30 = getCompletionRate(habitId, 30);
    const rate90 = getCompletionRate(habitId, 90);

    // 8-week completion volume data (for bar chart)
    const completionsPastWeeks = [];
    const today = new Date();
    
    // We compute for the last 8 weeks
    for (let w = 7; w >= 0; w--) {
      // Find start of week (Sunday or Monday, let's use week starts on Monday)
      const weekDate = subDays(today, w * 7);
      const mon = startOfWeek(weekDate, { weekStartsOn: 1 });
      
      let logsInWeek = 0;
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkStr = format(addDays(mon, dayOffset), "yyyy-MM-dd");
        const list = logs[checkStr] || [];
        if (list.includes(habitId)) {
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
  }, [habitId, habits, logs, getCompletionRate, getStreakForHabit, getLongestStreakForHabit]);

  return {
    categoryAnalytics,
    streaksLeaderboard,
    monthlyCompletionTrend,
    individualHabitStats,
  };
}

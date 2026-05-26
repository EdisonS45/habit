import React, { createContext, useContext, useState, useEffect } from "react";
import { format, subDays, addDays, startOfWeek, parseISO, differenceInCalendarDays } from "date-fns";
import { Habit, LogMap, Settings, HabitStoreContextType } from "../types";

// Default settings
const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  userName: "",
  focusAreas: [],
  onboardingComplete: false,
  accentColor: "#7C9EFF", // default periwinkle
};

const HabitContext = createContext<HabitStoreContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [activeView, setActiveView] = useState<string>("today");

  // State initialized from localStorage
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<LogMap>({});
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // 1. Initial Load from localStorage
  useEffect(() => {
    try {
      const storedHabits = localStorage.getItem("cby_habits");
      const storedLogs = localStorage.getItem("cby_logs");
      const storedSettings = localStorage.getItem("cby_settings");

      if (storedHabits) setHabits(JSON.parse(storedHabits));
      if (storedLogs) setLogs(JSON.parse(storedLogs));
      if (storedSettings) setSettings(JSON.parse(storedSettings));

      // Always ensure export version is saved
      localStorage.setItem("cby_export_version", "1.0");
    } catch (e) {
      console.error("Failed to load CraftedByYours state from localStorage", e);
    }
  }, []);

  // Sync to localStorage on change
  useEffect(() => {
    if (habits.length > 0 || localStorage.getItem("cby_habits")) {
      localStorage.setItem("cby_habits", JSON.stringify(habits));
    }
  }, [habits]);

  useEffect(() => {
    if (Object.keys(logs).length > 0 || localStorage.getItem("cby_logs")) {
      localStorage.setItem("cby_logs", JSON.stringify(logs));
    }
  }, [logs]);

  useEffect(() => {
    localStorage.setItem("cby_settings", JSON.stringify(settings));
    
    // Apply theme
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings]);

  // Operations
  const addHabit = (newHabit: Omit<Habit, "id" | "createdAt" | "isActive">) => {
    const uuid = typeof crypto !== "undefined" && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const habit: Habit = {
      ...newHabit,
      id: uuid,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    setHabits((prev) => [...prev, habit]);
  };

  const updateHabit = (id: string, updates: Partial<Omit<Habit, "id">>) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } as Habit : h))
    );
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    // Also clean up any logs for this habit (optional but clean)
    setLogs((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((date) => {
        updated[date] = updated[date].filter((hId) => hId !== id);
      });
      return updated;
    });
  };

  const toggleLog = (habitId: string, date: string) => {
    setLogs((prev) => {
      const dayLogs = prev[date] ? [...prev[date]] : [];
      const index = dayLogs.indexOf(habitId);
      if (index > -1) {
        dayLogs.splice(index, 1);
      } else {
        dayLogs.push(habitId);
      }
      return {
        ...prev,
        [date]: dayLogs,
      };
    });
  };

  const isLogged = (habitId: string, date: string): boolean => {
    const dayLogs = logs[date];
    return Array.isArray(dayLogs) && dayLogs.includes(habitId);
  };

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Import/Export
  const exportData = () => {
    return JSON.stringify({
      habits,
      logs,
      settings,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    });
  };

  const importData = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== "object") return false;
      
      // Basic structures check
      if (Array.isArray(parsed.habits) && typeof parsed.logs === "object" && typeof parsed.settings === "object") {
        setHabits(parsed.habits);
        setLogs(parsed.logs);
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed.settings,
        });
        localStorage.setItem("cby_habits", JSON.stringify(parsed.habits));
        localStorage.setItem("cby_logs", JSON.stringify(parsed.logs));
        localStorage.setItem("cby_settings", JSON.stringify(parsed.settings));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to import CraftedByYours data", e);
      return false;
    }
  };

  // --- ANALYTICS CALCULATIONS ---

  // 1. Current Streak
  const getStreakForHabit = (habitId: string): number => {
    let currentStreak = 0;
    let checkDate = new Date();
    let formatted = format(checkDate, "yyyy-MM-dd");

    if (isLogged(habitId, formatted)) {
      currentStreak = 1;
      while (true) {
        checkDate = subDays(checkDate, 1);
        const checkStr = format(checkDate, "yyyy-MM-dd");
        if (isLogged(habitId, checkStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      // Check yesterday
      checkDate = subDays(checkDate, 1);
      const yesterdayStr = format(checkDate, "yyyy-MM-dd");
      if (isLogged(habitId, yesterdayStr)) {
        currentStreak = 1;
        while (true) {
          checkDate = subDays(checkDate, 1);
          const checkStr = format(checkDate, "yyyy-MM-dd");
          if (isLogged(habitId, checkStr)) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }
    return currentStreak;
  };

  // 2. Longest Streak
  const getLongestStreakForHabit = (habitId: string): number => {
    const completedDates = Object.keys(logs)
      .filter((dateStr) => Array.isArray(logs[dateStr]) && logs[dateStr].includes(habitId))
      .map((dateStr) => parseISO(dateStr))
      .sort((a, b) => a.getTime() - b.getTime());

    if (completedDates.length === 0) return 0;

    let maxStreak = 1;
    let currentRun = 1;

    for (let i = 1; i < completedDates.length; i++) {
      const prev = completedDates[i - 1];
      const curr = completedDates[i];
      const diff = differenceInCalendarDays(curr, prev);

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
  };

  // 3. Completion Rate (last N days)
  const getCompletionRate = (habitId: string, days = 30): number => {
    if (days <= 0) return 0;
    let count = 0;
    let d = new Date();
    for (let i = 0; i < days; i++) {
      const dateStr = format(d, "yyyy-MM-dd");
      if (isLogged(habitId, dateStr)) {
        count++;
      }
      d = subDays(d, 1);
    }
    return Math.round((count / days) * 100);
  };

  // 4. Weekly Consistency Score
  const getWeeklyConsistencyScore = (): number => {
    const activeHabits = habits.filter((h) => h.isActive);
    if (activeHabits.length === 0) return 0;

    const today = new Date();
    const mon = startOfWeek(today, { weekStartsOn: 1 });
    let totalLogsThisWeek = 0;

    for (let i = 0; i < 7; i++) {
      const dStr = format(addDays(mon, i), "yyyy-MM-dd");
      const completedIds = logs[dStr] || [];
      // Count active habits completed on this date
      const activeCompleted = completedIds.filter((id) =>
        activeHabits.some((h) => h.id === id)
      );
      totalLogsThisWeek += activeCompleted.length;
    }

    return Math.round((totalLogsThisWeek / (activeHabits.length * 7)) * 100);
  };

  // 5. Today Completed Count
  const getTodayCompletedCount = (): number => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayCompleted = logs[todayStr] || [];
    // Only count active/existing habits
    return todayCompleted.filter((id) => habits.some((h) => h.id === id)).length;
  };

  // 6. Total Completed All Time
  const getTotalCompletedAllTime = (): number => {
    let count = 0;
    Object.keys(logs).forEach((date) => {
      const list = logs[date] || [];
      // Only count if habit exists in habits list
      const validCompleted = list.filter((id) => habits.some((h) => h.id === id));
      count += validCompleted.length;
    });
    return count;
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        logs,
        settings,
        activeView,
        setActiveView,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleLog,
        isLogged,
        updateSettings,
        exportData,
        importData,
        getStreakForHabit,
        getLongestStreakForHabit,
        getCompletionRate,
        getWeeklyConsistencyScore,
        getTodayCompletedCount,
        getTotalCompletedAllTime,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabitStore = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error("useHabitStore must be used within a HabitProvider");
  }
  return context;
};

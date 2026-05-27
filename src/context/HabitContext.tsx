import React, { createContext, useContext, useState, useEffect } from "react";
import { format, subDays, addDays, startOfWeek } from "date-fns";
import { Habit, LogMap, Settings, Category, HabitStoreContextType } from "../types";

// Update the type signature to include undo capabilities
export interface HabitStoreContextTypeWithUndo extends HabitStoreContextType {
  lastDeleted: { habit: Habit; logs: Record<string, string[]> } | null;
  restoreLastDeleted: () => void;
  clearLastDeleted: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  userName: "",
  focusAreas: [],
  onboardingComplete: false,
  accentColor: "#7C9EFF", // default periwinkle
};

const HabitContext = createContext<HabitStoreContextTypeWithUndo | undefined>(undefined);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [activeView, setActiveView] = useState<string>("today");

  // State initialized synchronously from localStorage
  const [settings, setSettingsState] = useState<Settings>(() => {
    try {
      const raw = localStorage.getItem("cby_settings");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      }
    } catch (e) {
      console.error("Failed to parse cby_settings from localStorage", e);
    }
    return DEFAULT_SETTINGS;
  });

  const [habits, setHabitsState] = useState<Habit[]>(() => {
    try {
      const raw = localStorage.getItem("cby_habits");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse cby_habits from localStorage", e);
    }
    return [];
  });

  const [logs, setLogsState] = useState<LogMap>(() => {
    try {
      const raw = localStorage.getItem("cby_logs");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (e) {
      console.error("Failed to parse cby_logs from localStorage", e);
    }
    return {};
  });

  const [celebrated, setCelebratedState] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("cby_celebrated");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (e) {
      console.error("Failed to parse cby_celebrated from localStorage", e);
    }
    return {};
  });

  // Undo facility backing
  const [lastDeleted, setLastDeleted] = useState<{ habit: Habit; logs: Record<string, string[]> } | null>(null);

  // Apply dark mode theme class initially and when settings theme changes
  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.theme]);

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

    const nextHabits = [...habits, habit];
    setHabitsState(nextHabits);
    localStorage.setItem("cby_habits", JSON.stringify(nextHabits));
  };

  const updateHabit = (id: string, updates: Partial<Omit<Habit, "id">>) => {
    const nextHabits = habits.map((h) => 
      h.id === id ? ({ ...h, ...updates } as Habit) : h
    );
    setHabitsState(nextHabits);
    localStorage.setItem("cby_habits", JSON.stringify(nextHabits));
  };

  const deleteHabit = (id: string) => {
    const targetHabit = habits.find((h) => h.id === id);
    if (!targetHabit) return;

    // Backup the habit log history specifically for full restore support
    const logsBackup: Record<string, string[]> = {};
    Object.keys(logs).forEach((date) => {
      if (logs[date]?.includes(id)) {
        logsBackup[date] = logs[date];
      }
    });

    setLastDeleted({ habit: targetHabit, logs: logsBackup });

    // 1. Filter out the deleted habit
    const nextHabits = habits.filter((h) => h.id !== id);
    setHabitsState(nextHabits);
    localStorage.setItem("cby_habits", JSON.stringify(nextHabits));

    // 2. Clean logs for this habit so they don't linger
    const nextLogs: LogMap = {};
    Object.keys(logs).forEach((date) => {
      nextLogs[date] = (logs[date] ?? []).filter((hId) => hId !== id);
    });
    setLogsState(nextLogs);
    localStorage.setItem("cby_logs", JSON.stringify(nextLogs));

    // 3. Clean up celebrated keys
    const nextCelebrated = { ...celebrated };
    let cChanged = false;
    Object.keys(nextCelebrated).forEach((key) => {
      if (key.startsWith(`${id}-`)) {
        delete nextCelebrated[key];
        cChanged = true;
      }
    });
    if (cChanged) {
      setCelebratedState(nextCelebrated);
      localStorage.setItem("cby_celebrated", JSON.stringify(nextCelebrated));
    }
  };

  const restoreLastDeleted = () => {
    if (!lastDeleted) return;
    const { habit, logs: backedLogs } = lastDeleted;

    // Restore habit
    const nextHabits = [...habits, habit];
    setHabitsState(nextHabits);
    localStorage.setItem("cby_habits", JSON.stringify(nextHabits));

    // Restore logs
    const nextLogs = { ...logs };
    Object.keys(backedLogs).forEach((date) => {
      if (!nextLogs[date]) nextLogs[date] = [];
      if (!nextLogs[date].includes(habit.id)) {
        nextLogs[date] = [...nextLogs[date], habit.id];
      }
    });
    setLogsState(nextLogs);
    localStorage.setItem("cby_logs", JSON.stringify(nextLogs));

    setLastDeleted(null);
  };

  const clearLastDeleted = () => {
    setLastDeleted(null);
  };

  const toggleLog = (habitId: string, date: string) => {
    const current = logs[date] ?? [];
    const next = current.includes(habitId)
      ? current.filter((id) => id !== habitId)
      : [...current, habitId];
    
    const nextLogs = { ...logs, [date]: next };
    setLogsState(nextLogs);
    localStorage.setItem("cby_logs", JSON.stringify(nextLogs));
  };

  const isLogged = (habitId: string, date: string): boolean => {
    const dayLogs = logs[date];
    return Array.isArray(dayLogs) && dayLogs.includes(habitId);
  };

  const updateSettings = (updates: Partial<Settings>) => {
    const nextSettings = { ...settings, ...updates };
    setSettingsState(nextSettings);
    localStorage.setItem("cby_settings", JSON.stringify(nextSettings));
  };

  const celebrateMilestone = (habitId: string, milestone: number) => {
    const key = `${habitId}-${milestone}`;
    const nextCelebrated = { ...celebrated, [key]: true };
    setCelebratedState(nextCelebrated);
    localStorage.setItem("cby_celebrated", JSON.stringify(nextCelebrated));
  };

  const exportData = () => {
    return JSON.stringify({
      habits,
      logs,
      settings,
      celebrated,
      exportedAt: new Date().toISOString(),
      version: "1.1",
    });
  };

  const importData = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== "object") return false;

      const importedHabits = parsed.habits || [];
      const importedLogs = parsed.logs || {};
      const importedSettings = parsed.settings || {};
      const importedCelebrated = parsed.celebrated || {};

      setHabitsState(importedHabits);
      setLogsState(importedLogs);
      setSettingsState({ ...DEFAULT_SETTINGS, ...importedSettings });
      setCelebratedState(importedCelebrated);

      localStorage.setItem("cby_habits", JSON.stringify(importedHabits));
      localStorage.setItem("cby_logs", JSON.stringify(importedLogs));
      localStorage.setItem("cby_settings", JSON.stringify({ ...DEFAULT_SETTINGS, ...importedSettings }));
      localStorage.setItem("cby_celebrated", JSON.stringify(importedCelebrated));

      return true;
    } catch (e) {
      console.error("Failed to import backup JSON string", e);
      return false;
    }
  };

  const wipeDatabase = () => {
    setHabitsState([]);
    setLogsState({});
    setSettingsState(DEFAULT_SETTINGS);
    setCelebratedState({});
    setLastDeleted(null);
    localStorage.removeItem("cby_habits");
    localStorage.removeItem("cby_logs");
    localStorage.removeItem("cby_settings");
    localStorage.removeItem("cby_celebrated");
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        logs,
        settings,
        celebrated,
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
        wipeDatabase,
        celebrateMilestone,
        lastDeleted,
        restoreLastDeleted,
        clearLastDeleted,
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
  return context as HabitStoreContextTypeWithUndo;
};

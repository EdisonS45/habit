export type HabitCategory = "health" | "fitness" | "study" | "mindfulness" | "productivity";

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  color: string; // Hex color string
  emoji: string;
  goalDaysPerWeek: number; // 1 to 7
  createdAt: string; // ISO date string
  isActive: boolean;
}

export type LogMap = {
  [date: string]: string[]; // date key format: YYYY-MM-DD, values are arrays of completed habit IDs
};

export interface Settings {
  theme: "light" | "dark";
  userName: string;
  focusAreas: string[];
  onboardingComplete: boolean;
  accentColor: string; // Hex styling color
}

export interface HabitStoreContextType {
  habits: Habit[];
  logs: LogMap;
  settings: Settings;
  activeView: string;
  setActiveView: (view: string) => void;
  addHabit: (habit: Omit<Habit, "id" | "createdAt" | "isActive">) => void;
  updateHabit: (id: string, updates: Partial<Omit<Habit, "id">>) => void;
  deleteHabit: (id: string) => void;
  toggleLog: (habitId: string, date: string) => void;
  isLogged: (habitId: string, date: string) => boolean;
  updateSettings: (updates: Partial<Settings>) => void;
  exportData: () => string;
  importData: (jsonString: string) => boolean;
  getStreakForHabit: (habitId: string) => number;
  getLongestStreakForHabit: (habitId: string) => number;
  getCompletionRate: (habitId: string, days?: number) => number;
  getWeeklyConsistencyScore: () => number;
  getTodayCompletedCount: () => number;
  getTotalCompletedAllTime: () => number;
}

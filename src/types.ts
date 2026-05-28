export type Category = string;

export interface Habit {
  id: string;           // crypto.randomUUID() or fallback unique ID
  name: string;
  category: Category;
  color: string;        // hex from picker
  emoji: string;
  goalDaysPerWeek: number; // 1 to 7
  createdAt: string;    // ISO date string
  isActive: boolean;
  reason?: string;
  bestTime?: "morning" | "afternoon" | "evening" | "anytime";
}

export interface Settings {
  userName: string;
  focusAreas: Category[];
  onboardingComplete: boolean;
  theme: "light" | "dark";
  accentColor: string;  // hex color styling
  streakFreezeActive?: boolean; // ADHD & Burnout streak freeze
  adhdCompanionEnabled?: boolean; // ADHD visual cues enabled
}

export type LogMap = Record<string, string[]>; // "2026-05-26" -> ["habit-id-1", "habit-id-2"]

export interface HabitStoreContextType {
  habits: Habit[];
  logs: LogMap;
  skips: LogMap;
  settings: Settings;
  celebrated: Record<string, boolean>;
  activeView: string;
  setActiveView: (view: string) => void;
  addHabit: (habit: Omit<Habit, "id" | "createdAt" | "isActive">) => void;
  addHabits: (habits: Omit<Habit, "id" | "createdAt" | "isActive">[]) => void;
  updateHabit: (id: string, updates: Partial<Omit<Habit, "id">>) => void;
  deleteHabit: (id: string) => void;
  toggleLog: (habitId: string, date: string) => void;
  isLogged: (habitId: string, date: string) => boolean;
  toggleSkip: (habitId: string, date: string) => void;
  isSkipped: (habitId: string, date: string) => boolean;
  updateSettings: (updates: Partial<Settings>) => void;
  exportData: () => string;
  importData: (jsonString: string) => boolean;
  wipeDatabase: () => void;
  celebrateMilestone: (habitId: string, milestone: number) => void;
}

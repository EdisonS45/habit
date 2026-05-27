import React, { useState } from "react";
import { HabitProvider, useHabitStore } from "./context/HabitContext";
import { OnboardingView } from "./views/OnboardingView";
import { Sidebar } from "./components/layout/Sidebar";
import { BottomNav } from "./components/layout/BottomNav";
import { TodayView } from "./views/TodayView";
import { WeekView } from "./views/WeekView";
import { MonthView } from "./views/MonthView";
import { AnalyticsView } from "./views/AnalyticsView";
import { SettingsView } from "./views/SettingsView";
import { BottomSheet } from "./components/ui/BottomSheet";
import { HabitForm } from "./components/habits/HabitForm";
import { Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export function AppContent() {
  const { settings, activeView, addHabit } = useHabitStore();
  const [isAddOpen, setIsAddOpen] = useState(false);

  // 1. Force onboarding if not completed
  if (!settings.onboardingComplete) {
    return <OnboardingView />;
  }

  const handleCreateHabitSubmit = (habitData: any) => {
    addHabit(habitData);
    setIsAddOpen(false);
  };

  // 2. Map active view ID to view component with unique structural keys
  const renderActiveView = () => {
    switch (activeView) {
      case "today":
        return <TodayView key="today" />;
      case "week":
        return <WeekView key="week" />;
      case "month":
        return <MonthView key="month" />;
      case "analytics":
        return <AnalyticsView key="analytics" />;
      case "settings":
        return <SettingsView key="settings" />;
      default:
        return <TodayView key="today" />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FAFAF8] dark:bg-[#111111]">
      {/* 1. Left Sidebar Navigation (for Desktop screens >= 768px) */}
      <Sidebar />

      {/* 2. Scrollable Main Panel wrapper with AnimatePresence */}
      <main className="flex-1 h-screen overflow-y-auto relative p-4 md:p-8 md:px-12 w-full max-w-6xl mx-auto pb-24 md:pb-12">
        <div className="w-full">
          <AnimatePresence mode="wait">
            {renderActiveView()}
          </AnimatePresence>
        </div>
      </main>

      {/* 3. Global Floating Action Button - perfectly fixed and stable */}
      {activeView === "today" && (
        <button
          type="button"
          id="add-habit-fab"
          onClick={() => setIsAddOpen(true)}
          className="fixed bottom-20 md:bottom-8 right-6 md:right-8 w-12 h-12 md:w-14 md:h-14 shadow-lg bg-[#7C9EFF] hover:bg-[#688CEB] active:scale-95 text-white rounded-full flex items-center justify-center cursor-pointer z-50 transition-colors duration-200"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* 4. Bottom Sheet Creator Modal */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Form New Habit"
      >
        <HabitForm onSubmit={handleCreateHabitSubmit} onCancel={() => setIsAddOpen(false)} />
      </BottomSheet>

      {/* 5. Bottom Sticky Bar Navigation (for Mobile screens < 768px) */}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <HabitProvider>
      <AppContent />
    </HabitProvider>
  );
}

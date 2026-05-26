import React from "react";
import { HabitProvider, useHabitStore } from "./context/HabitContext";
import { OnboardingView } from "./views/OnboardingView";
import { Sidebar } from "./components/layout/Sidebar";
import { BottomNav } from "./components/layout/BottomNav";
import { TodayView } from "./views/TodayView";
import { WeekView } from "./views/WeekView";
import { MonthView } from "./views/MonthView";
import { AnalyticsView } from "./views/AnalyticsView";
import { SettingsView } from "./views/SettingsView";
import { AnimatePresence } from "framer-motion";

export function AppContent() {
  const { settings, activeView } = useHabitStore();

  // 1. Force onboarding if not completed
  if (!settings.onboardingComplete) {
    return <OnboardingView />;
  }

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

      {/* 3. Bottom Sticky Bar Navigation (for Mobile screens < 768px) */}
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

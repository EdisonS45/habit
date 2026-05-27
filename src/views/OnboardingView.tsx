import React, { useState, useEffect } from "react";
import { useHabitStore } from "../context/HabitContext";
import { Category } from "../types";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FOCUS_OPTIONS: { id: Category; label: string; emoji: string }[] = [
  { id: "health", label: "Health", emoji: "🥗" },
  { id: "fitness", label: "Fitness", emoji: "🏃" },
  { id: "study", label: "Study / Upskilling", emoji: "📚" },
  { id: "mindfulness", label: "Mindfulness", emoji: "🧘" },
  { id: "productivity", label: "Productivity", emoji: "🎯" },
];

const STARTER_HABITS_POOL: Record<
  Category,
  { name: string; emoji: string; color: string; goalDaysPerWeek: number }
> = {
  health: { name: "Drink 2 Litres of Water", emoji: "💧", color: "#FF9E9E", goalDaysPerWeek: 7 },
  fitness: { name: "Morning Workout / Stretch", emoji: "🏃", color: "#6FCF97", goalDaysPerWeek: 4 },
  study: { name: "Read for 20 Minutes", emoji: "📚", color: "#7C9EFF", goalDaysPerWeek: 5 },
  mindfulness: { name: "Daily Meditation / Pause", emoji: "🧘", color: "#C77DFF", goalDaysPerWeek: 6 },
  productivity: { name: "Review Todo List & Objectives", emoji: "🎯", color: "#F2C94C", goalDaysPerWeek: 5 },
};

export const OnboardingView: React.FC = () => {
  const { updateSettings, addHabit, setActiveView } = useHabitStore();
  
  const [step, setStep] = useState<number>(1);
  const [userName, setUserName] = useState<string>("");
  const [selectedFocus, setSelectedFocus] = useState<Category[]>([]);
  const [selectedStarters, setSelectedStarters] = useState<Record<string, boolean>>({});

  const handleNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const toggleFocus = (id: Category) => {
    setSelectedFocus((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Get matching starters for Screen 4
  const recommendedStarters = selectedFocus.map((focus) => ({
    category: focus,
    ...STARTER_HABITS_POOL[focus],
  }));

  // Initialize starters mapping on load of step 4
  useEffect(() => {
    if (step === 4) {
      const initial: Record<string, boolean> = {};
      recommendedStarters.forEach((starter) => {
        initial[starter.name] = true;
      });
      setSelectedStarters(initial);
    }
  }, [step, selectedFocus]);

  const toggleStarterSelection = (name: string) => {
    setSelectedStarters((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleOnboardingComplete = () => {
    // 1. Create chosen starter habits
    recommendedStarters.forEach((starter) => {
      if (selectedStarters[starter.name]) {
        addHabit({
          name: starter.name,
          category: starter.category,
          color: starter.color,
          emoji: starter.emoji,
          goalDaysPerWeek: starter.goalDaysPerWeek,
        });
      }
    });

    // 2. Persist configurations
    updateSettings({
      userName: userName.trim() || "Achiever",
      focusAreas: selectedFocus,
      onboardingComplete: true,
      theme: "light",
      accentColor: "#7C9EFF",
    });

    // 3. Navigate
    setActiveView("today");
  };

  // Horizontal slide transition config
  const slideVariants = {
    enter: { x: 80, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 350, damping: 28 } },
    exit: { x: -80, opacity: 0, transition: { duration: 0.18 } }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (step === 2 && userName.trim().length > 0) {
        handleNextStep();
      } else if (step === 3 && selectedFocus.length > 0) {
        handleNextStep();
      } else if (step === 4) {
        handleOnboardingComplete();
      }
    }
  };

  return (
    <div id="onboarding-container" className="min-h-screen bg-[#FAFAF8] dark:bg-[#111111] text-gray-900 dark:text-neutral-100 flex flex-col items-center justify-center p-6 select-none">
      {/* Container Card */}
      <div id="onboarding-card" className="w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-3xl p-6 md:p-10 shadow-xl space-y-8 relative overflow-hidden">
        
        {/* Step dots with horizontal expansion spring transitions */}
        <div id="onboarding-progress-dots" className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <motion.div
              key={s}
              animate={{
                width: step === s ? 24 : 8,
                backgroundColor: step === s ? "#7C9EFF" : "rgba(107, 107, 107, 0.15)",
              }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className="h-2 rounded-full cursor-pointer"
              onClick={() => {
                if (s < step) setStep(s); // allow easy backtracking
              }}
            />
          ))}
        </div>

        {/* Swipe screen using AnimatePresence with direction-aware sliding */}
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-6 text-center"
            >
              {/* Line-art illustration style */}
              <div className="mx-auto w-32 h-32 text-[#7C9EFF] flex items-center justify-center">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] tracking-widest uppercase font-extrabold text-[#AAAAAA] block">
                  CraftedByYours
                </span>
                <h1 className="text-3xl font-black text-gray-900 dark:text-neutral-50 tracking-tight">
                  Habit Companion
                </h1>
                <p className="text-secondary text-xs font-semibold max-w-xs mx-auto leading-relaxed">
                  Your habits. Your progress. Your pace. Take control of your routines with dynamic lists, streak tracking, and backup options.
                </p>
              </div>

              <button
                type="button"
                id="get-started-btn"
                onClick={handleNextStep}
                className="w-full py-3.5 bg-[#7C9EFF] hover:bg-[#688CEB] active:scale-98 text-white font-extrabold text-xs tracking-wider rounded-2xl shadow-md transition-all uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-6 text-center"
            >
              <div className="space-y-2">
                <span className="text-[10px] tracking-widest uppercase font-extrabold text-[#7C9EFF] block">
                  Personalization
                </span>
                <h2 className="text-2xl font-black text-gray-900 dark:text-neutral-50 tracking-tight">
                  What should we call you?
                </h2>
                <p className="text-secondary text-xs font-semibold max-w-xs mx-auto">
                  This helps personalize your greetings and achievement alerts.
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your name..."
                  autoFocus
                  required
                  id="onboarding-username-input"
                  className="w-full text-center px-4 py-3 border border-gray-150 dark:border-neutral-800 rounded-2xl bg-gray-50 dark:bg-neutral-850 focus:bg-white dark:focus:bg-neutral-900 text-sm font-bold placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#7C9EFF] transition-all"
                />
              </div>

              <button
                type="button"
                disabled={userName.trim().length === 0}
                onClick={handleNextStep}
                className={`w-full py-3.5 font-extrabold text-xs tracking-wider rounded-2xl shadow-md transition-all uppercase cursor-pointer flex items-center justify-center gap-2 ${
                  userName.trim().length > 0
                    ? "bg-[#7C9EFF] hover:bg-[#688CEB] active:scale-98 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed shadow-none"
                }`}
              >
                Continue
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-6 text-center"
            >
              <div className="space-y-2">
                <span className="text-[10px] tracking-widest uppercase font-extrabold text-[#7C9EFF] block">
                  Focus Pillars
                </span>
                <h2 className="text-2xl font-black text-gray-900 dark:text-neutral-50 tracking-tight">
                  What would you focus on?
                </h2>
                <p className="text-secondary text-xs font-semibold max-w-xs mx-auto">
                  Select key areas to structure your collateral tracking. At least 1 focus area is required.
                </p>
              </div>

              {/* Flex-wrap container with absolutely NO scrollbars or overflows */}
              <div className="flex flex-wrap gap-2.5 justify-center py-2">
                {FOCUS_OPTIONS.map((opt) => {
                  const isSelected = selectedFocus.includes(opt.id);
                  return (
                    <motion.button
                      key={opt.id}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleFocus(opt.id)}
                      onKeyDown={handleKeyDown}
                      className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs ${
                        isSelected
                          ? "bg-[rgba(124,158,255,0.08)] border-[#7C9EFF] text-[#7C9EFF] scale-102"
                          : "bg-transparent border-gray-150 dark:border-neutral-800 text-gray-700 dark:text-neutral-300 hover:border-gray-300 dark:hover:border-neutral-600"
                      }`}
                    >
                      <span>{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={selectedFocus.length === 0}
                onClick={handleNextStep}
                className={`w-full py-3.5 font-extrabold text-xs tracking-wider rounded-2xl shadow-md transition-all uppercase cursor-pointer flex items-center justify-center gap-2 ${
                  selectedFocus.length > 0
                    ? "bg-[#7C9EFF] hover:bg-[#688CEB] active:scale-98 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed shadow-none"
                }`}
              >
                Continue
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <span className="text-[10px] tracking-widest uppercase font-extrabold text-[#7C9EFF] block">
                  Starter Pack
                </span>
                <h2 className="text-2xl font-black text-gray-900 dark:text-neutral-50 tracking-tight">
                  Suggested Habits
                </h2>
                <p className="text-secondary text-xs font-semibold">
                  Kickstart your journey with optimal preset habits based on your focus.
                </p>
              </div>

              {/* Suggestions Cards */}
              <div className="space-y-2 my-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                {recommendedStarters.map((starter) => {
                  const active = selectedStarters[starter.name] || false;
                  return (
                    <div
                      key={starter.name}
                      onClick={() => toggleStarterSelection(starter.name)}
                      className={`flex items-center justify-between p-3.5 border rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-850 cursor-pointer transition-all ${
                        active
                          ? "border-[#7C9EFF] bg-[rgba(124,158,255,0.02)]"
                          : "border-gray-150 dark:border-neutral-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{starter.emoji}</span>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-neutral-50">
                            {starter.name}
                          </p>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold" style={{ color: starter.color }}>
                            {starter.category} • {starter.goalDaysPerWeek}d/wk
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        active ? "bg-[#7C9EFF] border-[#7C9EFF] text-white" : "border-gray-200 dark:border-neutral-700"
                      }`}>
                        {active && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                id="start-tracking-btn"
                onClick={handleOnboardingComplete}
                className="w-full py-3.5 bg-[#7C9EFF] hover:bg-[#688CEB] active:scale-98 text-white font-extrabold text-xs tracking-wider rounded-2xl shadow-md transition-all uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                Start Tracking
                <Sparkles size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

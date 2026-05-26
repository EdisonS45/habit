import React, { useState } from "react";
import { useHabitStore } from "../context/HabitContext";
import { HabitCategory } from "../types";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FOCUS_OPTIONS: { id: HabitCategory; label: string; emoji: string }[] = [
  { id: "health", label: "Health", emoji: "🥗" },
  { id: "fitness", label: "Fitness", emoji: "🏃" },
  { id: "study", label: "Study / Upskilling", emoji: "📚" },
  { id: "mindfulness", label: "Mindfulness", emoji: "🧘" },
  { id: "productivity", label: "Productivity", emoji: "🎯" },
];

const STARTER_HABITS_POOL: Record<
  HabitCategory,
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
  const [selectedFocus, setSelectedFocus] = useState<HabitCategory[]>([]);
  const [selectedStarters, setSelectedStarters] = useState<Record<string, boolean>>({});
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  const handleNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const toggleFocus = (id: HabitCategory) => {
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
  React.useEffect(() => {
    if (step === 4) {
      const initial: Record<string, boolean> = {};
      recommendedStarters.forEach((starter) => {
        initial[starter.name] = true;
      });
      setSelectedStarters(initial);
    }
  }, [step]);

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

  const childrenVariants = {
    hidden: { y: 12, opacity: 0 },
    visible: (customIndex: number) => ({
      y: 0,
      opacity: 1,
      transition: { delay: customIndex * 0.08, duration: 0.35, ease: "easeOut" }
    })
  };

  return (
    <div id="onboarding-container" className="min-h-screen bg-[#FAFAF8] dark:bg-[#111111] text-gray-900 dark:text-neutral-100 flex flex-col items-center justify-center p-6 select-none">
      {/* Container Card */}
      <div id="onboarding-card" className="w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-6 md:p-10 shadow-xl space-y-8 relative overflow-hidden">
        
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
              {/* Logo / Wordmark Header */}
              <motion.div variants={childrenVariants} custom={0} initial="hidden" animate="visible" className="flex justify-center">
                <div className="w-16 h-16 bg-[#7C9EFF]/10 dark:bg-[#7C9EFF]/20 rounded-2xl flex items-center justify-center text-3xl">
                  🌱
                </div>
              </motion.div>
              
              <div className="space-y-1.5">
                <motion.h1 
                  variants={childrenVariants} 
                  custom={1} 
                  initial="hidden" 
                  animate="visible"
                  className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-neutral-50"
                >
                  CraftedByYours
                </motion.h1>
                <motion.p 
                  variants={childrenVariants} 
                  custom={2} 
                  initial="hidden" 
                  animate="visible"
                  className="text-xs font-semibold text-secondary select-none tracking-wide"
                >
                  Your habits. Your progress. Your pace.
                </motion.p>
              </div>

              {/* Draw-in animation using SVG check stroke pathLength scaling */}
              <motion.div variants={childrenVariants} custom={3} initial="hidden" animate="visible" className="py-2 flex justify-center">
                <svg className="w-48 h-32 text-[#7C9EFF]/20" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <motion.circle 
                    cx="100" 
                    cy="60" 
                    r="40" 
                    fill="currentColor" 
                    fillOpacity="0.4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
                  />
                  <motion.path 
                    d="M85 62L95 72L115 52" 
                    stroke="#7C9EFF" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                  />
                  <motion.circle cx="40" cy="30" r="10" fill="currentColor" fillOpacity="0.2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} />
                  <motion.circle cx="165" cy="90" r="15" fill="currentColor" fillOpacity="0.2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }} />
                </svg>
              </motion.div>

              <motion.button
                id="start-onboarding-btn"
                variants={childrenVariants}
                custom={4}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleNextStep}
                className="w-full py-3.5 text-xs font-bold bg-[#7C9EFF] hover:bg-[#688CEB] text-white rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 select-none uppercase tracking-widest"
              >
                Get Started
                <ArrowRight size={14} />
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center space-y-1">
                <motion.h2 variants={childrenVariants} custom={0} initial="hidden" animate="visible" className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-neutral-50 text-center">
                  What should we call you?
                </motion.h2>
                <motion.p variants={childrenVariants} custom={1} initial="hidden" animate="visible" className="text-xs text-secondary">
                  Let's personalize your daily dashboard view.
                </motion.p>
              </div>

              {/* Underline expanding from center on focus */}
              <motion.div variants={childrenVariants} custom={2} initial="hidden" animate="visible" className="relative w-full py-4">
                <input
                  id="name-input"
                  type="text"
                  autoFocus
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={isInputFocused ? "" : "Enter your name"}
                  className="w-full text-center text-xl font-bold bg-transparent border-b-2 border-gray-100 dark:border-neutral-800 py-3 text-gray-900 dark:text-neutral-100 placeholder-gray-300 dark:placeholder-neutral-600 focus:outline-none"
                  maxLength={20}
                />
                <motion.div
                  className="absolute bottom-4 left-0 right-0 h-[2px] bg-[#7C9EFF] origin-center"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isInputFocused ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                />
              </motion.div>

              {/* Dynamic button spring scale triggered only with text */}
              <motion.div variants={childrenVariants} custom={3} initial="hidden" animate="visible">
                <AnimatePresence mode="wait">
                  {userName.trim() ? (
                    <motion.button
                      key="active-btn"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      id="continue-name-btn"
                      onClick={handleNextStep}
                      className="w-full py-3.5 text-xs font-bold bg-[#7C9EFF] hover:bg-[#688CEB] text-white rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 select-none uppercase tracking-widest"
                    >
                      Continue
                      <ArrowRight size={14} />
                    </motion.button>
                  ) : (
                    <div className="w-full py-3.5 text-xs font-bold bg-gray-100 dark:bg-neutral-800 text-gray-400 rounded-xl flex items-center justify-center gap-2 select-none uppercase tracking-widest opacity-40 select-none cursor-not-allowed">
                      Continue
                      <ArrowRight size={14} />
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center space-y-1">
                <motion.h2 variants={childrenVariants} custom={0} initial="hidden" animate="visible" className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-neutral-50 text-center">
                  Select your focus areas
                </motion.h2>
                <motion.p variants={childrenVariants} custom={1} initial="hidden" animate="visible" className="text-xs text-secondary">
                  Pick at least 1 pillar to suggest relevant starter goals.
                </motion.p>
              </div>

              {/* Stagger list entrance using layout springs with bounce selected cells */}
              <motion.div 
                id="focus-picker-grid" 
                className="grid grid-cols-1 gap-2.5 py-2 max-h-[240px] overflow-y-auto pr-1"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.04 } }
                }}
              >
                {FOCUS_OPTIONS.map((option) => {
                  const active = selectedFocus.includes(option.id);
                  return (
                    <motion.button
                      key={option.id}
                      variants={{
                        hidden: { scale: 0.85, opacity: 0 },
                        visible: { scale: 1, opacity: 1 }
                      }}
                      whileTap={{ scale: 0.94 }}
                      animate={{
                        borderColor: active ? "#7C9EFF" : "#F0EEE9",
                        backgroundColor: active ? "rgba(124, 158, 255, 0.08)" : "transparent",
                        scale: active ? 1.03 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 350, damping: 20 }}
                      type="button"
                      id={`focus-${option.id}`}
                      onClick={() => toggleFocus(option.id)}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-gray-150 dark:border-neutral-800 text-left transition-all cursor-pointer bg-white dark:bg-neutral-900"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl select-none leading-none">{option.emoji}</span>
                        <span className="text-xs font-bold text-gray-800 dark:text-neutral-100 uppercase tracking-wider">{option.label}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          active
                            ? "bg-[#7C9EFF] border-[#7C9EFF] text-white"
                            : "border-gray-300 dark:border-neutral-700 bg-transparent"
                        }`}
                      >
                        {active && <Check size={12} strokeWidth={3} />}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>

              <motion.button
                id="continue-focus-btn"
                variants={childrenVariants}
                custom={3}
                initial="hidden"
                animate="visible"
                disabled={selectedFocus.length === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleNextStep}
                className="w-full py-3.5 text-xs font-bold bg-[#7C9EFF] disabled:bg-[#FAFAF8] dark:disabled:bg-neutral-800 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-[#688CEB] text-white rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 select-none uppercase tracking-widest"
              >
                Continue
                <ArrowRight size={14} />
              </motion.button>
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
              <div className="text-center space-y-1">
                <motion.h2 variants={childrenVariants} custom={0} initial="hidden" animate="visible" className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-neutral-50 text-center">
                  Pillar starter suggestions:
                </motion.h2>
                <motion.p variants={childrenVariants} custom={1} initial="hidden" animate="visible" className="text-xs text-secondary">
                  Toggle recommended habits. You can edit these anytime.
                </motion.p>
              </div>

              {/* Stagger slide entrance lists */}
              <motion.div 
                id="starter-habits-list" 
                className="space-y-2 max-h-[220px] overflow-y-auto pr-1"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } }
                }}
              >
                {recommendedStarters.map((starter) => {
                  const checked = selectedStarters[starter.name] ?? false;
                  return (
                    <motion.div
                      key={starter.name}
                      variants={{
                        hidden: { y: 20, opacity: 0 },
                        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
                      }}
                      onClick={() => toggleStarterSelection(starter.name)}
                      style={{ borderLeftColor: starter.color }}
                      className={`flex items-center justify-between p-3.5 bg-gray-50 dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 border-l-[4px] rounded-xl cursor-pointer hover:border-gray-200 transition-all select-none ${
                        checked ? "shadow-xs bg-white dark:bg-neutral-800" : "opacity-50 select-none bg-gray-50/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0 leading-none">{starter.emoji}</span>
                        <div className="min-w-0">
                          <span className="block text-xs font-bold truncate text-gray-800 dark:text-neutral-200">
                            {starter.name}
                          </span>
                          <span className="block text-[9px] text-gray-400 capitalize font-bold tracking-wide">
                            {starter.category} • {starter.goalDaysPerWeek}d goal
                          </span>
                        </div>
                      </div>
                      
                      {/* Interactive toggle matching the habit check-outline */}
                      <motion.div
                        whileTap={{ scale: 0.8 }}
                        animate={{
                          backgroundColor: checked ? "#7C9EFF" : "transparent",
                          borderColor: checked ? "#7C9EFF" : "rgb(209, 213, 219)",
                        }}
                        className="w-5 h-5 rounded-full flex items-center justify-center border transition-all"
                      >
                        {checked && <Check size={11} strokeWidth={3} className="text-white" />}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </motion.div>

              <motion.button
                id="onboarding-finish-btn"
                variants={childrenVariants}
                custom={3}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleOnboardingComplete}
                className="w-full py-3.5 text-xs font-bold bg-[#7C9EFF] hover:bg-[#688CEB] text-white rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 select-none uppercase tracking-widest"
              >
                Start Tracking
                <Sparkles size={14} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

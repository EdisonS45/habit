import React, { useRef, useState, useEffect } from "react";
import { Habit } from "../../types";
import { useHabitStore } from "../../context/HabitContext";
import { Flame, MoreHorizontal, Check } from "lucide-react";
import { Badge } from "../ui/Badge";
import { format, startOfWeek, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { BottomSheet } from "../ui/BottomSheet";
import { HabitForm } from "./HabitForm";
import { Tooltip } from "../ui/Tooltip";

interface HabitCardProps {
  habit: Habit;
  dateStr: string; // The specific date YYYY-MM-DD
}

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex || !hex.startsWith("#")) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getHabitSubtitle = (h: Habit) => {
  const nameLower = h.name.toLowerCase();
  if (nameLower.includes("water") || nameLower.includes("drink")) return "Stay hydrated. Feel better.";
  if (nameLower.includes("workout") || nameLower.includes("walk") || nameLower.includes("gym") || nameLower.includes("stretch")) return "Move your body. Clear your mind.";
  if (nameLower.includes("read") || nameLower.includes("book") || nameLower.includes("study") || nameLower.includes("learn")) return "Feed your mind. Grow daily.";
  if (nameLower.includes("meditation") || nameLower.includes("pause") || nameLower.includes("meditate") || nameLower.includes("breathe")) return "Pause and breathe. Find stillness.";
  if (nameLower.includes("todo") || nameLower.includes("objectives") || nameLower.includes("review") || nameLower.includes("plan")) return "Structure your focus. Take small steps.";
  
  switch (h.category) {
    case "health": return "Nourish your well-being, step by step.";
    case "fitness": return "Energize and move at your own pace.";
    case "study": return "Cultivate curiosity and knowledge.";
    case "mindfulness": return "Pause, breathe, and rest your mind.";
    case "productivity": return "Simplify the day, reduce the load.";
    default: return "Track your routine and grow.";
  }
};

export const HabitCard: React.FC<HabitCardProps> = ({ habit, dateStr }) => {
  const { toggleLog, isLogged, toggleSkip, isSkipped, updateHabit, deleteHabit, logs, skips } = useHabitStore();
  
  const completed = isLogged(habit.id, dateStr);
  const isSkippedToday = isSkipped(habit.id, dateStr);

  const [isEditingReason, setIsEditingReason] = useState(false);
  const [localReason, setLocalReason] = useState(habit.reason || "");
  const [activeAffirmation, setActiveAffirmation] = useState<string | null>(null);

  useEffect(() => {
    setLocalReason(habit.reason || "");
  }, [habit.reason]);

  // Calculate current streak backward from today, including skips as streak protectors
  const calculateStreak = (): number => {
    let count = 0;
    let checkDate = new Date();
    const todayKey = format(checkDate, "yyyy-MM-dd");
    if (!logs[todayKey]?.includes(habit.id) && !skips[todayKey]?.includes(habit.id)) {
      checkDate = addDays(checkDate, -1);
    }
    while (true) {
      const key = format(checkDate, "yyyy-MM-dd");
      if (logs[key]?.includes(habit.id) || skips[key]?.includes(habit.id)) {
        count++;
        checkDate = addDays(checkDate, -1);
      } else {
        break;
      }
    }
    return count;
  };

  const streak = calculateStreak();

  const [particles, setParticles] = useState<{ id: number; angle: number; dist: number }[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Calculate logs completed for the current week (Monday-Sunday) including skips
  const today = new Date();
  const mon = startOfWeek(today, { weekStartsOn: 1 });
  let weeklyCompletions = 0;
  for (let i = 0; i < 7; i++) {
    const checkDateStr = format(addDays(mon, i), "yyyy-MM-dd");
    const dayLogs = logs[checkDateStr] || [];
    const daySkips = skips[checkDateStr] || [];
    if (dayLogs.includes(habit.id) || daySkips.includes(habit.id)) {
      weeklyCompletions++;
    }
  }

  const activeColor = habit.color;

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLog(habit.id, dateStr);

    if (!completed) {
      // Pick a random, friendly, warm rotating affirmation on completion
      const affirmations = [
        "You showed up. That counts.",
        "1% better — it adds up.",
        "Small win. Real progress.",
        "You did the thing.",
        "Consistency is built day by day.",
        "You're building momentum!",
        "Gentle daily steps are superpower."
      ];
      const rand = affirmations[Math.floor(Math.random() * affirmations.length)];
      setActiveAffirmation(rand);
      
      // Clean up affirmation and particles after 2.5 seconds
      setTimeout(() => setActiveAffirmation(null), 2500);

      // 6-particle burst outward (delightful mini celebration)
      const generated = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        angle: (i * 2 * Math.PI) / 6 + (Math.random() * 0.4 - 0.2),
        dist: 22 + Math.random() * 10,
      }));
      setParticles(generated);
      setTimeout(() => setParticles([]), 500);
    }
  };

  const handleReasonSave = () => {
    updateHabit(habit.id, { reason: localReason.trim() });
    setIsEditingReason(false);
  };

  // --- Right-Click and Long-Press Recognition ---
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.nativeEvent instanceof MouseEvent) return;

    const x = e.clientX;
    const y = e.clientY;
    pressTimer.current = setTimeout(() => {
      setMenuPos({ x, y });
      setMenuOpen(true);
    }, 500);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  useEffect(() => {
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
    };
  }, []);

  const handleEditSubmit = (updatedData: {
    name: string;
    category: any;
    color: string;
    emoji: string;
    goalDaysPerWeek: number;
    reason?: string;
    bestTime?: "morning" | "afternoon" | "evening" | "anytime";
  }) => {
    updateHabit(habit.id, updatedData);
    setIsEditOpen(false);
  };

  return (
    <>
      <motion.div
        id={`habit-card-${habit.id}`}
        layout
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`flex flex-col md:flex-row items-start md:items-center justify-between p-5 md:p-6 rounded-[28px] border transition-all select-none relative gap-5 ${
          completed 
            ? "border-emerald-500/10 dark:border-emerald-500/5 bg-[#F4FBF7]/50 dark:bg-emerald-950/[0.03] opacity-90 shadow-none animate-fade-in" 
            : isSkippedToday
            ? "border-sky-500/15 dark:border-sky-500/10 bg-[#EDFAFF]/60 dark:bg-sky-950/[0.04] opacity-90 shadow-none animate-scale-up"
            : "border-gray-100 dark:border-neutral-850 bg-white dark:bg-[#161616] hover:bg-gray-50/20 dark:hover:bg-neutral-850/20 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.012)] hover:shadow-xs"
        }`}
      >
        {/* Prominent, Clearly Visible & Tappable Options Button (at least 40px) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPos({ x: rect.left - 40, y: rect.bottom + 8 });
            setMenuOpen(true);
          }}
          type="button"
          id={`toggle-menu-${habit.id}`}
          className="absolute top-4 right-4 w-10 h-10 rounded-full border border-gray-150 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100 shadow-3xs flex items-center justify-center cursor-pointer transition-all active:scale-[0.92] hover:bg-gray-50 dark:hover:bg-neutral-850"
          title="Habit Options"
        >
          <MoreHorizontal size={18} strokeWidth={2.5} />
        </button>

        {/* Left Section: Emoji Bubble, Text context and reasons */}
        <div className="flex items-start gap-4 flex-1 min-w-0 pr-8">
          <div 
            style={{ backgroundColor: hexToRgba(habit.color, 0.12) }}
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-3xs relative"
          >
            <span className="text-2xl shrink-0 select-none">{habit.emoji}</span>

            {/* Microinteraction particles burst */}
            {particles.map((p) => {
              const tx = Math.cos(p.angle) * p.dist;
              const ty = Math.sin(p.angle) * p.dist;
              return (
                <motion.div
                  key={p.id}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{ x: tx, y: ty, scale: 0.3, opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  style={{ backgroundColor: activeColor }}
                  className="absolute w-1 h-1 rounded-full pointer-events-none left-1/2 top-1/2 -ml-0.5 -mt-0.5"
                />
              );
            })}
          </div>

          <div className="flex-1 min-w-0 text-left space-y-1">
            <h4 
              className={`text-sm md:text-base font-black tracking-tight transition-all duration-150 ${
                completed
                  ? "text-gray-400 dark:text-neutral-500 line-through font-semibold"
                  : isSkippedToday
                  ? "text-sky-700 dark:text-sky-400 font-semibold italic"
                  : "text-gray-900 dark:text-neutral-50"
              }`}
            >
              {habit.name}
            </h4>
            
            <p className="text-xs font-semibold text-gray-400 dark:text-neutral-500 leading-normal">
              {getHabitSubtitle(habit)}
            </p>

            {/* My ADHD Reason - Editable Inline */}
            <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
              {isEditingReason ? (
                <div className="flex items-center gap-1.5 mt-1 animate-scale-up">
                  <input
                    type="text"
                    value={localReason}
                    onChange={(e) => setLocalReason(e.target.value)}
                    onBlur={handleReasonSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleReasonSave();
                      if (e.key === "Escape") {
                        setLocalReason(habit.reason || "");
                        setIsEditingReason(false);
                      }
                    }}
                    maxLength={100}
                    placeholder="e.g. This helps me relax before sleep"
                    className="px-2.5 py-1 text-[11px] border border-[#7C9EFF]/30 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg text-gray-800 dark:text-neutral-100 focus:outline-none w-full max-w-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleReasonSave}
                    className="text-[10px] font-extrabold text-[#7C9EFF] hover:text-[#5E83FA] uppercase px-1.5 cursor-pointer shrink-0"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p 
                  onClick={() => setIsEditingReason(true)}
                  className="text-[11px] text-gray-400/80 dark:text-neutral-500 font-semibold cursor-pointer py-0.5 hover:text-gray-700 dark:hover:text-neutral-300 transition-colors flex items-center gap-1 group select-none"
                  title="Click to edit intent"
                >
                  <span className="opacity-50">💡 Intent:</span>
                  {habit.reason ? (
                    <span className="italic text-gray-600 dark:text-neutral-300 font-semibold group-hover:underline">
                      “{habit.reason}”
                    </span>
                  ) : (
                    <span className="text-gray-300 dark:text-neutral-600 italic hover:underline">
                      Add your motivation reason...
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Badges strip (Best Time + Streaks) */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {habit.bestTime && habit.bestTime !== "anytime" && (
                <div className="flex items-center gap-1 px-2.5 py-0.5 bg-gray-50 dark:bg-neutral-850 text-gray-500 dark:text-neutral-400 rounded-full w-fit max-w-full border border-gray-150 dark:border-neutral-800/80 select-none">
                  <span className="text-[10px]">
                    {habit.bestTime === "morning" ? "🌅" : habit.bestTime === "afternoon" ? "☀️" : "🌙"}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest capitalize">{habit.bestTime}</span>
                </div>
              )}
              {streak > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/[0.04] dark:bg-amber-400/5 border border-amber-500/10 dark:border-amber-400/10 text-amber-600 dark:text-amber-400 rounded-full w-fit max-w-full select-none animate-scale-up">
                  <span className="text-[10px]">🔥</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest">{streak} day streak</span>
                </div>
              )}
            </div>

            {/* Subtle, rotating check-in affirmation popup bubble */}
            <AnimatePresence>
              {activeAffirmation && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  className="mt-1.5 text-[11px] font-extrabold text-[#7C9EFF] dark:text-[#9FB7FF] flex items-center gap-1 px-2.5 py-1 bg-[#7C9EFF]/5 dark:bg-[#7C9EFF]/10 border border-[#7C9EFF]/15 dark:border-[#7C9EFF]/20 rounded-xl w-fit animate-fade-in"
                >
                  <span>✨</span>
                  <span>{activeAffirmation}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Middle Section: Progress Dots with subtle look */}
        <div className="flex flex-col items-center md:items-end md:mr-4 shrink-0 select-none w-full md:w-auto mt-2 md:mt-0 gap-1.5">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const isFilled = i < weeklyCompletions;
              return (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    isFilled ? "opacity-100 animate-scale-up" : "bg-gray-100 dark:bg-neutral-850"
                  }`}
                  style={{
                    backgroundColor: isFilled ? habit.color : undefined,
                    border: !isFilled ? "1px solid rgba(0,0,0,0.04)" : undefined,
                  }}
                />
              );
            })}
          </div>
          <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest leading-none">
            {weeklyCompletions} / {habit.goalDaysPerWeek} target
          </span>
        </div>

        {/* Right Section: Standardised Completion Button & Skip Nudge layout */}
        <div className="shrink-0 w-full md:w-[145px] select-none flex flex-col items-center gap-1.5 mt-2 md:mt-0">
          {completed ? (
            <button
              onClick={handleToggleClick}
              type="button"
              style={{ backgroundColor: habit.color, borderColor: habit.color }}
              className="w-full h-10.5 rounded-full text-white border font-extrabold text-[11px] tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-3xs transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
            >
              <Check size={13} strokeWidth={3} className="shrink-0 animate-scale-up" />
              <span>Complete</span>
            </button>
          ) : isSkippedToday ? (
            <button
              onClick={() => toggleSkip(habit.id, dateStr)}
              type="button"
              className="w-full h-10.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-150 dark:border-sky-500/20 font-extrabold text-[11px] tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-3xs transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
            >
              <span className="text-[11px] animate-scale-up">❄️</span>
              <span>Skipped</span>
            </button>
          ) : (
            <button
              onClick={handleToggleClick}
              type="button"
              className="w-full h-10.5 rounded-full bg-white dark:bg-neutral-900 border font-extrabold text-[11px] tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.97] cursor-pointer shrink-0"
              style={{
                color: habit.color,
                borderColor: hexToRgba(habit.color, 0.4),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hexToRgba(habit.color, 0.05);
                e.currentTarget.style.borderColor = habit.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = hexToRgba(habit.color, 0.4);
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full border-2 shrink-0 transition-transform duration-200" style={{ borderColor: habit.color }} />
              <span>Mark Done</span>
            </button>
          )}

          {/* Skip link below main button - low-emphasis */}
          {!completed && !isSkippedToday && (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSkip(habit.id, dateStr);
                  // Kind ADHD affirmations on skip without penalty
                  const skipAffirmations = [
                    "Rest is part of the process.",
                    "Giving yourself grace is strength.",
                    "Self-recovery counts.",
                    "Streak protected. Breathe easy.",
                    "Choose self-care today."
                  ];
                  const rand = skipAffirmations[Math.floor(Math.random() * skipAffirmations.length)];
                  setActiveAffirmation(rand);
                  setTimeout(() => setActiveAffirmation(null), 2500);
                }}
                type="button"
                className="text-[10px] font-black tracking-wide text-gray-400 hover:text-[#7C9EFF] dark:text-neutral-500 dark:hover:text-[#9FB7FF] transition-colors cursor-pointer decoration-dotted hover:underline underline-offset-3 py-1 px-2 select-none"
              >
                Struggling today? Skip
              </button>
              <Tooltip content="Zero Guilt Skip: Skip without breaking your streak when you're overwhelmed or low on energy. Rest is productive!" />
            </div>
          )}

          {/* Quick Undo Skip if skipped */}
          {isSkippedToday && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSkip(habit.id, dateStr);
              }}
              type="button"
              className="text-[10px] font-black text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer underline decoration-dotted underline-offset-3 py-1 px-2 select-none"
            >
              Restore today
            </button>
          )}
        </div>
      </motion.div>

      {/* Popover Actions Context Menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setMenuOpen(false)} />
          <div
            style={{
              position: "fixed",
              left: Math.min(menuPos.x, window.innerWidth - 130),
              top: Math.min(menuPos.y, window.innerHeight - 100),
            }}
            className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-2xl p-1.5 shadow-2xl z-50 w-32 text-left space-y-0.5"
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                setIsEditOpen(true);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-neutral-850 rounded-xl text-xs font-bold text-gray-700 dark:text-neutral-200 cursor-pointer"
            >
              Edit Habit
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setIsConfirmOpen(true);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-xl text-xs font-bold cursor-pointer"
            >
              Delete Habit
            </button>
          </div>
        </>
      )}

      {/* Overwriting Dialogs for Edit & Delete */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Habit?"
        message={`Are you sure you want to delete "${habit.name}"? This deletes the habit and logs. An undo option will be available.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={() => {
          setIsConfirmOpen(false);
          deleteHabit(habit.id);
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <BottomSheet
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Habit"
      >
        <HabitForm
          initialHabit={habit}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditOpen(false)}
        />
      </BottomSheet>
    </>
  );
};

import React, { useRef, useState, useEffect } from "react";
import { Habit } from "../../types";
import { useHabitStore } from "../../context/HabitContext";
import { Flame, MoreVertical } from "lucide-react";
import { Badge } from "../ui/Badge";
import { format, startOfWeek, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { BottomSheet } from "../ui/BottomSheet";
import { HabitForm } from "./HabitForm";

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
  const { toggleLog, isLogged, updateHabit, deleteHabit, logs } = useHabitStore();
  const completed = isLogged(habit.id, dateStr);

  // Calculate current streak backward from today
  const calculateStreak = (): number => {
    let count = 0;
    let checkDate = new Date();
    const todayKey = format(checkDate, "yyyy-MM-dd");
    if (!logs[todayKey]?.includes(habit.id)) {
      checkDate = addDays(checkDate, -1);
    }
    while (true) {
      const key = format(checkDate, "yyyy-MM-dd");
      if (logs[key]?.includes(habit.id)) {
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

  // Calculate logs completed for the current week (Monday-Sunday)
  const today = new Date();
  const mon = startOfWeek(today, { weekStartsOn: 1 });
  let weeklyCompletions = 0;
  for (let i = 0; i < 7; i++) {
    const checkDateStr = format(addDays(mon, i), "yyyy-MM-dd");
    const dayLogs = logs[checkDateStr] || [];
    if (dayLogs.includes(habit.id)) {
      weeklyCompletions++;
    }
  }

  const activeColor = habit.color;

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLog(habit.id, dateStr);

    if (!completed) {
      // 6-particle burst outward
      const generated = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        angle: (i * 2 * Math.PI) / 6 + (Math.random() * 0.4 - 0.2),
        dist: 22 + Math.random() * 10,
      }));
      setParticles(generated);
      setTimeout(() => setParticles([]), 500);
    }
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
        className={`flex flex-col md:flex-row items-start md:items-center justify-between p-5 md:p-6 rounded-[28px] border transition-all select-none relative gap-4 ${
          completed 
            ? "border-gray-150/60 dark:border-neutral-850/60 bg-[#FAF9F6]/40 dark:bg-neutral-955/20 opacity-90 shadow-none animate-fade-in" 
            : "border-gray-100 dark:border-neutral-850 bg-white dark:bg-[#161616] hover:bg-gray-50/20 dark:hover:bg-neutral-850/20 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.025)]"
        }`}
      >
        {/* Subtle, Discrete Settings Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuPos({ x: e.clientX, y: e.clientY });
            setMenuOpen(true);
          }}
          id={`toggle-menu-${habit.id}`}
          className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800/85 rounded-full text-gray-300 hover:text-gray-550 dark:text-neutral-600 dark:hover:text-neutral-450 cursor-pointer transition-colors"
        >
          <MoreVertical size={13} />
        </button>

        {/* Left Section: Emoji Bubble and Text context */}
        <div className="flex items-center gap-4 flex-1 min-w-0 pr-6">
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

          <div className="flex-1 min-w-0 text-left">
            <h4 
              className={`text-sm md:text-base font-black tracking-tight transition-all duration-150 ${
                completed
                  ? "text-gray-400 dark:text-neutral-500 line-through font-semibold"
                  : "text-gray-900 dark:text-neutral-50"
              }`}
            >
              {habit.name}
            </h4>
            <p className="text-xs font-semibold text-gray-400 dark:text-neutral-500 mt-1 leading-normal">
              {getHabitSubtitle(habit)}
            </p>

            {/* Streak Flag below subtitle */}
            {streak > 0 && (
              <div className="flex items-center gap-1 mt-2.5 px-2.5 py-0.5 bg-[#FFF9E6]/80 dark:bg-amber-400/5 border border-[#FFEBAA]/50 dark:border-amber-400/10 text-amber-600 dark:text-amber-400 rounded-full w-fit max-w-full select-none">
                <span className="text-[10px]">🔥</span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest">{streak} day streak</span>
              </div>
            )}
          </div>
        </div>

        {/* Middle Section: Progress Dots with subtle look */}
        <div className="flex flex-col items-center md:items-end md:mr-4 shrink-0 select-none w-full md:w-auto mt-2 md:mt-0 gap-1">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const isFilled = i < weeklyCompletions;
              return (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    isFilled ? "opacity-100" : "bg-gray-100 dark:bg-neutral-800"
                  }`}
                  style={{
                    backgroundColor: isFilled ? habit.color : undefined,
                    border: !isFilled ? "1px solid rgba(0,0,0,0.04)" : undefined,
                  }}
                />
              );
            })}
          </div>
          <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest leading-none mt-1">
            {weeklyCompletions} / {habit.goalDaysPerWeek} target
          </span>
        </div>

        {/* Right Section: Elegant Action Button with stable dimensions */}
        <div className="shrink-0 w-full md:w-auto select-none flex justify-center md:justify-end mt-2 md:mt-0">
          {completed ? (
            <button
              onClick={handleToggleClick}
              className="w-full md:w-[136px] h-10 rounded-full bg-[#EBF9F1] dark:bg-[#122A1F] text-[#25824F] dark:text-[#4CD083] border border-[#BCECD2] dark:border-[#4CD083]/10 font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-3xs transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>Complete</span>
            </button>
          ) : (
            <button
              onClick={handleToggleClick}
              className="w-full md:w-[136px] h-10 rounded-full bg-white dark:bg-neutral-900 border font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
              style={{
                color: habit.color,
                borderColor: hexToRgba(habit.color, 0.25),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hexToRgba(habit.color, 0.05);
                e.currentTarget.style.borderColor = hexToRgba(habit.color, 0.4);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = hexToRgba(habit.color, 0.25);
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full border-2 shrink-0 transition-transform duration-200 animate-fade-in" style={{ borderColor: habit.color }} />
              <span>Mark Done</span>
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

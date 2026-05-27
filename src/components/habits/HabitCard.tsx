import React, { useRef, useState, useEffect } from "react";
import { Habit } from "../../types";
import { useHabitStore } from "../../context/HabitContext";
import { Flame, Calendar, MoreVertical } from "lucide-react";
import { Badge } from "../ui/Badge";
import { format, startOfWeek, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgress } from "../ui/CircularProgress";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { BottomSheet } from "../ui/BottomSheet";
import { HabitForm } from "./HabitForm";

interface HabitCardProps {
  habit: Habit;
  dateStr: string; // The specific date YYYY-MM-DD
}

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
  const goalPercent = Math.min(100, Math.round((weeklyCompletions / habit.goalDaysPerWeek) * 100));

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
    // Only detect primary mouse/touch pointer
    if (e.button !== 0 && e.nativeEvent instanceof MouseEvent) return;

    // Trigger context menu after 500ms holds
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
        style={{
          borderLeftColor: activeColor,
          backgroundColor: completed ? `${activeColor}0F` : undefined, // ~6% color tint
        }}
        className={`habit-card flex items-center justify-between py-3 px-4 border-l-[5px] transition-all select-none hover:shadow-xs relative h-[74px] overflow-hidden ${
          completed ? "opacity-80 border-opacity-70" : ""
        }`}
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          {/* Circular checkbox with spring animation */}
          <div className="relative shrink-0 select-none">
            <motion.button
              type="button"
              id={`checkbox-${habit.id}`}
              onClick={handleToggleClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.85 }}
              animate={{
                scale: completed ? [0.85, 1.15, 1] : 1,
              }}
              transition={{
                scale: { duration: 0.25, ease: "easeOut" },
              }}
              style={{
                borderColor: completed ? activeColor : undefined,
                backgroundColor: completed ? activeColor : "transparent",
              }}
              className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer shrink-0 transition-colors border-2 border-gray-300 dark:border-neutral-700"
            >
              {completed && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0 text-white leading-none">
                  <motion.path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  />
                </svg>
              )}
            </motion.button>

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

          {/* Text Content */}
          <div className="flex-1 min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-lg shrink-0 select-none">{habit.emoji}</span>
              <span
                className={`text-sm font-bold truncate ${
                  completed
                    ? "text-gray-400 dark:text-neutral-500 line-through"
                    : "text-gray-800 dark:text-neutral-100 font-extrabold"
                }`}
              >
                {habit.name}
              </span>
            </div>
            
            <div className="flex items-center gap-2.5 mt-1 select-none">
              <Badge category={habit.category} />
              
              <span className="inline-flex items-center text-[10px] font-extrabold text-gray-400 dark:text-neutral-500 font-mono tracking-wide">
                <Calendar size={11} className="mr-1" />
                {weeklyCompletions}/{habit.goalDaysPerWeek} Target
              </span>
            </div>
          </div>
        </div>

        {/* Streaks Flag & Circular goal indicator */}
        <div className="flex items-center gap-2.5 shrink-0 select-none">
          {streak > 0 && (
            <motion.div
              id={`streak-${habit.id}`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ type: "spring", stiffness: 350, damping: 15 }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 border border-orange-100 dark:border-orange-500/20 shadow-3xs font-black text-xs h-8"
              title={`${streak} day streak`}
            >
              <Flame size={12} fill="currentColor" />
              <span className="font-mono text-[10px]">{streak}d</span>
            </motion.div>
          )}

          <CircularProgress
            percentage={goalPercent}
            size={36}
            strokeWidth={3}
            color={activeColor}
            showText={true}
          />

          {/* Triple-Dot Button to trigger manual menus */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuPos({ x: e.clientX, y: e.clientY });
              setMenuOpen(true);
            }}
            id={`toggle-menu-${habit.id}`}
            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-neutral-200 cursor-pointer"
          >
            <MoreVertical size={14} />
          </button>
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

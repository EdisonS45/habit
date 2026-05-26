import React from "react";
import { Habit } from "../../types";
import { useHabitStore } from "../../context/HabitContext";
import { Flame, Calendar } from "lucide-react";
import { Badge } from "../ui/Badge";
import { format, startOfWeek, addDays } from "date-fns";
import { motion } from "framer-motion";
import { CircularProgress } from "../ui/CircularProgress";

interface HabitCardProps {
  habit: Habit;
  dateStr: string; // The specific date YYYY-MM-DD we are looking at
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, dateStr }) => {
  const { toggleLog, isLogged, getStreakForHabit, logs } = useHabitStore();
  const completed = isLogged(habit.id, dateStr);
  const streak = getStreakForHabit(habit.id);

  const [particles, setParticles] = React.useState<{ id: number; angle: number; dist: number }[]>([]);

  // Compute logs completed for the current week
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
  const goalPercent = Math.round((weeklyCompletions / habit.goalDaysPerWeek) * 100);

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLog(habit.id, dateStr);

    if (!completed) {
      // Create particle burst of 6 tiny circles exploding outward
      const generated = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        angle: (i * 2 * Math.PI) / 6 + (Math.random() * 0.4 - 0.2),
        dist: 22 + Math.random() * 10,
      }));
      setParticles(generated);
      setTimeout(() => setParticles([]), 500);
    }
  };

  return (
    <motion.div
      id={`habit-card-${habit.id}`}
      layout
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
      whileTap={{ scale: 0.985 }}
      style={{
        borderLeftColor: activeColor,
        backgroundColor: completed ? `${activeColor}10` : undefined, // 6% tint
      }}
      className={`habit-card flex items-center justify-between p-4 border-l-[6px] transition-all select-none hover:shadow-md ${
        completed ? "opacity-90 shadow-2xs" : ""
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Large premium micro-interaction checkbox */}
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
              scale: { duration: 0.24, ease: "easeOut" },
            }}
            style={{
              borderColor: completed ? activeColor : undefined,
              backgroundColor: completed ? activeColor : "transparent",
            }}
            className="flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer shrink-0 transition-colors border-2 border-gray-350 dark:border-neutral-700"
          >
            {completed && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0 text-white">
                <motion.path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              </svg>
            )}
          </motion.button>

          {/* Particle burst */}
          {particles.map((p) => {
            const tx = Math.cos(p.angle) * p.dist;
            const ty = Math.sin(p.angle) * p.dist;
            return (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x: tx, y: ty, scale: 0.3, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ backgroundColor: activeColor }}
                className="absolute w-1 h-1 rounded-full pointer-events-none left-1/2 top-1/2 -ml-0.5 -mt-0.5"
              />
            );
          })}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl shrink-0">{habit.emoji}</span>
            <span
              className={`text-base font-bold truncate leading-tight ${
                completed
                  ? "text-gray-400 dark:text-neutral-500 line-through"
                  : "text-gray-800 dark:text-neutral-200"
              }`}
            >
              {habit.name}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge category={habit.category} />
            
            <span className="inline-flex items-center text-xs font-semibold text-gray-400 dark:text-neutral-500 select-none">
              <Calendar size={12} className="mr-1" />
              {weeklyCompletions}/{habit.goalDaysPerWeek} Target
            </span>
          </div>
        </div>
      </div>

      {/* Streak flag indicator beside circular Goal progress ring */}
      <div className="flex items-center gap-3 shrink-0">
        {streak > 0 && (
          <motion.div
            id={`streak-${habit.id}`}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-500 border border-orange-100 dark:border-orange-500/20 shadow-2xs font-bold text-xs"
            title={`${streak} day streak`}
          >
            <Flame size={14} fill="currentColor" />
            <span className="font-mono">{streak}</span>
          </motion.div>
        )}

        <CircularProgress
          percentage={goalPercent}
          size={32}
          strokeWidth={3.5}
          color={activeColor}
          showText={true}
        />
      </div>
    </motion.div>
  );
};

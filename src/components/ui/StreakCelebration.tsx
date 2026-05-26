import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StreakCelebrationProps {
  habitName: string;
  streakCount: number;
  isOpen: boolean;
  onDismiss: () => void;
}

export const StreakCelebration: React.FC<StreakCelebrationProps> = ({
  habitName,
  streakCount,
  isOpen,
  onDismiss,
}) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number; color: string; size: number }[]>([]);

  useEffect(() => {
    if (isOpen) {
      const colors = ["#7C9EFF", "#FF9E9E", "#6FCF97", "#C77DFF", "#F2C94C"];
      const generated = Array.from({ length: 24 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 80 + Math.random() * 150;
        const x = Math.cos(angle) * velocity;
        const y = Math.sin(angle) * velocity - 100; // slightly upwards bias
        const delay = Math.random() * 0.15;
        const size = 6 + Math.random() * 6;
        return {
          id: i,
          x,
          y,
          delay,
          color: colors[Math.floor(Math.random() * colors.length)],
          size,
        };
      });
      setParticles(generated);
    }
  }, [isOpen]);

  const getMicrocopy = (milestone: number) => {
    if (milestone <= 3) return "You're building momentum. The habit is forming. 🌱";
    if (milestone <= 7) return "One full week. That's real commitment. 💪";
    if (milestone <= 14) return "Two weeks strong. This is becoming part of you. ⚡";
    if (milestone <= 21) return "Three weeks! Science says habits form around now. 🧠";
    return "A whole month and beyond. You're unstoppable! 🚀";
  };

  const getEmoji = (milestone: number) => {
    if (milestone < 7) return "🌱";
    if (milestone < 14) return "🔥";
    if (milestone < 21) return "✨";
    if (milestone < 30) return "🚀";
    return "👑";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Style injection for CSS-only high-performance confetti */}
          <style>{`
            @keyframes confetti-fly {
              0% {
                transform: translate(0, 0) scale(1);
                opacity: 1;
              }
              100% {
                transform: translate(var(--tx), var(--ty)) scale(0.2);
                opacity: 0;
              }
            }
            .confetti-dot {
              animation: confetti-fly 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
            }
          `}</style>

          {/* Semi-transparent blur backdrop */}
          <motion.div
            id="streak-cel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            className="absolute inset-0 bg-black/40 backdrop-blur-md cursor-pointer"
          />

          {/* Centered Celebration Card */}
          <motion.div
            id="streak-cel-card"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: { type: "spring", stiffness: 350, damping: 25 }
            }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-[320px] bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center gap-4 z-10 mx-4 select-none"
          >
            {/* Confetti container (absolute in card, overflows) */}
            <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="confetti-dot absolute rounded-full"
                  style={{
                    backgroundColor: p.color,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    left: "50%",
                    top: "40%",
                    marginLeft: `-${p.size / 2}px`,
                    marginTop: `-${p.size / 2}px`,
                    animationDelay: `${p.delay}s`,
                    "--tx": `${p.x}px`,
                    "--ty": `${p.y}px`,
                  } as React.CSSProperties}
                />
              ))}
            </div>

            {/* Content layout */}
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center justify-center text-4xl shadow-sm">
              {getEmoji(streakCount)}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] tracking-widest uppercase font-bold text-amber-500 block">
                Milestone Cleared
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-neutral-50 tracking-tight leading-tight">
                {streakCount} Day Streak!
              </h3>
              <p className="text-xs font-semibold text-gray-400 dark:text-neutral-500">
                on {habitName}
              </p>
            </div>

            <p className="text-xs font-semibold text-gray-600 dark:text-neutral-300 leading-relaxed max-w-[240px]">
              {getMicrocopy(streakCount)}
            </p>

            <button
              onClick={onDismiss}
              id="celebrate-dismiss-btn"
              className="w-full py-2.5 mt-2 bg-[#7C9EFF] hover:bg-[#688CEB] active:scale-95 text-white font-bold text-xs rounded-xl tracking-wide shadow-md cursor-pointer transition-all"
            >
              Keep Going ⚡
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

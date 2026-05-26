import React from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: string; // Hex code
  height?: string; // Height class
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = "#7C9EFF",
  height = "h-2.5",
  showLabel = false,
}) => {
  const percentage = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));

  return (
    <div className="w-full">
      <style>{`
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-bg {
          animation: shimmer-sweep 0.9s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }
      `}</style>

      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 text-xs text-secondary font-bold tracking-wide uppercase select-none">
          <span>Overall Target Progress</span>
          <span className="font-extrabold text-primary font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      <div className={`w-full rounded-full bg-gray-100 dark:bg-neutral-800 ${height} overflow-hidden relative`}>
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          initial={{ width: "0%" }}
          animate={{ width: `${percentage}%` }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 20,
            mass: 1,
          }}
          style={{
            backgroundImage: `linear-gradient(90deg, ${color}aa, ${color})`,
          }}
        >
          {percentage === 100 && (
            <div className="shimmer-bg absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
          )}
        </motion.div>
      </div>
    </div>
  );
};

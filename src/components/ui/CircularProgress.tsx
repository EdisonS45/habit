import React from "react";
import { motion } from "framer-motion";

interface CircularProgressProps {
  percentage: number; // 0 to 100
  size?: number; // diameter
  strokeWidth?: number;
  color?: string;
  showText?: boolean;
  label?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 44,
  strokeWidth = 1.6, // thinner elegant ring line
  color = "#7C9EFF",
  showText = true,
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cleanPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (cleanPercentage / 100) * circumference;

  // Tiny elegant tracking typography
  const fontSize = size <= 45 ? "10px" : size <= 70 ? "11px" : "18px";
  const gradId = `progress-grad-${color.replace("#", "")}`;

  return (
    <div 
      className="relative inline-flex items-center justify-center select-none" 
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.95} />
            <stop offset="100%" stopColor={color} stopOpacity={0.7} />
          </linearGradient>
        </defs>
        {/* Track (background circle) with very low-contrast design */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-150/60 dark:text-neutral-850"
          style={{ opacity: 0.6 }}
        />
        {/* Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span
            style={{ fontSize }}
            className="font-black text-gray-800 dark:text-neutral-200 tracking-tighter"
          >
            {Math.round(cleanPercentage)}%
          </span>
          {label && size > 60 && (
            <span className="text-[8px] uppercase tracking-widest text-gray-400 dark:text-neutral-500 font-extrabold mt-1 scale-90">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

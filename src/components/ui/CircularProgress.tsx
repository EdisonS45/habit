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
  size = 120,
  strokeWidth = 3,
  color = "#7C9EFF",
  showText = true,
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cleanPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (cleanPercentage / 100) * circumference;

  // Extremely clean typographic scaling for different circle sizes
  const fontSize = size <= 45 ? "10px" : size <= 70 ? "13px" : "22px";
  const gradId = `progress-grad-${color.replace("#", "")}`;

  return (
    <div 
      className="relative inline-flex items-center justify-center select-none" 
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color === "#7C9EFF" ? "#A5BCFF" : color} />
          </linearGradient>
        </defs>
        {/* Track (background circle) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-100/70 dark:text-neutral-850"
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
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span
            style={{ fontSize, fontVariantNumeric: "tabular-nums" }}
            className="font-semibold text-gray-900 dark:text-neutral-50 tracking-tight"
          >
            {Math.round(cleanPercentage)}%
          </span>
          {label && size > 60 && (
            <span className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 font-semibold mt-1">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

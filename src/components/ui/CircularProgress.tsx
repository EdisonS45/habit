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
  strokeWidth = 8,
  color = "#7C9EFF",
  showText = true,
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cleanPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (cleanPercentage / 100) * circumference;

  return (
    <div 
      className="relative inline-flex items-center justify-center select-none" 
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Track (background circle) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-10"
        />
        {/* Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span
            style={{ fontSize: size > 40 ? "24px" : "10px", fontVariantNumeric: "tabular-nums" }}
            className="font-black text-gray-900 dark:text-neutral-50"
          >
            {Math.round(cleanPercentage)}%
          </span>
          {label && size > 60 && (
            <span className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 font-bold mt-1">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

import React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns";
import { useHabitStore } from "../../context/HabitContext";
import { Habit } from "../../types";
import { motion } from "framer-motion";

interface HeatmapCalendarProps {
  currentMonth: Date;
  filterHabitId?: string; // Optional: restrict color density calculations to this specific habit
  onSelectedDay?: (dateStr: string, completedHabits: Habit[]) => void;
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  currentMonth,
  filterHabitId,
  onSelectedDay,
}) => {
  const { habits, logs, settings } = useHabitStore();

  const startOfSelected = startOfMonth(currentMonth);
  const endOfSelected = endOfMonth(currentMonth);

  // Generate all calendar day nodes
  const daysInMonth = eachDayOfInterval({
    start: startOfSelected,
    end: endOfSelected,
  });

  const rawStartDay = getDay(startOfSelected);
  const offset = rawStartDay === 0 ? 6 : rawStartDay - 1;

  const paddingEmptyCells = Array.from({ length: offset });

  // Accent and Intensity Palette
  const accentColor = settings.accentColor || "#7C9EFF";
  const isDark = settings.theme === "dark";

  // Hex-to-RGBA Parser for fully-dynamic accent opacity scales
  const hexToRgba = (hex: string, alpha: number) => {
    let r = 124, g = 158, b = 255;
    if (hex.startsWith("#")) {
      const cleaned = hex.replace("#", "");
      if (cleaned.length === 3) {
        r = parseInt(cleaned[0] + cleaned[0], 16);
        g = parseInt(cleaned[1] + cleaned[1], 16);
        b = parseInt(cleaned[2] + cleaned[2], 16);
      } else if (cleaned.length === 6) {
        r = parseInt(cleaned.substring(0, 2), 16);
        g = parseInt(cleaned.substring(2, 4), 16);
        b = parseInt(cleaned.substring(4, 6), 16);
      }
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getDayCompletionStyle = (dayDate: Date, dateStr: string) => {
    // Check if cell is in the future
    const todayEnd = new Date().setHours(23, 59, 59, 999);
    const isFutureDay = dayDate.getTime() > todayEnd;

    if (isFutureDay) {
      return {
        backgroundColor: "transparent",
        borderStyle: "dashed" as const,
        borderWidth: "1.5px",
        borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
        opacity: 0.4,
        color: isDark ? "#4B4B4B" : "#B0B0B0",
      };
    }

    const list = logs[dateStr] || [];
    const validCompletions = list.filter((id) => habits.some((h) => h.id === id));
    const count = validCompletions.length;

    if (filterHabitId) {
      // Binary View: Single Habit
      const isDone = list.includes(filterHabitId);
      if (isDone) {
        const habit = habits.find((h) => h.id === filterHabitId);
        const col = habit?.color || accentColor;
        return {
          backgroundColor: col,
          color: "#FFFFFF",
          borderColor: "transparent",
        };
      }
      return {
        backgroundColor: isDark ? "#2A2A2A" : "#F0EEE9",
        borderColor: "transparent",
        color: isDark ? "#6B6B6B" : "#8A8A88",
      };
    } else {
      // Density View: All Habits
      if (count === 0) {
        return {
          backgroundColor: isDark ? "#2A2A2A" : "#F0EEE9",
          borderColor: "transparent",
          color: isDark ? "#6B6B6B" : "#8A8A88",
        };
      }
      
      // Compute density scale: 1-2, 3-4, 5-6, 7+
      let opacityValue = 0.25;
      if (count >= 1 && count <= 2) opacityValue = 0.25;
      else if (count >= 3 && count <= 4) opacityValue = 0.50;
      else if (count >= 5 && count <= 6) opacityValue = 0.75;
      else if (count >= 7) opacityValue = 1.0;

      return {
        backgroundColor: hexToRgba(accentColor, opacityValue),
        color: opacityValue > 0.6 ? "#FFFFFF" : isDark ? "#F5F5F5" : "#1A1A1A",
        borderColor: "transparent",
      };
    }
  };

  const handleDayClick = (dayDate: Date) => {
    const dateStr = format(dayDate, "yyyy-MM-dd");
    const list = logs[dateStr] || [];
    const completedItems = habits.filter((h) => list.includes(h.id));
    if (onSelectedDay) {
      onSelectedDay(dateStr, completedItems);
    }
  };

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Framer Motion entry stagger definitions
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.012, // 10-12ms delay per cell
      }
    }
  };

  const cellVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 22 
      } 
    }
  };

  return (
    <div className="w-full bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-4 md:p-6 shadow-xs select-none">
      <div className="text-center font-bold mb-4 text-xs text-secondary uppercase tracking-[0.12em]">
        Calendar Grid
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-2.5 text-center text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">
        {weekdays.map((wd) => (
          <div key={wd}>{wd}</div>
        ))}
      </div>

      {/* Grid of Dates with staggering entrance */}
      <motion.div 
        id="heatmap-grid" 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-7 gap-1.5 md:gap-2 overflow-visible"
      >
        {/* Padding cells */}
        {paddingEmptyCells.map((_, idx) => (
          <div
            key={`pad-${idx}`}
            className="aspect-square bg-transparent rounded-lg border border-transparent"
          />
        ))}

        {/* Calendar days */}
        {daysInMonth.map((dayDate) => {
          const dateStr = format(dayDate, "yyyy-MM-dd");
          const customStyle = getDayCompletionStyle(dayDate, dateStr);
          const isToday = isSameDay(dayDate, new Date());

          return (
            <motion.button
              key={dateStr}
              variants={cellVariants}
              whileHover={{ 
                scale: 1.15, 
                zIndex: 10,
                boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                filter: "brightness(1.05)"
              }}
              whileTap={{ 
                scale: [1, 0.9, 1.1, 1],
                zIndex: 10,
                transition: { duration: 0.16 }
              }}
              type="button"
              id={`day-cell-${dateStr}`}
              onClick={() => handleDayClick(dayDate)}
              style={customStyle}
              className={`aspect-square rounded-xl text-[11px] md:text-sm font-bold flex flex-col items-center justify-center cursor-pointer border border-transparent select-none relative ${
                isToday
                  ? "ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-neutral-900"
                  : ""
              }`}
            >
              <span>{format(dayDate, "d")}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Heatmap Legend */}
      {!filterHabitId && (
        <div className="flex justify-end items-center gap-1.5 mt-5 text-[10px] text-gray-400 dark:text-neutral-500 font-bold select-none uppercase tracking-[0.08em]">
          <span>Less</span>
          <div className="w-3 h-3 rounded-md bg-[#F0EEE9] dark:bg-[#2A2A2A]" />
          <div className="w-3 h-3 rounded-md bg-[#7C9EFF]/25" />
          <div className="w-3 h-3 rounded-md bg-[#7C9EFF]/50" />
          <div className="w-3 h-3 rounded-md bg-[#7C9EFF]/75" />
          <div className="w-3 h-3 rounded-md bg-[#7C9EFF]" />
          <span>More</span>
        </div>
      )}
    </div>
  );
};

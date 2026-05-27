import React from "react";
import { Category } from "../../types";

interface BadgeProps {
  category: Category;
}

export const CATEGORY_STYLES: Record<Category, { bg: string; text: string; label: string; dot: string }> = {
  health: {
    bg: "bg-[#FF9E9E]/15 dark:bg-[#FF9E9E]/20",
    text: "text-[#E05B5B] dark:text-[#FFA6A6]",
    label: "Health",
    dot: "bg-[#FF9E9E]",
  },
  fitness: {
    bg: "bg-[#6FCF97]/15 dark:bg-[#6FCF97]/20",
    text: "text-[#2D9F5E] dark:text-[#88E5AD]",
    label: "Fitness",
    dot: "bg-[#6FCF97]",
  },
  study: {
    bg: "bg-[#7C9EFF]/15 dark:bg-[#7C9EFF]/20",
    text: "text-[#4A72E5] dark:text-[#9FB7FF]",
    label: "Study",
    dot: "bg-[#7C9EFF]",
  },
  mindfulness: {
    bg: "bg-[#C77DFF]/15 dark:bg-[#C77DFF]/20",
    text: "text-[#9D4EDD] dark:text-[#D8BBFF]",
    label: "Mindfulness",
    dot: "bg-[#C77DFF]",
  },
  productivity: {
    bg: "bg-[#F2C94C]/15 dark:bg-[#F2C94C]/20",
    text: "text-[#B88E14] dark:text-[#FFE380]",
    label: "Productivity",
    dot: "bg-[#F2C94C]",
  },
};

export const Badge: React.FC<BadgeProps> = ({ category }) => {
  const styles = CATEGORY_STYLES[category] || CATEGORY_STYLES.productivity;

  return (
    <span
      id={`badge-${category}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles.bg} ${styles.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      {styles.label}
    </span>
  );
};

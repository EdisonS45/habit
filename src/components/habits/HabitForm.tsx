import React, { useState } from "react";
import { Habit, Category } from "../../types";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface HabitFormProps {
  initialHabit?: Habit;
  onSubmit: (habitData: {
    name: string;
    category: Category;
    color: string;
    emoji: string;
    goalDaysPerWeek: number;
  }) => void;
  onCancel?: () => void;
}

const CATEGORIES: Category[] = ["health", "fitness", "study", "mindfulness", "productivity"];

const CURATED_EMOJIS = [
  "🏃", "🚴", "🤸", "🏋️‍♀️", "🥗", "💧", "🧘", "🧠", "📊", "🐨",
  "💻", "🎨", "🎵", "🌈", "🛌", "🌱", "🎯", "☀️", "✍️", "🔋"
];

const PASTEL_SWATCHES = [
  "#FF9E9E", // Soft Coral
  "#FFB37D", // Soft Orange
  "#F2C94C", // Warm Yellow
  "#6FCF97", // Mint Green
  "#52D1DC", // Soft Teal
  "#7C9EFF", // Periwinkle Blue
  "#C77DFF", // Lavender Violet
  "#FF9ED2"  // Soft Pink
];

export const HabitForm: React.FC<HabitFormProps> = ({
  initialHabit,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(initialHabit?.name || "");
  const [category, setCategory] = useState<Category>(initialHabit?.category || "health");
  const [color, setColor] = useState(initialHabit?.color || PASTEL_SWATCHES[0]);
  const [emoji, setEmoji] = useState(initialHabit?.emoji || CURATED_EMOJIS[0]);
  const [goalDaysPerWeek, setGoalDaysPerWeek] = useState(initialHabit?.goalDaysPerWeek || 5);
  const [error, setError] = useState("");

  const handleGoalStep = (step: number) => {
    setGoalDaysPerWeek((prev) => Math.max(1, Math.min(7, prev + step)));
  };

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a habit name");
      return;
    }
    setError("");
    onSubmit({
      name: name.trim(),
      category,
      color,
      emoji,
      goalDaysPerWeek,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleFormSubmit();
    }
  };

  return (
    <form id="habit-form" onSubmit={handleFormSubmit} className="space-y-5 text-left select-none">
      {/* Habit Name */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#AAAAAA]">
          Habit Name
        </label>
        <input
          id="habit-name-input"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (e.target.value.trim()) setError("");
          }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Morning Protein Shake"
          className="w-full px-4 py-3 rounded-xl border border-gray-150 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-850 focus:bg-white dark:focus:bg-neutral-900 text-gray-900 dark:text-neutral-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C9EFF] transition-all text-xs font-bold"
          autoFocus
        />
        {error && <p className="text-red-500 text-[10px] font-bold">{error}</p>}
      </div>

      {/* Category Segmented Control */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#AAAAAA]">
          Category
        </label>
        <div id="category-segmented-control" className="grid grid-cols-5 gap-1 p-1 bg-gray-100 dark:bg-neutral-850 rounded-xl border border-gray-150 dark:border-neutral-800">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              id={`cat-btn-${cat}`}
              onClick={() => setCategory(cat)}
              className={`py-2 text-[10px] font-extrabold rounded-lg capitalize transition-all select-none ${
                category === cat
                  ? "bg-white dark:bg-neutral-800 shadow-xs text-gray-900 dark:text-neutral-50 border border-gray-200 dark:border-neutral-700"
                  : "text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Emoji Picker Grid - 4x5 structure */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#AAAAAA]">
          Icon / Emoji
        </label>
        <div id="emoji-picker-grid" className="grid grid-cols-5 gap-2 p-3 bg-gray-100 dark:bg-neutral-850 rounded-xl border border-gray-150 dark:border-neutral-800">
          {CURATED_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              id={`emoji-${em}`}
              onClick={() => setEmoji(em)}
              className={`h-10 flex items-center justify-center rounded-xl text-xl transition-all ${
                emoji === em
                  ? "bg-[#7C9EFF]/20 scale-105 border-2 border-[#7C9EFF]"
                  : "hover:bg-gray-200 dark:hover:bg-neutral-800"
              }`}
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection Palette */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#AAAAAA]">
          Visual Tag / Accent Color
        </label>
        <div id="color-picker-grid" className="flex justify-around p-3 bg-gray-100 dark:bg-neutral-850 rounded-xl border border-gray-150 dark:border-neutral-800">
          {PASTEL_SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              id={`color-${swatch}`}
              onClick={() => setColor(swatch)}
              className="w-7 h-7 rounded-full transition-all relative flex items-center justify-center hover:scale-110 shadow-xs cursor-pointer"
              style={{ backgroundColor: swatch }}
            >
              {color === swatch && (
                <Check size={14} className="text-white drop-shadow-md font-bold" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Goal Days Stepper */}
      <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-neutral-850 rounded-xl border border-gray-150 dark:border-neutral-800">
        <div className="space-y-0.5">
          <span className="block text-xs font-extrabold text-gray-800 dark:text-neutral-100">
            Goal Consistency
          </span>
          <span className="text-[10px] text-secondary font-semibold">
            How many days per week?
          </span>
        </div>
        <div id="goal-days-stepper" className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleGoalStep(-1)}
            disabled={goalDaysPerWeek <= 1}
            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-neutral-700 flex items-center justify-center bg-white dark:bg-neutral-800 disabled:opacity-40 transition-colors hover:bg-gray-50 active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="w-6 text-center text-xs font-extrabold text-gray-900 dark:text-neutral-100 font-mono">
            {goalDaysPerWeek}
          </span>
          <button
            type="button"
            onClick={() => handleGoalStep(1)}
            disabled={goalDaysPerWeek >= 7}
            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-neutral-700 flex items-center justify-center bg-white dark:bg-neutral-800 disabled:opacity-40 transition-colors hover:bg-gray-50 active:scale-95 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 text-xs uppercase tracking-wider font-extrabold rounded-xl bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-300 dark:hover:bg-neutral-700 active:scale-98 transition-all cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          id="submit-habit-btn"
          disabled={!name.trim()}
          className={`flex-1 py-3 text-xs uppercase tracking-wider font-extrabold rounded-xl text-white shadow-md transition-all cursor-pointer ${
            name.trim() ? "hover:brightness-105 active:scale-98" : "bg-gray-300 dark:bg-neutral-700 text-gray-400 cursor-not-allowed shadow-none"
          }`}
          style={name.trim() ? { backgroundColor: color } : undefined}
        >
          {initialHabit ? "Save Changes" : "Create Habit"}
        </button>
      </div>
    </form>
  );
};

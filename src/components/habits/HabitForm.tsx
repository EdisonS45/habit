import React, { useState } from "react";
import { Habit, Category } from "../../types";
import { ChevronLeft, ChevronRight, Check, Plus } from "lucide-react";
import { useHabitStore } from "../../context/HabitContext";
import { Tooltip } from "../ui/Tooltip";

interface HabitFormProps {
  initialHabit?: Habit;
  onSubmit: (habitData: {
    name: string;
    category: Category;
    color: string;
    emoji: string;
    goalDaysPerWeek: number;
    reason?: string;
    bestTime?: "morning" | "afternoon" | "evening" | "anytime";
  }) => void;
  onCancel?: () => void;
}

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

const HABIT_NAME_SUGGESTIONS: Record<string, string[]> = {
  health: ["Drink 2L Water", "Take Daily Vitamins", "8-Hour Sleep", "Brush & Floss Teeth", "Eat Fruit Daily"],
  fitness: ["10-Min Full Body Stretch", "30-Min Cardio Walk", "Morning Yoga Flow", "20 Push-Ups", "Gym Strength Training"],
  study: ["Read 10 Pages", "Practice Coding", "DuoLingo Lesson", "Learn 5 New Words", "Study 25 Mins (Pomodoro)"],
  mindfulness: ["5-Min Silent Meditation", "3 Deep Breaths Prompt", "Write 3 Gratitudes", "Journal Active Thoughts", "Evening Wind-Down Calm"],
  productivity: ["Plan Next Day's Actions", "Deep Work (No Alerts)", "Clean Workspace", "1-Hour Focus Block", "Clear Inbox Tasks"]
};

export const HabitForm: React.FC<HabitFormProps> = ({
  initialHabit,
  onSubmit,
  onCancel,
}) => {
  const { habits } = useHabitStore();
  const [name, setName] = useState(initialHabit?.name || "");
  const [category, setCategory] = useState<Category>(initialHabit?.category || "health");
  const [color, setColor] = useState(initialHabit?.color || PASTEL_SWATCHES[0]);
  const [emoji, setEmoji] = useState(initialHabit?.emoji || CURATED_EMOJIS[0]);
  const [goalDaysPerWeek, setGoalDaysPerWeek] = useState(initialHabit?.goalDaysPerWeek || 5);
  const [reason, setReason] = useState(initialHabit?.reason || "");
  const [bestTime, setBestTime] = useState<"morning" | "afternoon" | "evening" | "anytime">(initialHabit?.bestTime || "anytime");
  const [error, setError] = useState("");
  const [isNameFocused, setIsNameFocused] = useState(false);

  const [customInput, setCustomInput] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Initialize custom categories from existing trackings in user data
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const defaultCategories = ["health", "fitness", "study", "mindfulness", "productivity"];
    const activeCustom = habits
      .map((h) => h.category.toLowerCase().trim())
      .filter((cat) => cat && !defaultCategories.includes(cat));
    return Array.from(new Set(activeCustom));
  });

  const defaultCategories = ["health", "fitness", "study", "mindfulness", "productivity"];
  const allCategories = Array.from(new Set([...defaultCategories, ...customCategories]));

  // Auto-suggestion matching strategy for intuitive category routing
  const getSubtleSuggestion = (): string | null => {
    const val = name.toLowerCase().trim();
    if (!val) return null;
    
    const rules: Record<string, string[]> = {
      health: ["water", "drink", "sleep", "eat", "teeth", "brush", "fruit", "vitamin", "bed", "nutrition", "diet", "pill", "meds", "medicine", "hydration", "teeth"],
      fitness: ["run", "gym", "lift", "workout", "cardio", "stretch", "walk", "bike", "cycle", "swim", "fitness", "exercise", "pushup", "yoga", "squat", "training"],
      study: ["read", "study", "book", "learn", "course", "code", "write", "practice", "class", "skills", "language", "vocab", "duolingo", "homework"],
      mindfulness: ["meditat", "breathe", "breath", "journal", "relax", "reflect", "calm", "yoga", "mindful", "pray", "gratitude", "reflect", "silence"],
      productivity: ["work", "focus", "todo", "task", "plan", "clean", "organize", "priority", "email", "clutter", "meeting", "code", "dev"],
      finance: ["money", "save", "spend", "budget", "finance", "expense", "invest", "bill"],
      relationships: ["friend", "family", "date", "talk", "social", "text", "call", "meetup", "connect", "spouse", "partner"]
    };

    for (const [catName, keywords] of Object.entries(rules)) {
      if (keywords.some((k) => val.includes(k))) return catName;
    }
    return null;
  };

  const suggestion = getSubtleSuggestion();

  const getTaglineSuggestionsOfCategory = (cat: string): string[] => {
    switch (cat.toLowerCase().trim()) {
      case "health":
        return ["Small steps, big change", "Your body will thank you", "Build the foundation"];
      case "mindfulness":
        return ["Pause and breathe", "Find your stillness", "One moment at a time"];
      case "study":
        return ["Feed your mind", "Grow a little every day", "Knowledge compounds"];
      case "fitness":
        return ["Show up, that's enough", "Earn your energy", "Strong is built slowly"];
      case "productivity":
        return ["Fewer things, better focus", "Action expands energy", "One step at a time"];
      default:
        return ["Keep it simple", "Show up for yourself", "Tiny actions compound"];
    }
  };

  const categorySuggestions = getTaglineSuggestionsOfCategory(category);
  const showTaglineSuggestions = name.trim().length > 0 && (reason === "" || categorySuggestions.includes(reason));

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
      reason: reason.trim() || undefined,
      bestTime,
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
      {/* Habit Name and suggestion badge */}
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
          onFocus={() => setIsNameFocused(true)}
          onBlur={() => setTimeout(() => setIsNameFocused(false), 200)}
          placeholder="e.g. Morning Protein Shake"
          className="w-full px-4 py-3 rounded-xl border border-gray-150 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-850 focus:bg-white dark:focus:bg-neutral-900 text-gray-900 dark:text-neutral-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C9EFF] transition-all text-xs font-bold"
          autoFocus
        />
        {error && <p className="text-red-500 text-[10px] font-bold">{error}</p>}

        {/* Dynamic Habit Name Suggestions based on category tag */}
        {isNameFocused && !name.trim() && (
          <div className="pt-1.5 animate-scale-up space-y-1 select-none">
            <span className="block text-[9px] font-extrabold uppercase tracking-widest text-[#7C9EFF] dark:text-[#9FB7FF]">
              Inspiring {category} habits
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {(HABIT_NAME_SUGGESTIONS[category.toLowerCase()] || ["Drink Water", "Simple Meditation", "Stretch Walk"]).map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onMouseDown={() => {
                    setName(sug);
                    setError("");
                  }}
                  className="px-2.5 py-1.5 text-[10px] font-extrabold text-gray-600 dark:text-neutral-300 hover:text-[#7C9EFF] bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 hover:border-[#7C9EFF]/40 hover:bg-[#7C9EFF]/5 dark:hover:bg-[#7C9EFF]/10 rounded-xl transition-all cursor-pointer select-none"
                >
                  🌱 {sug}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Render Suggestion as lightweight badge */}
        {suggestion && category !== suggestion && (
          <div className="pt-1.5 animate-scale-up">
            <button
              type="button"
              onClick={() => {
                if (!allCategories.includes(suggestion)) {
                  setCustomCategories((prev) => [...prev, suggestion]);
                }
                setCategory(suggestion);
              }}
              className="text-[9px] font-extrabold text-[#7C9EFF] hover:text-[#5E83FA] flex items-center justify-between gap-2.5 bg-[#7C9EFF]/5 dark:bg-[#7C9EFF]/10 px-3 py-1.5 rounded-xl border border-[#7C9EFF]/15 hover:border-[#7C9EFF]/40 transition-all select-none cursor-pointer"
            >
              <span>💡 Categorize under <span className="capitalize text-gray-800 dark:text-neutral-200 font-extrabold">{suggestion}</span> based on title?</span>
              <span className="font-extrabold text-[8px] px-1.5 py-0.5 rounded-md bg-[#7C9EFF] text-white uppercase tracking-wider">Apply Match</span>
            </button>
          </div>
        )}

        {/* Dynamic Tagline Suggestions Pills */}
        {showTaglineSuggestions && (
          <div className="pt-2.5 space-y-1 select-none">
            <span className="block text-[9px] font-extrabold uppercase tracking-widest text-[#AAAAAA]">
              Suggested Taglines for {category}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {categorySuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setReason(tag)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-full border transition-all cursor-pointer ${
                    reason === tag
                      ? "bg-amber-100/60 border-amber-300 text-amber-700"
                      : "bg-white hover:bg-gray-50 border-gray-150 text-gray-600"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modern, scaleable expandable dynamic category picker with custom addition support */}
      <div className="space-y-2">
        <div className="flex items-center justify-between select-none">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#AAAAAA]">
            Category Tag
          </label>
          
          {isAddingCustom ? (
            <div className="flex items-center gap-1.5 animate-scale-up">
              <input
                type="text"
                placeholder="e.g. Creativity"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                maxLength={20}
                className="px-2 py-1 text-[10px] font-bold rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-800 dark:text-neutral-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const cleaned = customInput.trim().toLowerCase();
                  if (cleaned) {
                    if (!allCategories.includes(cleaned)) {
                      setCustomCategories((prev) => [...prev, cleaned]);
                    }
                    setCategory(cleaned);
                  }
                  setIsAddingCustom(false);
                  setCustomInput("");
                }}
                className="px-2 py-1 bg-[#7C9EFF] text-white text-[9px] font-extrabold rounded-lg uppercase cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCustom(false);
                  setCustomInput("");
                }}
                className="text-[10px] font-black text-gray-400 hover:text-gray-600 px-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingCustom(true)}
              className="text-[9px] font-black uppercase tracking-widest text-[#7C9EFF] hover:text-[#5E83FA] flex items-center gap-1 cursor-pointer"
            >
              <Plus size={10} strokeWidth={3} />
              <span>New Category</span>
            </button>
          )}
        </div>

        {/* Categories wrap chip elements */}
        <div id="category-chips-picker" className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pt-0.5 pr-1 select-none">
          {allCategories.map((cat) => {
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                type="button"
                id={`cat-chip-${cat}`}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#7C9EFF] text-white shadow-3xs border border-[#7C9EFF]"
                    : "bg-gray-150/45 dark:bg-neutral-850 text-gray-500 dark:text-neutral-400 border border-gray-150 dark:border-neutral-800/60 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Habit Reason / Intent */}
      <div className="space-y-1.5 animate-scale-up">
        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#AAAAAA]">
          My ADHD Motivation / Why this matters
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={100}
          placeholder="e.g. Helps me wind down at night"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-150 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-850 focus:bg-white dark:focus:bg-neutral-900 text-gray-900 dark:text-neutral-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C9EFF] transition-all text-xs font-bold"
        />
        <span className="block text-[9px] text-[#A0A0A0] dark:text-neutral-500 font-medium pl-1 leading-normal">
          Keep it short and tactile. Reminds your future brain why this routine is worth the start.
        </span>
      </div>

      {/* Recommended Best Time of Day Badge Selection */}
      <div className="space-y-2">
        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#AAAAAA]">
          Implementation Cue / Best Time of Day
        </label>
        <div className="grid grid-cols-4 gap-2 bg-gray-50 dark:bg-neutral-850 p-1.5 rounded-2xl border border-gray-150/60 dark:border-neutral-800/80">
          {(["anytime", "morning", "afternoon", "evening"] as const).map((t) => {
            const isSelected = bestTime === t;
            let icon = "⚡";
            if (t === "morning") icon = "🌅";
            if (t === "afternoon") icon = "☀️";
            if (t === "evening") icon = "🌙";
            if (t === "anytime") icon = "🔋";

            return (
              <button
                key={t}
                type="button"
                onClick={() => setBestTime(t)}
                className={`py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#7C9EFF] text-white shadow-3xs border border-[#7C9EFF]"
                    : "bg-transparent text-[#7F7F7F] hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                <span className="text-sm">{icon}</span>
                <span className="text-[8px] tracking-widest">{t}</span>
              </button>
            );
          })}
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
          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-gray-800 dark:text-neutral-100">
            Goal Consistency
            <Tooltip content="Choose your ideal weekly milestone. It is a guide, not a strict limit. Adjust dynamically as your week ebbs and flows!" />
          </span>
          <span className="text-[10px] text-secondary font-semibold block">
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

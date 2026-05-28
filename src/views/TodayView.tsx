import React, { useState, useEffect } from "react";
import { useHabitStore } from "../context/HabitContext";
import { format, addDays, startOfWeek } from "date-fns";
import { HabitCard } from "../components/habits/HabitCard";
import { Flame, Sparkles, ChevronRight, RotateCcw, AlertCircle, Plus } from "lucide-react";
import { Category, Habit } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { StreakCelebration } from "../components/ui/StreakCelebration";
import { CircularProgress } from "../components/ui/CircularProgress";
import { BottomSheet } from "../components/ui/BottomSheet";
import { HabitForm } from "../components/habits/HabitForm";
import { Tooltip } from "../components/ui/Tooltip";

const INTENTION_PLACEHOLDERS = [
  "...what matters most right now?",
  "...the version of you who shows up anyway.",
  "...one thing worth doing, even imperfectly.",
  "...something small that moves you forward."
];

const INTENTION_SUGGESTIONS = [
  "Peace of mind",
  "Starting small",
  "My physical health",
  "Learning & growth",
  "Focus & clarity",
  "Self-compassion"
];

const getDailyPlaceholder = (dateStr: string): string => {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash += dateStr.charCodeAt(i);
  }
  return INTENTION_PLACEHOLDERS[hash % INTENTION_PLACEHOLDERS.length];
};

export const TodayView: React.FC = () => {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const {
    habits,
    logs,
    skips,
    settings,
    celebrated,
    toggleLog,
    toggleSkip,
    isSkipped,
    lastDeleted,
    restoreLastDeleted,
    clearLastDeleted,
    celebrateMilestone,
    addHabit,
  } = useHabitStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("flat");

  // Intention Line state (persisted per day)
  const [intention, setIntention] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("cby_intention_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.date === todayStr) {
          return parsed.text;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return "";
  });

  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [tempIntention, setTempIntention] = useState("");

  useEffect(() => {
    setTempIntention(intention);
  }, [intention]);

  const saveIntention = (textVal: string) => {
    const trimmed = textVal.trim();
    setIntention(trimmed);
    localStorage.setItem("cby_intention_data", JSON.stringify({ date: todayStr, text: trimmed }));
    setIsEditingIntention(false);
  };

  // Sunday evening reflection state
  const weekStartKey = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const [reflections, setReflections] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("cby_reflections");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const currentReflection = reflections[weekStartKey] || "";
  const [tempReflection, setTempReflection] = useState(currentReflection);
  const [isReflectionSaved, setIsReflectionSaved] = useState(!!currentReflection);

  const saveReflection = () => {
    const updated = { ...reflections, [weekStartKey]: tempReflection.trim() };
    setReflections(updated);
    localStorage.setItem("cby_reflections", JSON.stringify(updated));
    setIsReflectionSaved(true);
  };

  const isSundayAfter5PM = () => {
    const now = new Date();
    const isSunday = now.getDay() === 0;
    const isAfter5 = now.getHours() >= 17;
    return isSunday && isAfter5;
  };

  const getThisWeeksCompletedCount = () => {
    const mon = startOfWeek(new Date(), { weekStartsOn: 1 });
    let count = 0;
    const activeIds = activeHabits.map(h => h.id);
    for (let i = 0; i < 7; i++) {
      const checkDateStr = format(addDays(mon, i), "yyyy-MM-dd");
      const dayLogs = logs[checkDateStr] || [];
      const daySkips = skips[checkDateStr] || [];
      count += dayLogs.filter((id) => activeIds.includes(id)).length;
      count += daySkips.filter((id) => activeIds.includes(id)).length;
    }
    return count;
  };

  const getCategoryColor = (cat: Category) => {
    switch (cat.toLowerCase().trim()) {
      case "health": return "#10B981"; // emerald
      case "fitness": return "#EF4444"; // red
      case "study": return "#3B82F6"; // blue
      case "mindfulness": return "#8B5CF6"; // violet
      case "productivity": return "#F59E0B"; // amber
      default: return "#9CA3AF";
    }
  };

  // Active milestone celebration trigger state
  const [activeCel, setActiveCel] = useState<{ habitName: string; streakCount: number } | null>(null);

  const uppercaseFormattedToday = format(new Date(), "EEEE, MMMM d").toUpperCase();

  // Get active habits
  const activeHabits = habits.filter((h) => h.isActive);
  const totalCount = activeHabits.length;

  const todayLogs = logs[todayStr] || [];
  const todaySkips = skips[todayStr] || [];
  const completedCount = activeHabits.filter((h) => todayLogs.includes(h.id) || todaySkips.includes(h.id)).length;
  const actualPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Clean, fast, incredibly calm greeting text
  const getGreetingText = () => {
    if (actualPercent === 100 && totalCount > 0) {
      const name = settings.userName?.trim() || "Friend";
      return `You did it today, ${name}! 🎉`;
    }
    const hours = new Date().getHours();
    const name = settings.userName?.trim() || "Friend";
    if (hours >= 5 && hours < 12) return `Good morning, ${name}`;
    if (hours >= 12 && hours < 17) return `Ready for today, ${name}?`;
    if (hours >= 17 && hours < 21) return `Good evening, ${name}`;
    return `Let’s begin, ${name}`;
  };

  // Find next up incomplete habit (not completed and not skipped)
  const nextUpHabit = activeHabits.find((h) => !todayLogs.includes(h.id) && !todaySkips.includes(h.id));

  // Determine maximum active habit streak
  const getMaximumActiveStreak = (): number => {
    let max = 0;
    activeHabits.forEach((h) => {
      let count = 0;
      let checkDate = new Date();
      const todayKey = format(checkDate, "yyyy-MM-dd");
      if (!logs[todayKey]?.includes(h.id) && !skips[todayKey]?.includes(h.id)) {
        checkDate = addDays(checkDate, -1);
      }
      while (true) {
        const key = format(checkDate, "yyyy-MM-dd");
        if (logs[key]?.includes(h.id) || skips[key]?.includes(h.id)) {
          count++;
          checkDate = addDays(checkDate, -1);
        } else {
          break;
        }
      }
      if (count > max) max = count;
    });
    return max;
  };

  const activeMaxStreak = getMaximumActiveStreak();

  // Get dynamic focus status pace
  const getPaceText = () => {
    if (totalCount === 0) return "No habits";
    if (actualPercent === 100) return "Done for today!";
    if (actualPercent >= 66) return "Fluid pace";
    if (actualPercent >= 33) return "Balanced pace";
    return "Calm pace";
  };
  const paceText = getPaceText();

  // 1. Monitor deletions and trigger 5-second fading Undo Toast
  useEffect(() => {
    if (lastDeleted) {
      setShowUndoToast(true);
      const timer = setTimeout(() => {
        setShowUndoToast(false);
        clearLastDeleted();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastDeleted]);

  // 2. Scan for uncelebrated milestones (3, 7, 14, 21, 30 day streaks) to open modal
  useEffect(() => {
    const milestones = [3, 7, 14, 21, 30];
    for (const h of activeHabits) {
      let streakCount = 0;
      let checkDate = new Date();
      const todayKey = format(checkDate, "yyyy-MM-dd");
      if (!logs[todayKey]?.includes(h.id) && !skips[todayKey]?.includes(h.id)) {
        checkDate = addDays(checkDate, -1);
      }
      while (true) {
        const key = format(checkDate, "yyyy-MM-dd");
        if (logs[key]?.includes(h.id) || skips[key]?.includes(h.id)) {
          streakCount++;
          checkDate = addDays(checkDate, -1);
        } else {
          break;
        }
      }

      if (milestones.includes(streakCount)) {
        const key = `${h.id}-${streakCount}`;
        if (!celebrated[key]) {
          setActiveCel({ habitName: h.name, streakCount });
          celebrateMilestone(h.id, streakCount);
          break; // trigger one at a time
        }
      }
    }
  }, [logs, skips, habits, celebrated]);

  const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
  };

  // Order habits list: unchecked on top, checked/skipped at the bottom; sorted by bestTime sequence
  const orderHabits = (list: Habit[]) => {
    const getTimeWeight = (bestTime?: string) => {
      if (bestTime === "morning") return 0;
      if (bestTime === "afternoon") return 1;
      if (bestTime === "evening") return 2;
      return 3; // anytime or undefined
    };

    const sortByTime = (a: Habit, b: Habit) => getTimeWeight(a.bestTime) - getTimeWeight(b.bestTime);

    const unchecked = list.filter((h) => !todayLogs.includes(h.id) && !todaySkips.includes(h.id)).sort(sortByTime);
    const checked = list.filter((h) => todayLogs.includes(h.id) || todaySkips.includes(h.id)).sort(sortByTime);
    return [...unchecked, ...checked];
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 select-none relative pb-10"
    >
      {/* Premium Minimal Header with Overall Completion */}
      <div id="today-view-header" className="flex items-center justify-between pt-1 select-none">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-neutral-55 leading-none">
            {getGreetingText()}
          </h2>
          <p className="text-xs font-bold text-gray-400 dark:text-neutral-500 tracking-wide mt-1.5 uppercase">
            {uppercaseFormattedToday}
          </p>
        </div>
        
        {totalCount > 0 && (
          <div className="shrink-0 pr-1 select-none">
            <CircularProgress 
              percentage={actualPercent} 
              size={44} 
              strokeWidth={2.5} 
              showText={true} 
            />
          </div>
        )}
      </div>

      {/* Mobile-only Ultra-sleek, clean row of stats */}
      {totalCount > 0 && (
        <div className="flex md:hidden items-center justify-between px-3.5 py-2.5 text-[11px] select-none bg-gray-50/50 border border-gray-150/50 rounded-2xl">
          <div className="flex items-center gap-1 font-extrabold text-gray-600">
            <Flame size={12} className="text-amber-500 fill-amber-500 shrink-0" />
            <span>{activeMaxStreak}d streak</span>
          </div>
          <div className="h-3.5 w-[1px] bg-gray-200" />
          <div className="flex items-center gap-1 font-extrabold text-gray-600">
            <span>⚡</span>
            <span>{totalCount - completedCount} left</span>
          </div>
          <div className="h-3.5 w-[1px] bg-gray-200" />
          <div className="flex items-center gap-1 font-extrabold text-gray-600">
            <span>🌱</span>
            <span>{paceText}</span>
          </div>
        </div>
      )}

      {/* Redesigned Ambient Stats Pill Strip (Desktop only) */}
      <div className="hidden md:grid grid-cols-3 divide-x divide-gray-100 bg-white border border-gray-100 p-3.5 rounded-[24px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.015)] text-center select-none">
        <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-gray-700">
          <Flame size={13} className="text-amber-500 fill-amber-500" />
          <span>{activeMaxStreak} day streak</span>
          <Tooltip content="Your longest consecutive active run across your checklist habits. Keep showing up!" />
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-gray-700">
          <span className="text-xs">⚡</span>
          <span>{totalCount - completedCount} habits left</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-gray-700">
          <span className="text-xs">🌱</span>
          <span>{paceText}</span>
          <Tooltip content="Pace indicates how smoothly you are easing into your checklist. Perfect for a steady ADHD layout." />
        </div>
      </div>

      {/* "Today I'm showing up for ___" Journal prompt */}
      <div className="pt-1.5 pb-0.5 text-center select-none space-y-2">
        <div className="inline-flex flex-wrap items-center justify-center gap-1 text-xs text-gray-500 font-semibold tracking-wide">
          <span>Today I'm showing up for</span>
          {isEditingIntention ? (
            <input
              type="text"
              value={tempIntention}
              placeholder={getDailyPlaceholder(todayStr)}
              onChange={(e) => setTempIntention(e.target.value)}
              onBlur={() => saveIntention(tempIntention)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveIntention(tempIntention);
                if (e.key === "Escape") setIsEditingIntention(false);
              }}
              maxLength={40}
              className="px-2 py-0.5 text-xs font-black text-amber-600 border-b border-dashed border-amber-400 bg-transparent focus:outline-none w-56 text-center placeholder:text-amber-600/40 placeholder:italic"
              autoFocus
            />
          ) : (
            <span 
              onClick={() => setIsEditingIntention(true)}
              className="font-black text-amber-600 border-b border-dashed border-amber-300/60 hover:border-amber-500 cursor-pointer transition-colors px-1 py-0.5 rounded-sm hover:bg-amber-50/50"
              title="Tap to change intention"
            >
              {intention || getDailyPlaceholder(todayStr)} ✨
            </span>
          )}
        </div>

        {isEditingIntention && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 max-w-sm mx-auto px-4 select-none animate-scale-up">
            {INTENTION_SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onMouseDown={() => {
                  setTempIntention(sug);
                  saveIntention(sug);
                }}
                className="px-2.5 py-1 text-[10px] font-black text-amber-800/80 hover:text-amber-900 bg-[#FCFAF4] hover:bg-amber-100/50 border border-[#F2EFE6] hover:border-amber-300 rounded-full transition-all cursor-pointer select-none"
              >
                + {sug}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reduced-choice ADHD "Next Best Action" Slim nudge just below stats/greeting - Desktop only */}
      {nextUpHabit && (
        <motion.div 
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          id="next-action-strip" 
          onClick={() => toggleLog(nextUpHabit.id, todayStr)}
          className="hidden md:flex bg-amber-50/60 hover:bg-amber-100/50 border border-amber-200/45 px-4 py-1.5 rounded-full items-center justify-between gap-2 text-xs select-none shadow-3xs cursor-pointer transition-all hover:scale-[1.005] active:scale-[0.995]"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles size={11} className="text-amber-500 shrink-0 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 shrink-0">NEXT:</span>
            <span className="font-extrabold text-gray-800 truncate text-[11px]">
              Complete {nextUpHabit.name}
            </span>
          </div>
          <button
            type="button"
            className="text-[10px] font-black uppercase tracking-wider text-amber-600 font-sans cursor-pointer hover:underline flex items-center shrink-0"
          >
            <span>TAP TO LOG</span>
            <ChevronRight size={10} strokeWidth={3.5} />
          </button>
        </motion.div>
      )}

      {/* Sunday Evening Weekly Reflection Card */}
      {isSundayAfter5PM() && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#FCFAF4] border border-[#F2EFE6] p-4 md:p-5 rounded-[20px] md:rounded-[24px] space-y-2 md:space-y-3 shadow-xs text-left"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm select-none">🌅</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
              Sunday Evening Reflection
            </span>
          </div>
          
          {!isReflectionSaved ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-850 leading-snug">
                This week you completed {getThisWeeksCompletedCount()} habits. What made it easier?
              </p>
              <textarea
                value={tempReflection}
                onChange={(e) => setTempReflection(e.target.value)}
                placeholder="e.g. Keeping triggers visible, starting small, giving myself grace..."
                rows={2}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={saveReflection}
                  disabled={!tempReflection.trim()}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Save reflection
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 py-1">
              <p className="text-xs font-bold text-[#725206]">
                ✨ Reflection saved. See you next week.
              </p>
              <p className="text-[10px] font-semibold italic text-gray-500">
                "{currentReflection || tempReflection}"
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ADHD support companion guidelines & notifications and Streak Freeze banners */}
      {settings.streakFreezeActive && (
        <div className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-sky-50 border border-sky-150/40 text-sky-700 text-[10px] font-black uppercase tracking-wider select-none w-fit">
          <span>❄️ Streak Protected Today</span>
        </div>
      )}

      {settings.streakFreezeActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 3 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="hidden md:flex p-4 rounded-3xl bg-sky-500/[0.04] border border-sky-450/20 text-sky-850 dark:text-sky-450 text-xs items-start gap-3 select-none"
        >
          <span className="text-base select-none shrink-0">❄️</span>
          <div className="space-y-1 text-left">
            <h5 className="font-extrabold text-[10px] uppercase tracking-wider text-sky-900 dark:text-sky-300 leading-none">
              STREAK FREEZE ACTIVE TODAY
            </h5>
            <p className="font-semibold text-[10px] leading-relaxed text-sky-700/90 dark:text-sky-400">
              Your streaks are frozen and completely protected. Self-care is discipline. Give yourself permission to disconnect and recover without any penalty.
            </p>
          </div>
        </motion.div>
      )}

      {settings.adhdCompanionEnabled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 3 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="hidden md:flex p-4 rounded-[24px] bg-slate-50/80 dark:bg-neutral-900/40 border border-[#7C9EFF]/15 text-[#7C9EFF] text-xs items-start gap-3 select-none"
        >
          <span className="text-base select-none shrink-0">🧠</span>
          <div className="space-y-1 text-left">
            <h5 className="font-extrabold text-[9px] uppercase tracking-widest text-[#5E83FA] dark:text-[#9FB7FF] leading-none">
              MIND SUPPORT COMPANION
            </h5>
            <p className="font-semibold text-[10px] leading-relaxed text-gray-500 dark:text-neutral-400">
              “{["Starting is the hardest part. Just check off one tiny 1-minute step of a habit to start today's momentum. No pressure!", 
                 "Stuck on a hill? Pick the easiest habit first. Small actions dissolve procrastination patterns.", 
                 "Your value is not defined by task checkboxes. If you only manage a fraction of a habit, that's still progress.", 
                 "Energy follows action. Or sometimes, energy needs rest. Choose self-care when you need to recharge."][new Date().getDate() % 4]}”
            </p>
          </div>
        </motion.div>
      )}



      {/* TODAY Title Row, Filter View, & Add Habit Button */}
      <div className="flex items-center justify-between pt-2 select-none">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black tracking-widest text-[#888888] uppercase select-none">TODAY</span>
          
          {totalCount > 0 && (
            <div className="flex items-center bg-gray-50 dark:bg-neutral-900 border border-gray-150/40 dark:border-neutral-850/80 p-0.5 rounded-full text-[10px] font-bold select-none shadow-3xs">
              <button
                type="button"
                onClick={() => setViewMode("flat")}
                className={`px-2.5 py-0.5 rounded-full transition-all duration-150 cursor-pointer text-[9px] font-extrabold uppercase ${
                  viewMode === "flat"
                    ? "bg-white dark:bg-neutral-800 text-[#7C9EFF] dark:text-white shadow-3xs border border-gray-100 dark:border-neutral-750"
                    : "text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 border border-transparent"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grouped")}
                className={`px-2.5 py-0.5 rounded-full transition-all duration-150 cursor-pointer text-[9px] font-extrabold uppercase ${
                  viewMode === "grouped"
                    ? "bg-white dark:bg-neutral-800 text-[#7C9EFF] dark:text-white shadow-3xs border border-gray-100 dark:border-neutral-750"
                    : "text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 border border-transparent"
                }`}
              >
                Categories
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          id="today-add-habit-btn"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4.5 py-1.5 rounded-full border border-gray-150 dark:border-neutral-800 bg-white dark:bg-[#161616] text-[11px] font-extrabold text-gray-700 dark:text-neutral-300 hover:bg-gray-50/50 dark:hover:bg-neutral-850 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <Plus size={11} strokeWidth={3} />
          <span>Add Habit</span>
        </button>
      </div>



      {/* Main Directory List container */}
      {totalCount === 0 ? (
        <div 
          id="today-empty-state" 
          className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-850 rounded-[28px] min-h-[300px] shadow-sm select-none"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-24 h-24 flex items-center justify-center text-[#7C9EFF]/20 mb-2"
          >
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" fill="currentColor" fillOpacity="0.08" />
              <path d="M5 6h2M5 11h2M5 16h2" strokeWidth="2" stroke="#9CA3AF" />
              <path d="M10 7h6M10 11h6" stroke="#9CA3AF" strokeOpacity="0.5" />
            </svg>
          </motion.div>
          
          <h3 className="text-sm font-black text-gray-900 dark:text-neutral-100 tracking-tight mb-1">
            Rebuild your schedule
          </h3>
          <p className="text-xs font-semibold text-secondary max-w-[260px] mb-6 leading-normal">
            Add a habit to focus on today. Keep it simple and stress-free.
          </p>
        </div>
      ) : viewMode === "flat" ? (
        <div id="single-flat-list-container" className="space-y-4">
          {orderHabits(activeHabits).map((habit) => (
            <HabitCard key={habit.id} habit={habit} dateStr={todayStr} />
          ))}
        </div>
      ) : (
        <div id="grouped-by-category-container" className="space-y-6">
          {(["health", "fitness", "productivity", "mindfulness", "study"] as Category[]).map((cat) => {
            const catHabits = orderHabits(activeHabits.filter((h) => h.category === cat));
            if (catHabits.length === 0) return null;

            return (
              <div key={cat} className="space-y-3 pt-1">
                {/* Minimal premium category subtitle header */}
                <div className="flex items-center gap-2 pl-1 select-none animate-fade-in">
                  <span 
                    className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" 
                    style={{ backgroundColor: getCategoryColor(cat) }} 
                  />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500">
                    {cat}
                  </h4>
                  <div className="h-[1px] bg-gray-150/40 dark:bg-neutral-850/60 flex-1 ml-2 opacity-30" />
                </div>
                
                {/* Category Habit Cards list */}
                <div className="space-y-4">
                  {catHabits.map((habit) => (
                    <HabitCard key={habit.id} habit={habit} dateStr={todayStr} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Habit BottomSheet overlay */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create a Habit"
      >
        <HabitForm
          onSubmit={(habitData) => {
            addHabit(habitData);
            setIsAddOpen(false);
          }}
          onCancel={() => setIsAddOpen(false)}
        />
      </BottomSheet>

      {/* Floating Streak celebration popover overlay modals */}
      {activeCel && (
        <StreakCelebration
          isOpen={true}
          habitName={activeCel.habitName}
          streakCount={activeCel.streakCount}
          onDismiss={() => setActiveCel(null)}
        />
      )}

      {/* 5-second slide-up Undo Toast */}
      <AnimatePresence>
        {showUndoToast && lastDeleted && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-4 left-4 right-4 md:left-[270px] md:right-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between text-white z-[60] shadow-2xl selection:bg-purple-500"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-[#7C9EFF]" />
              <span className="text-xs font-bold leading-none">
                Deleted habit "{lastDeleted.habit.name}"
              </span>
            </div>
            <button
              onClick={() => {
                restoreLastDeleted();
                setShowUndoToast(false);
              }}
              className="flex items-center gap-1.5 bg-[#7C9EFF]/20 hover:bg-[#7C9EFF]/35 border border-[#7C9EFF]/30 text-[#7C9EFF] px-3.5 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-extrabold cursor-pointer transition-colors"
            >
              <RotateCcw size={12} />
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


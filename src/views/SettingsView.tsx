import React, { useState, useRef } from "react";
import { useHabitStore } from "../context/HabitContext";
import { Habit, Category } from "../types";
import { BottomSheet } from "../components/ui/BottomSheet";
import { HabitForm } from "../components/habits/HabitForm";
import { format } from "date-fns";
import { Trash2, Edit2, Upload, Download, RotateCcw, Check, Sparkles, User, Palette, FolderGit2, Heart, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "../components/ui/Tooltip";

const ACCENT_OPTIONS = [
  "#7C9EFF", // default periwinkle
  "#FF9E9E", // soft coral
  "#6FCF97", // mint green
  "#C77DFF", // lavender violet
  "#F2C94C", // warm yellow
  "#FFB37D"  // soft orange
];

const FOCUS_AREAS_LIST: { id: Category; label: string; emoji: string }[] = [
  { id: "health", label: "Health", emoji: "🥗" },
  { id: "fitness", label: "Fitness", emoji: "🏃" },
  { id: "study", label: "Study / Upskilling", emoji: "📚" },
  { id: "mindfulness", label: "Mindfulness", emoji: "🧘" },
  { id: "productivity", label: "Productivity", emoji: "🎯" },
];

export const SettingsView: React.FC = () => {
  const {
    habits,
    settings,
    updateSettings,
    deleteHabit,
    updateHabit,
    exportData,
    importData,
    wipeDatabase,
  } = useHabitStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userNameEdit, setUserNameEdit] = useState(settings.userName);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  // 2-phase ADHD-aware Reset Everything state: 0 = closed, 1 = check overview, 2 = final verification trigger
  const [resetEverythingStep, setResetEverythingStep] = useState<0 | 1 | 2>(0);

  // Profile Save Action with validation and Auto-saving hints
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      userName: userNameEdit.trim() || settings.userName || "Achiever",
    });
  };

  const handleBlurProfile = () => {
    updateSettings({
      userName: userNameEdit.trim() || settings.userName || "Achiever",
    });
  };

  const toggleFocusAreaSettings = (cat: Category) => {
    let updated = [...settings.focusAreas];
    if (updated.includes(cat)) {
      updated = updated.filter((f) => f !== cat);
    } else {
      updated = [...updated, cat];
    }
    updateSettings({ focusAreas: updated });
  };

  // Appearance Actions
  const handleThemeToggle = (newTheme: "light" | "dark") => {
    updateSettings({ theme: newTheme });
  };

  const handleAccentChange = (hex: string) => {
    updateSettings({ accentColor: hex });
  };

  // Habit List Edit / Delete handlers
  const handleEditHabitClick = (habit: Habit) => {
    setEditingHabit(habit);
  };

  const handleHabitUpdateSubmit = (updatedFields: {
    name: string;
    category: Category;
    color: string;
    emoji: string;
    goalDaysPerWeek: number;
  }) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, updatedFields);
      setEditingHabit(null);
    }
  };

  const handleDeleteHabitClick = (id: string, name: string) => {
    const doubleCheck = confirm(`Are you absolutely sure you want to delete "${name}"? This will prune all historic completion logs associated with it. Undo will be available.`);
    if (doubleCheck) {
      deleteHabit(id);
    }
  };

  // Data Persistence Actions
  const handleExport = () => {
    try {
      const dataStr = exportData();
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `craftedbyyours-backup-${format(new Date(), "yyyyMMdd")}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export backup JSON. Refer to help guide.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        const check = confirm(
          "Importing data will completely overwrite all current habits and logs history. Are you sure you want to proceed?"
        );
        if (check) {
          const success = importData(result);
          if (success) {
            alert("Database synchronized from backup successfully! App state reloaded.");
          } else {
            alert("Invalid backup schema. Import aborted.");
          }
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const executeFinalReset = () => {
    wipeDatabase();
    setResetEverythingStep(0);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.2 } }
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      id="settings-view" 
      className="space-y-6 select-none pb-16 text-left"
    >
      <h2 className="text-xl font-black text-gray-900 dark:text-neutral-50 uppercase tracking-widest pt-2 leading-none">
        HUB SETTINGS
      </h2>

      {/* Grid segments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION 1: Profile Segment */}
        <div id="profile-card" className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100 dark:border-neutral-800">
            <User size={16} className="text-[#7C9EFF]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-neutral-200">
              Profile Management
            </h4>
          </div>

          {/* User name form */}
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">
                User Name (Auto-saves)
              </label>
              <div className="flex gap-2">
                <input
                  id="settings-username-input"
                  type="text"
                  value={userNameEdit}
                  onChange={(e) => setUserNameEdit(e.target.value)}
                  onBlur={handleBlurProfile}
                  placeholder="e.g. Achiever"
                  className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-850 focus:bg-white dark:focus:bg-neutral-900 text-gray-950 dark:text-[#EEEEEE] focus:outline-none focus:ring-1 focus:ring-[#7C9EFF]"
                />
              </div>
            </div>
          </form>

          {/* Focus Areas settings config */}
          <div className="space-y-2 pt-1">
            <label className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Focus Pillars
              <Tooltip content="The core areas of your life you want to prioritize. Selecting focus pillars helps personalize suggestions." />
            </label>
            <div id="settings-focus-areas-grid" className="flex flex-wrap gap-2">
              {FOCUS_AREAS_LIST.map((pill) => {
                const active = settings.focusAreas.includes(pill.id);
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => toggleFocusAreaSettings(pill.id)}
                    className={`px-3.5 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer select-none ${
                      active
                        ? "bg-[#7C9EFF]/15 text-[#4A72E5] dark:text-[#9FB7FF] border border-[#7C9EFF]"
                        : "bg-gray-50/50 dark:bg-neutral-805 text-gray-400 dark:text-neutral-500 border border-gray-150 dark:border-neutral-800 hover:border-gray-300"
                    }`}
                  >
                    <span>{pill.emoji} </span>
                    <span>{pill.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 2: Appearance Segment */}
        <div id="appearance-card" className="bg-white border border-gray-150 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
            <Palette size={16} className="text-[#7C9EFF]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">
              Visual Preferences
            </h4>
          </div>

          {/* Accent Color custom picker */}
          <div className="space-y-2 pt-1">
            <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Brand Accent Color
            </label>
            <div id="appearance-accent-palette" className="flex items-center gap-3">
              {ACCENT_OPTIONS.map((swatch) => {
                const active = settings.accentColor === swatch;
                return (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => handleAccentChange(swatch)}
                    style={{ backgroundColor: swatch }}
                    className="w-7 h-7 rounded-full border border-transparent hover:scale-110 active:scale-90 transition-all cursor-pointer flex items-center justify-center relative shadow-xs"
                  >
                    {active && (
                      <Check size={12} className="text-white drop-shadow-sm font-bold" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 3: Habits registry slide-switches list */}
      <div id="habits-mgmt-card" className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100 dark:border-neutral-800">
          <FolderGit2 size={16} className="text-[#7C9EFF]" />
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-neutral-200">
            Active Habits Registry ({habits.length})
          </h4>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-6 text-xs text-secondary font-semibold">
            No habits in database. Get started by tracking a habit in the tracker views.
          </div>
        ) : (
          <div id="settings-habits-list" className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-2">
            {habits.map((h) => (
              <div
                key={h.id}
                style={{ borderLeftColor: h.color }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-150 dark:border-neutral-800 border-l-4 rounded-2xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0 select-none">{h.emoji}</span>
                  <div className="min-w-0 leading-tight">
                    <span className="block text-xs font-bold text-gray-800 dark:text-neutral-100 truncate">
                      {h.name}
                    </span>
                    <span className="block text-[9px] text-[#A0A0A0] font-extrabold uppercase mt-0.5">
                      Category: {h.category} • {h.goalDaysPerWeek}d goal
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 select-none">
                  {/* Slide switch for isActive deactivation / activation */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-wide text-gray-400">
                      {h.isActive ? "Shown" : "Hidden"}
                    </span>
                    <button
                      onClick={() => updateHabit(h.id, { isActive: !h.isActive })}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                        h.isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-neutral-800"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          h.isActive ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="w-px h-5 bg-gray-200 dark:bg-neutral-800" />

                  {/* Edit / Permanent Delete actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditHabitClick(h)}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-400 text-gray-600 dark:text-neutral-400 transition-colors cursor-pointer"
                      title="Edit Habit"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteHabitClick(h.id, h.name)}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-red-400 hover:text-red-500 text-gray-400 transition-colors cursor-pointer"
                      title="Permanently Delete Habit"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: ADHD & Burnout Protection Suite */}
      <div id="adhd-protection-card" className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-3xl p-5 md:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100 dark:border-neutral-800">
          <Shield size={16} className="text-[#7C9EFF]" />
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-neutral-200">
            ADHD Support & Burnout Protection Suite
          </h4>
        </div>
        
        <p className="text-xs text-secondary leading-relaxed">
          Struggling with focus or exhaustion? Activate these cognitive buffers to make the companion adapt compassionately to your emotional state.
        </p>

        <div className="space-y-4">
          {/* Streak Freeze Tool */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-gray-50 dark:bg-neutral-950 border border-gray-150 dark:border-neutral-800/80">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">❄️</span>
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-800 dark:text-neutral-200">
                  Zero-Guilt Streak Freeze
                </span>
                {settings.streakFreezeActive && (
                  <span className="animate-pulse bg-sky-400/10 text-sky-500 border border-sky-400/20 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-secondary font-semibold leading-normal">
                Life gets hectic. Freeze your daily checking streaks when exhausted, sick, or on vacation. Zero penalty, zero guilt.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ streakFreezeActive: !settings.streakFreezeActive })}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                settings.streakFreezeActive
                  ? "bg-sky-500 text-white shadow-xs"
                  : "border border-gray-200 dark:border-neutral-800 hover:border-gray-400 text-gray-600 dark:text-neutral-400"
              }`}
            >
              {settings.streakFreezeActive ? "On" : "Off"}
            </button>
          </div>

          {/* ADHD visual tips buddy */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-gray-50 dark:bg-neutral-950 border border-gray-150 dark:border-neutral-800/80">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">🧠</span>
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-800 dark:text-neutral-200">
                  ADHD Focus Compassion Companion
                </span>
                {settings.adhdCompanionEnabled && (
                  <span className="animate-pulse bg-[#7C9EFF]/10 text-[#7293FD] border border-[#7C9EFF]/20 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-secondary font-semibold leading-normal">
                Inject mindful micro-coaching alerts and ADHD quick reset suggestions into the tracking layout when feeling stuck.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ adhdCompanionEnabled: !settings.adhdCompanionEnabled })}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                settings.adhdCompanionEnabled
                  ? "bg-[#7C9EFF] text-white shadow-xs"
                  : "border border-gray-200 dark:border-neutral-800 hover:border-gray-400 text-gray-600 dark:text-neutral-400"
              }`}
            >
              {settings.adhdCompanionEnabled ? "On" : "Off"}
            </button>
          </div>

          {/* Clean Slate Ceremony reset trigger */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-red-100 dark:border-red-950/20 bg-rose-500/5">
            <div className="leading-tight">
              <span className="block text-[10px] font-extrabold uppercase text-rose-500 tracking-wider">
                Psychological Fresh Start
              </span>
              <span className="block text-[9px] text-[#A0A0A0] font-semibold mt-0.5">
                Erase legacy friction and starting cleanly is an ADHD superpower.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setResetEverythingStep(1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-rose-500 text-white shadow-xs hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw size={10} />
              <span>Restart Ceremonially</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 5: Branding credit line */}
      <div className="text-center pt-8 space-y-1 select-none opacity-80">
        <div className="flex items-center justify-center gap-1.5">
          <Sparkles size={12} className="text-[#7C9EFF]" />
          <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-gray-400 dark:text-neutral-500">
            Made with CraftedByYours
          </span>
        </div>
        <p className="text-[9px] text-gray-400 font-semibold select-none">
          Version 1.1 • Premium Digital Habit Tracker
        </p>
      </div>

      {/* Editing Habit sheet drawer */}
      <BottomSheet
        isOpen={editingHabit !== null}
        onClose={() => setEditingHabit(null)}
        title={editingHabit ? `Adjust ${editingHabit.name}` : "Adjust Habit Record"}
      >
        {editingHabit && (
          <HabitForm
            initialHabit={editingHabit}
            onSubmit={handleHabitUpdateSubmit}
            onCancel={() => setEditingHabit(null)}
          />
        )}
      </BottomSheet>

      {/* 2-Phase ADHD-friendly Reset Experience Modal */}
      <AnimatePresence>
        {resetEverythingStep > 0 && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden select-none">
            {/* Dark blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              onClick={() => setResetEverythingStep(0)}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs z-50"
            />

            {/* Modal Body Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="relative bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl z-55 text-center space-y-5"
            >
              {resetEverythingStep === 1 ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                    <RotateCcw size={22} className="animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-gray-900 dark:text-neutral-50 tracking-tight">
                      Psychological Fresh Start?
                    </h3>
                    <p className="text-xs text-secondary leading-relaxed">
                      We understand. ADHD minds thrive on clearing off legacy system friction and starting clean. This action resets your entire workspace.
                    </p>
                  </div>

                  {/* Highlight checklist of cleared points */}
                  <div className="bg-gray-50 dark:bg-neutral-850 p-3.5 rounded-2xl text-left border border-gray-150 dark:border-neutral-800 text-xs space-y-1.5 font-semibold text-gray-700 dark:text-neutral-300">
                    <span className="block text-[9px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-neutral-500 mb-1">THIS ACTION CLEARS:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-red-500 shrink-0">✕</span>
                      <span>All habits and directory registry</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-red-500 shrink-0">✕</span>
                      <span>Your historic check-in calendar logs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-red-500 shrink-0">✕</span>
                      <span>Current streaks of {habits.length} habits</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-red-500 shrink-0">✕</span>
                      <span>Username preferences and colors</span>
                    </div>
                  </div>

                  <p className="text-[11px] font-bold text-red-505 dark:text-red-400 leading-normal bg-red-500/5 py-2 px-3 rounded-xl border border-red-500/10">
                    ⚠️ This permanently clears all local progress and cannot be undone.
                  </p>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setResetEverythingStep(0)}
                      className="flex-1 py-3 px-4 border border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-850 text-gray-600 dark:text-neutral-300 font-extrabold rounded-xl transition-all cursor-pointer text-[10px] uppercase tracking-wider"
                    >
                      Keep Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetEverythingStep(2)}
                      className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-xl transition-all cursor-pointer text-[10px] uppercase tracking-wider shadow-xs"
                    >
                      Next Step
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-650 dark:bg-red-605 text-white flex items-center justify-center mx-auto shadow-md">
                    <RotateCcw size={22} className="animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-gray-900 dark:text-neutral-50 tracking-tight">
                      Double Confirmation Check
                    </h3>
                    <p className="text-xs text-secondary leading-relaxed">
                      This is the absolute final checkpoint. Your database will be completely wiped of all records, re-triggering the clean state. Are you absolutely ready?
                    </p>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setResetEverythingStep(1)}
                      className="flex-1 py-3 px-4 border border-gray-150 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-850 text-gray-600 dark:text-neutral-350 font-extrabold rounded-xl transition-all cursor-pointer text-[10px] uppercase tracking-wider"
                    >
                      Go Back
                    </button>
                    <button
                      type="button"
                      onClick={executeFinalReset}
                      className="flex-1 py-3 px-4 bg-red-650 hover:bg-red-700 text-white font-extrabold rounded-xl transition-all cursor-pointer text-[10px] uppercase tracking-wider shadow-md hover:scale-[1.01] active:scale-95 duration-150"
                    >
                      Wipe Slate Clean ✨
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

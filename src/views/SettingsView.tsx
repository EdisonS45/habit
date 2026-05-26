import React, { useState, useRef } from "react";
import { useHabitStore } from "../context/HabitContext";
import { Habit, HabitCategory } from "../types";
import { BottomSheet } from "../components/ui/BottomSheet";
import { HabitForm } from "../components/habits/HabitForm";
import { format } from "date-fns";
import { Trash2, Edit2, Upload, Download, RotateCcw, Check, Sparkles, User, Palette, FolderGit2 } from "lucide-react";
import { motion } from "framer-motion";

const ACCENT_OPTIONS = [
  "#7C9EFF", // default periwinkle
  "#FF9E9E", // soft coral
  "#6FCF97", // mint green
  "#C77DFF", // lavender violet
  "#F2C94C", // warm yellow
  "#1A1A1A"  // charcoal dark
];

const FOCUS_AREAS_LIST: { id: HabitCategory; label: string; emoji: string }[] = [
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
  } = useHabitStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userNameEdit, setUserNameEdit] = useState(settings.userName);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Profile Save Action
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      userName: userNameEdit.trim() || settings.userName || "Achiever",
    });
    alert("Profile configurations saved! ✨");
  };

  const toggleFocusAreaSettings = (cat: HabitCategory) => {
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
    category: HabitCategory;
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
    const doubleCheck = confirm(`Are you absolutely sure you want to delete "${name}"? This will prune all historic completion logs associated with it.`);
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
      alert("Failed to export. Please try again.");
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
            alert("Database synchronized from backup successfully! Refreshing dashboard.");
            window.location.reload();
          } else {
            alert("Invalid backup schema. Import aborted.");
          }
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClearData = () => {
    const check1 = confirm("WARNING: You are about to wipe your database. This will destroy all logs, tracked habits, and onboarding configuration keys. This action cannot be undone. Clear all data?");
    if (check1) {
      const check2 = confirm("Double confirmation required. Wipe ALL user data now?");
      if (check2) {
        localStorage.clear();
        alert("CraftedByYours database reset successfully. Reloading view.");
        window.location.reload();
      }
    }
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
      className="space-y-6 select-none pb-12"
    >
      <h2 className="text-xl font-black text-gray-900 dark:text-neutral-50 uppercase tracking-widest pt-2 leading-none">
        Hubit Settings
      </h2>

      {/* Grid segments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION 1: Profile Segment */}
        <div id="profile-card" className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-neutral-800">
            <User size={18} className="text-[#7C9EFF]" />
            <h4 className="text-sm font-extrabold text-gray-800 dark:text-neutral-200">
              Profile Management
            </h4>
          </div>

          {/* User name form */}
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">
                User Name Key
              </label>
              <div className="flex gap-2">
                <input
                  id="settings-username-input"
                  type="text"
                  value={userNameEdit}
                  onChange={(e) => setUserNameEdit(e.target.value)}
                  placeholder="e.g. Achiever"
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-neutral-800 bg-transparent text-gray-900 dark:text-neutral-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#7C9EFF]"
                />
                <button
                  type="submit"
                  id="save-profile-btn"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-[#7C9EFF] hover:bg-[#688CEB] text-white transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </form>

          {/* Focus Areas settings config */}
          <div className="space-y-2 pt-2">
            <label className="block text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">
              Focus Pillars
            </label>
            <div id="settings-focus-areas-grid" className="flex flex-wrap gap-2">
              {FOCUS_AREAS_LIST.map((pill) => {
                const active = settings.focusAreas.includes(pill.id);
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => toggleFocusAreaSettings(pill.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                      active
                        ? "bg-[#7C9EFF]/15 text-[#4A72E5] border border-[#7C9EFF]"
                        : "bg-gray-50/50 dark:bg-neutral-800/50 text-gray-500 border border-transparent hover:border-gray-200"
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
        <div id="appearance-card" className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-neutral-800">
            <Palette size={18} className="text-[#7C9EFF]" />
            <h4 className="text-sm font-extrabold text-gray-800 dark:text-neutral-200">
              Visual Preferences
            </h4>
          </div>

          {/* Theme custom toggle */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">
              Interface Theme
            </label>
            <div id="theme-toggles" className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-neutral-950 p-1 rounded-xl border border-gray-100 dark:border-neutral-800">
              <button
                type="button"
                id="light-theme-btn"
                onClick={() => handleThemeToggle("light")}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  settings.theme === "light"
                    ? "bg-white dark:bg-neutral-800 shadow-2xs text-gray-900 dark:text-neutral-100 border border-transparent dark:border-neutral-700"
                    : "text-gray-400"
                }`}
              >
                ☀️ Light Mode
              </button>
              <button
                type="button"
                id="dark-theme-btn"
                onClick={() => handleThemeToggle("dark")}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  settings.theme === "dark"
                    ? "bg-white dark:bg-neutral-800 shadow-2xs text-gray-900 dark:text-neutral-100 border border-transparent dark:border-neutral-700"
                    : "text-gray-400"
                }`}
              >
                🌙 Dark Mode
              </button>
            </div>
          </div>

          {/* Accent Color custom picker */}
          <div className="space-y-2 pt-2">
            <label className="block text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">
              Brand Accent Color
            </label>
            <div id="appearance-accent-palette" className="flex items-center gap-2">
              {ACCENT_OPTIONS.map((swatch) => {
                const active = settings.accentColor === swatch;
                return (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => handleAccentChange(swatch)}
                    style={{ backgroundColor: swatch }}
                    className="w-8 h-8 rounded-full border border-transparent hover:scale-110 active:scale-90 transition-all cursor-pointer flex items-center justify-center relative shadow-xs"
                  >
                    {active && (
                      <Check size={14} className="text-white drop-shadow-md font-bold" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 3: Habits manager directory list */}
      <div id="habits-mgmt-card" className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-neutral-800">
          <FolderGit2 size={18} className="text-[#7C9EFF]" />
          <h4 className="text-sm font-extrabold text-gray-800 dark:text-neutral-200">
            Active Habits Registry ({habits.length})
          </h4>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-6 text-xs text-secondary font-medium">
            No habits in database. Get started by tracking a habit.
          </div>
        ) : (
          <div id="settings-habits-list" className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
            {habits.map((habit) => (
              <div
                key={habit.id}
                style={{ borderLeftColor: habit.color }}
                className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-neutral-950 border border-gray-100 dark:border-neutral-800 border-l-4 rounded-xl"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">{habit.emoji}</span>
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-gray-800 dark:text-neutral-200 truncate">
                      {habit.name}
                    </span>
                    <span className="block text-[10px] text-gray-400 font-semibold capitalize">
                      Category: {habit.category} • {habit.goalDaysPerWeek}d target
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleEditHabitClick(habit)}
                    className="p-1.5 rounded-lg border border-gray-150 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-400 text-gray-600 dark:text-neutral-400 transition-colors cursor-pointer"
                    title="Edit Habit Settings"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteHabitClick(habit.id, habit.name)}
                    className="p-1.5 rounded-lg border border-gray-150 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-rose-400 hover:bg-rose-50/50 hover:text-rose-500 text-gray-400 transition-colors cursor-pointer"
                    title="Delete Habit permanent"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: Database Import / Export backups */}
      <div id="database-persistence-card" className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-extrabold text-gray-800 dark:text-neutral-200">
          Database & Local Backup Management
        </h4>
        <p className="text-xs text-secondary leading-normal font-semibold">
          Data persists entirely offline in your standard browser sandbox. Export backups as JSON data sheets, clear tables safely, or reload profiles.
        </p>

        <div id="data-actions-flex" className="flex flex-wrap gap-3 pt-2">
          {/* Download */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-[#7C9EFF] text-gray-600 dark:text-neutral-300 transition-all cursor-pointer shadow-3xs hover:shadow-xs hover:scale-[1.02] active:scale-95"
          >
            <Download size={14} />
            <span>Export Backup JSON</span>
          </button>

          {/* Upload */}
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-[#7C9EFF] text-gray-600 dark:text-neutral-300 transition-all cursor-pointer shadow-3xs hover:shadow-xs hover:scale-[1.02] active:scale-95"
          >
            <Upload size={14} />
            <span>Import Sync JSON</span>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFileChange}
            accept=".json"
            className="hidden"
          />

          {/* Reset */}
          <button
            onClick={handleClearData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-100 dark:border-rose-500/15 bg-rose-50/15 text-rose-500 hover:border-rose-500 hover:bg-rose-50/50 transition-all cursor-pointer shadow-3xs hover:shadow-xs active:scale-95"
          >
            <RotateCcw size={14} />
            <span>Wipe Local Database</span>
          </button>
        </div>
      </div>

      {/* SECTION 5: Branding block credits */}
      <div className="text-center pt-8 space-y-1.5 select-none opacity-80">
        <div className="flex items-center justify-center gap-1.5">
          <Sparkles size={14} className="text-[#7C9EFF]" />
          <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-neutral-500">
            Made with CraftedByYours
          </span>
        </div>
        <p className="text-[10px] text-gray-400 font-semibold">
          Version 1.0.0 • Production Quality Client Setup
        </p>
      </div>

      {/* Editing Habit sheet drawer model */}
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
    </motion.div>
  );
};

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop screen */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black backdrop-blur-xs z-0"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="relative bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl z-10 select-none text-center"
          >
            <h3 className="text-base font-black text-gray-900 dark:text-neutral-50 tracking-tight mb-2">
              {title}
            </h3>
            <p className="text-xs text-secondary mb-6 leading-relaxed">
              {message}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 px-4 border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-bold rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

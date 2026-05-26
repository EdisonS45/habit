import React, { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center overflow-hidden">
          {/* Backdrop Overlay */}
          <motion.div
            id="bottom-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 bg-black backdrop-blur-xs cursor-pointer z-0"
          />

          {/* Slide up sheet container */}
          <motion.div
            id="bottom-sheet-container"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) {
                onClose();
              }
            }}
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 40,
            }}
            className="relative w-full md:max-w-md bg-white dark:bg-neutral-900 border border-t border-gray-150 dark:border-neutral-800 rounded-t-3xl md:rounded-3xl max-h-[85vh] md:max-h-[90vh] flex flex-col shadow-2xl z-10 select-none pb-safe"
          >
            {/* Gray indicator handle (36px wide / 4px tall) for dragging */}
            <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="w-9 h-1 bg-gray-300 dark:bg-neutral-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center px-6 pb-4 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="text-base font-black text-gray-900 dark:text-neutral-50 tracking-tight">
                {title}
              </h3>
              <button
                id="close-bottom-sheet"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-neutral-200 border border-transparent hover:border-gray-200 dark:hover:border-neutral-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content list */}
            <div className="p-6 overflow-y-auto flex-1 text-sm bg-white dark:bg-neutral-900">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

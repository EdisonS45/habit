import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const isLoaded = sessionStorage.getItem("cby_loaded");
    if (isLoaded) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("cby_loaded", "true");
      // Wait for opacity fade-out before unmounting
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(completeTimer);
    }, 1200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAFAF8] dark:bg-[#111111]"
        >
          <div className="flex flex-col items-center gap-6">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
              style={{ color: "#7C9EFF" }}
              className="text-3xl font-black tracking-tight"
            >
              CraftedByYours
            </motion.h1>

            {/* CSS-only loading spinner */}
            <div className="relative w-8 h-8">
              <div className="w-8 h-8 rounded-full border-2 border-[#7C9EFF]/15 border-t-[#7C9EFF] animate-spin"></div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-neutral-500"
            >
              Your habits. Your pace.
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  content: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (window.innerWidth >= 768) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      setIsOpen(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    
    // Auto dismiss after 3 seconds on mobile
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 3000);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-flex items-center ml-1.5 z-30"
    >
      <button
        type="button"
        onClick={handleClick}
        className="text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors cursor-pointer inline-flex items-center justify-center p-0.5 rounded-full"
        aria-label="Help info"
      >
        <span className="text-[10px] font-bold select-none h-4.5 w-4.5 inline-flex items-center justify-center border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 rounded-full font-mono text-center">
          i
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[220px] p-3 bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl shadow-lg text-left"
          >
            <p className="text-[11px] leading-relaxed text-gray-600 dark:text-neutral-300 font-semibold select-none">
              {content}
            </p>
            {/* Arrow pointing down */}
            <div className="absolute top-[calc(100%-4px)] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white dark:bg-neutral-900 border-r border-b border-gray-150 dark:border-neutral-800 rotate-45 pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

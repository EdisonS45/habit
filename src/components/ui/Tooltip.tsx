import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHabitStore } from "../../context/HabitContext";

interface TooltipProps {
  content: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  let accentColor = "#7C9EFF";
  try {
    const store = useHabitStore();
    if (store && store.settings) {
      accentColor = store.settings.accentColor || accentColor;
    }
  } catch (e) {
    // Graceful fallback outside provider
  }

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (window.innerWidth >= 768) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
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
    }, 4000);
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

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // If there is less than 130px of space above the icon in the viewport, show below
      if (rect.top < 130) {
        setPosition("bottom");
      } else {
        setPosition("top");
      }
    }
  }, [isOpen]);

  const activeColor = isHovered || isOpen ? accentColor : undefined;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-flex items-center ml-1 z-40"
    >
      <button
        type="button"
        onClick={handleClick}
        className="text-gray-400 hover:text-gray-650 transition-colors duration-150 cursor-pointer inline-flex items-center justify-center p-0.5 rounded-full"
        style={activeColor ? { color: activeColor } : undefined}
        aria-label="Help info"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 11.5V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="7.75" r="1.25" fill="currentColor" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: position === "top" ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: position === "top" ? 4 : -4 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={`absolute ${
              position === "top" ? "bottom-full mb-2" : "top-full mt-2"
            } left-1/2 -translate-x-1/2 w-[210px] p-2.5 bg-white border border-gray-150 rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.07)] text-center pointer-events-none`}
          >
            <p className="text-[10px] leading-relaxed text-gray-500 font-extrabold select-none">
              {content}
            </p>
            {/* Arrow pointing down or up */}
            {position === "top" ? (
              <div className="absolute top-[calc(100%-5px)] left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-gray-150 rotate-45 pointer-events-none" />
            ) : (
              <div className="absolute bottom-[calc(100%-5px)] left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-l border-t border-gray-150 rotate-45 pointer-events-none" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, 300); // Slight delay for better UX
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top': return 'bottom-full left-1/2 -translate-x-1/2 mb-3';
      case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-3';
      case 'left': return 'right-full top-1/2 -translate-y-1/2 mr-3';
      case 'right': return 'left-full top-1/2 -translate-y-1/2 ml-3';
      default: return 'bottom-full left-1/2 -translate-x-1/2 mb-3';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top': return 'top-full left-1/2 -translate-x-1/2 border-t-slate-900';
      case 'bottom': return 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900';
      case 'left': return 'left-full top-1/2 -translate-y-1/2 border-l-slate-900';
      case 'right': return 'right-full top-1/2 -translate-y-1/2 border-r-slate-900';
      default: return 'top-full left-1/2 -translate-x-1/2 border-t-slate-900';
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 5 : -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 5 : -5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-[100] w-max max-w-[200px] px-3 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-2xl pointer-events-none ${getPositionClasses()}`}
          >
            {text}
            <div className={`absolute border-4 border-transparent ${getArrowClasses()}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;

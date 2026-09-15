"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

interface InfoTipProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export default function InfoTip({ children, title, className = "" }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <span ref={ref} className={`relative inline-flex ${className}`}>
      <span
        role="button"
        tabIndex={0}
        aria-label="More information"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }
        }}
        className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-300 hover:bg-amber-400 text-white hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer pointer-events-auto"
      >
        <Info size={9} strokeWidth={3} />
      </span>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-xl bg-slate-900 text-slate-100 text-[10px] leading-relaxed font-medium shadow-xl border border-slate-700 pointer-events-auto"
          >
            {title && (
              <span className="block text-[9px] font-extrabold uppercase tracking-wider text-amber-400 mb-1">
                {title}
              </span>
            )}
            {children}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-700" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
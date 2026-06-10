'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Tv, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Slide {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface LoginSlideshowProps {
  currentSlide?: number;
  onNext?: () => void;
  onPrev?: () => void;
}

const slides: Slide[] = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-6 h-6 text-emerald-400/80"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: 'Rede de Mídia',
    description: 'Distribuição global com latência mínima.',
  },
  {
    icon: <Tv className="w-6 h-6 text-emerald-400/80" />,
    title: 'Broadcast Smart',
    description: 'Software de última geração para sinalização.',
  },
  {
    icon: <Layers className="w-6 h-6 text-emerald-400/80" />,
    title: 'Métricas de IA',
    description: 'Relatórios de engajamento em tempo real.',
  },
];

export function LoginSlideshow({
  currentSlide: externalSlide,
  onNext,
  onPrev,
}: LoginSlideshowProps) {
  // Internal state for self-contained auto-rotation
  const [internalSlide, setInternalSlide] = useState(0);

  // Use external slide if provided, otherwise use internal state
  const slideIndex = externalSlide !== undefined ? externalSlide : internalSlide;

  // Stable next/prev handlers using useCallback
  const handleNext = useCallback(() => {
    if (onNext) {
      onNext();
    } else {
      setInternalSlide((prev) => (prev + 1) % slides.length);
    }
  }, [onNext]);

  const handlePrev = useCallback(() => {
    if (onPrev) {
      onPrev();
    } else {
      setInternalSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
  }, [onPrev]);

  // Auto-rotate slides every 4 seconds - only depends on stable handleNext
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [handleNext]);

  return (
    <div className="max-w-md">
      <div className="p-8 bg-white/40 dark:bg-zinc-900/30 backdrop-blur-xl border border-emerald-500/10 dark:border-white/5 rounded-[2.5rem] relative group space-y-6 shadow-sm dark:shadow-none transition-all duration-500">
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="space-y-4"
          >
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              {slides[slideIndex].icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">
              {slides[slideIndex].title}
            </h3>
            <p className="text-slate-600 dark:text-zinc-500 text-sm leading-relaxed transition-colors">
              {slides[slideIndex].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
          <div className="flex gap-1.5">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${idx === slideIndex ? 'w-6 bg-emerald-500' : 'w-2 bg-slate-200 dark:bg-zinc-800'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              className="p-2 hover:bg-emerald-500/5 dark:hover:bg-white/5 rounded-lg transition-colors text-slate-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-emerald-500/5 dark:hover:bg-white/5 rounded-lg transition-colors text-slate-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

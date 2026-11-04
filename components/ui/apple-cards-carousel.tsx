'use client';

import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from 'react';
import { ArrowLeft, ArrowRight, X, ExternalLink, Clock, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatTimeAgo, formatDate } from '@/lib/utils/format-date';

interface CarouselProps {
  items: React.ReactNode[];
  initialScroll?: number;
}

export type CarouselCardData = {
  id: string;
  src: string;
  title: string;
  category: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  isBreaking?: boolean;
  content?: React.ReactNode;
};

export const CarouselContext = createContext<{
  onCardClose: (index: number) => void;
  currentIndex: number;
}>({
  onCardClose: () => {},
  currentIndex: 0,
});

export const Carousel = ({ items, initialScroll = 0 }: CarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll]);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleCardClose = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <CarouselContext.Provider
      value={{ onCardClose: handleCardClose, currentIndex }}
    >
      <div className="relative w-full">
        {/* Carousel Scroll Container */}
        <div
          className="flex w-full overflow-x-auto overscroll-x-contain py-4 sm:py-6 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          ref={carouselRef}
          onScroll={checkScrollability}
        >
          <div className="flex flex-row justify-start gap-4 sm:gap-6 pl-1 pr-4 sm:pr-8">
            {items.map((item, index) => (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: 0.1 * index,
                    ease: 'easeOut',
                  },
                }}
                key={`carousel-item-${index}`}
                className="rounded-3xl flex-shrink-0"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex justify-end items-center gap-2 mt-2 mr-2 sm:mr-4">
          <button
            type="button"
            className="relative z-20 h-9 w-9 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-sm transition-all"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <ArrowLeft className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
          </button>
          <button
            type="button"
            className="relative z-20 h-9 w-9 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-sm transition-all"
            onClick={scrollRight}
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <ArrowRight className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>
  );
};

export const AppleCard = ({
  card,
  index,
  layout = false,
}: {
  card: CarouselCardData;
  index: number;
  layout?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { onCardClose } = useContext(CarouselContext);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handleClose();
      }
    }

    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    onCardClose(index);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 md:p-10">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-black/75 backdrop-blur-md fixed inset-0"
              onClick={handleClose}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              ref={containerRef}
              className="relative max-w-2xl w-full bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              {/* Close Button */}
              <button
                type="button"
                className="absolute top-4 right-4 z-20 h-9 w-9 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                onClick={handleClose}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Cover Image in Modal */}
              <div className="relative aspect-[16/9] w-full flex-shrink-0 bg-neutral-950">
                <Image
                  src={card.src}
                  alt={card.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 700px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 space-y-1">
                  <div className="flex items-center gap-2">
                    {card.isBreaking && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                        <Flame className="w-3 h-3 fill-white" /> Breaking
                      </span>
                    )}
                    <span className="text-xs uppercase tracking-wider font-bold text-white/90">
                      {card.category}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-serif font-black text-white leading-tight">
                    {card.title}
                  </h3>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 space-y-5 overflow-y-auto flex-1">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(card.publishedAt)}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(card.publishedAt)}</span>
                </div>

                {card.excerpt && (
                  <p className="text-base sm:text-lg font-serif italic text-neutral-700 dark:text-neutral-300 border-l-4 border-red-600 pl-4 py-1 leading-relaxed">
                    {card.excerpt}
                  </p>
                )}

                <div className="pt-4 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-400">
                    Pune Prime Times Dispatch
                  </span>
                  <Link
                    href={`/news/${card.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all"
                  >
                    Read Full Story
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Apple Card Trigger */}
      <motion.button
        type="button"
        onClick={handleOpen}
        className="rounded-3xl bg-neutral-900 h-[22rem] w-64 sm:h-[26rem] sm:w-80 md:h-[28rem] md:w-[22rem] overflow-hidden flex flex-col items-start justify-between relative z-10 shadow-lg border border-neutral-800/80 group text-left transition-transform hover:scale-[1.01]"
      >
        {/* Subtle Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent z-20 pointer-events-none" />

        {/* Top Header Tags */}
        <div className="relative z-30 p-5 sm:p-6 w-full flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/10">
            {card.category}
          </span>
          {card.isBreaking && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-600 text-white shadow-sm">
              <Flame className="w-2.5 h-2.5 fill-white" /> Breaking
            </span>
          )}
        </div>

        {/* Bottom Headline */}
        <div className="relative z-30 p-5 sm:p-6 space-y-2">
          <p className="text-white text-base sm:text-xl md:text-2xl font-serif font-black leading-tight group-hover:text-red-400 transition-colors line-clamp-3">
            {card.title}
          </p>
          <div className="flex items-center justify-between text-xs text-neutral-300 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-red-500" />
              {formatTimeAgo(card.publishedAt)}
            </span>
            <span className="text-[11px] font-semibold text-red-400 group-hover:translate-x-0.5 transition-transform">
              Tap to view &rarr;
            </span>
          </div>
        </div>

        {/* Background Image */}
        <Image
          src={card.src}
          alt={card.title}
          fill
          className="object-cover absolute inset-0 z-10 brightness-[0.85] group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 256px, 350px"
        />
      </motion.button>
    </>
  );
};


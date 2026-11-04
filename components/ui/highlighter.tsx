'use client';

import React, { useEffect, useRef, ReactNode } from 'react';
import { annotate } from 'rough-notation';
import type { RoughAnnotationType } from 'rough-notation/lib/model';

interface HighlighterProps {
  children: ReactNode;
  action?: RoughAnnotationType;
  color?: string;
  multiline?: boolean;
  animationDuration?: number;
  iterations?: number;
  padding?: number | [number, number, number, number];
  strokeWidth?: number;
  className?: string;
}

export function Highlighter({
  children,
  action = 'highlight',
  color = '#fecaca', // Soft red highlight matching brand
  multiline = true,
  animationDuration = 700,
  iterations = 2,
  padding = 3,
  strokeWidth = 2,
  className = '',
}: HighlighterProps) {
  const elementRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    // Small delay to ensure layout is measured accurately
    const timer = setTimeout(() => {
      if (!elementRef.current) return;
      const annotation = annotate(elementRef.current, {
        type: action,
        color,
        multiline,
        animationDuration,
        iterations,
        padding,
        strokeWidth,
      });

      annotation.show();
    }, 200);

    return () => clearTimeout(timer);
  }, [action, color, multiline, animationDuration, iterations, padding, strokeWidth]);

  return (
    <span ref={elementRef} className={`relative inline-block ${className}`}>
      {children}
    </span>
  );
}


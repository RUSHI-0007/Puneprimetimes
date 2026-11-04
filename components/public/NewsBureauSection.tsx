'use client';

import dynamic from 'next/dynamic';
import { Highlighter } from '@/components/ui/highlighter';
import { MapPin, Radio, Shield, Globe2 } from 'lucide-react';

// Dynamically import NewsGlobe to avoid SSR issues with WebGL canvas
const NewsGlobe = dynamic(
  () => import('@/components/ui/globe').then((mod) => mod.NewsGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-square max-w-[420px] mx-auto flex items-center justify-center">
        <div className="w-48 h-48 rounded-full border-2 border-dashed border-red-500/30 animate-spin" />
      </div>
    ),
  }
);

export default function NewsBureauSection() {
  const bureaus = [
    { name: 'Pune Headquarters', role: 'Central Newsroom & Editorial Bureau', active: true },
    { name: 'Mumbai Bureau', role: 'State Governance & Financial Affairs', active: true },
    { name: 'New Delhi Bureau', role: 'National Policy & Diplomatic Desk', active: true },
    { name: 'Bengaluru Corridor', role: 'Technology & AI Ecosystem', active: true },
    { name: 'Global Desks', role: 'London & Silicon Valley International', active: true },
  ];

  return (
    <section className="relative rounded-3xl overflow-hidden bg-neutral-950 text-white p-6 sm:p-10 md:p-14 border border-neutral-800 shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Bureau Information */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-950 text-red-400 border border-red-800/60">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              Live News Network
            </span>
            <span className="text-xs text-neutral-400 hidden sm:inline">•</span>
            <span className="text-xs text-neutral-400 hidden sm:inline">24/7 Verified Dispatch</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight text-white leading-tight">
            Reporting Pune to the World, and the World to{' '}
            <Highlighter action="underline" color="#ef4444" strokeWidth={3}>
              Pune.
            </Highlighter>
          </h2>

          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl font-normal">
            Pune Prime Times connects local civic ground reporting in Shivajinagar, Kothrud, and Hinjawadi with key national corridors and international tech centers.
          </p>

          {/* Bureau Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {bureaus.map((bureau, index) => (
              <div
                key={bureau.name}
                className="p-3 sm:p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-colors flex items-start gap-3"
              >
                <div className="p-2 rounded-xl bg-red-950/60 text-red-400 flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white truncate">
                      {bureau.name}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                    {bureau.role}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center gap-4 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-red-500" />
              Independent & Uncompromised
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-neutral-400" />
              Drag globe to explore locations
            </span>
          </div>
        </div>

        {/* Right Column: Interactive 3D Globe */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-full">
            <NewsGlobe />
            <div className="text-center mt-2">
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
                📍 Pune: 18.5204° N, 73.8567° E
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

interface NewsGlobeProps {
  className?: string;
}

export function NewsGlobe({ className = '' }: NewsGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);

  useEffect(() => {
    let phi = 0;
    let width = 0;

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    window.addEventListener('resize', onResize);
    onResize();

    if (!canvasRef.current) return;

    // Initialize 3D WebGL Globe focused around India & Pune (Lat: 18.52, Lng: 73.85)
    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: (width || 320) * 2,
      height: (width || 320) * 2,
      phi: 0.8,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.15, 0.15, 0.18],
      markerColor: [0.95, 0.2, 0.2], // Brand red markers
      glowColor: [0.8, 0.15, 0.15],
      arcColor: [0.95, 0.3, 0.3],
      arcWidth: 1.5,
      arcHeight: 0.3,
      markers: [
        // Pune Headquarters (Featured Hub)
        { location: [18.5204, 73.8567], size: 0.1 },
        // Mumbai Bureau
        { location: [19.076, 72.8777], size: 0.06 },
        // Delhi Bureau
        { location: [28.6139, 77.209], size: 0.06 },
        // Bengaluru Tech Bureau
        { location: [12.9716, 77.5946], size: 0.05 },
        // London International Desk
        { location: [51.5074, -0.1278], size: 0.05 },
        // San Francisco Bay Area Tech Desk
        { location: [37.7749, -122.4194], size: 0.05 },
      ],
      arcs: [
        // Real-time dispatch arcs from Pune HQ
        { from: [18.5204, 73.8567], to: [19.076, 72.8777] },
        { from: [18.5204, 73.8567], to: [28.6139, 77.209] },
        { from: [18.5204, 73.8567], to: [12.9716, 77.5946] },
        { from: [18.5204, 73.8567], to: [51.5074, -0.1278] },
        { from: [18.5204, 73.8567], to: [37.7749, -122.4194] },
      ],
    });

    let animationFrameId: number;
    const animate = () => {
      if (!pointerInteracting.current) {
        phi += 0.003;
      }
      globe.update({
        phi: phi + pointerInteractionMovement.current,
        width: (width || 320) * 2,
        height: (width || 320) * 2,
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className={`relative w-full aspect-square max-w-[420px] mx-auto flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current =
            e.clientX - pointerInteractionMovement.current;
          canvasRef.current?.style.setProperty('cursor', 'grabbing');
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          canvasRef.current?.style.setProperty('cursor', 'grab');
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          canvasRef.current?.style.setProperty('cursor', 'grab');
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta * 0.005;
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta * 0.005;
          }
        }}
        className="w-full h-full cursor-grab opacity-95 transition-opacity duration-500"
      />
    </div>
  );
}

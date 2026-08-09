'use client';

import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">

      {/* Subtle Geometric Mesh Dot Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#0d9488 1.2px, transparent 1.2px)`,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Orb 1: Vibrant Teal / Emerald Glow Top-Left Edge */}
      <div className="absolute -top-40 -left-48 w-[500px] h-[500px] bg-gradient-to-br from-teal-400/40 via-emerald-300/25 to-transparent rounded-full blur-3xl animate-float-slow" />

      {/* Orb 2: Warm Rose / Pink Glow Top-Right Edge */}
      <div
        className="absolute top-1/4 -right-48 w-[480px] h-[480px] bg-gradient-to-bl from-rose-400/35 via-pink-300/25 to-transparent rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '2s' }}
      />

      {/* Orb 3: Cyan / Teal Glow Far-Left Edge (Shifted completely off-center to left margin) */}
      <div
        className="absolute top-1/2 -left-52 w-[450px] h-[450px] bg-gradient-to-tr from-teal-300/30 via-emerald-200/20 to-transparent rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '4s' }}
      />

      {/* Orb 4: Soft Indigo / Teal Glow Bottom-Right Edge */}
      <div
        className="absolute -bottom-40 -right-48 w-[500px] h-[500px] bg-gradient-to-tl from-teal-400/35 via-indigo-300/20 to-transparent rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '1.5s' }}
      />

      {/* Orb 5: Warm Gold Accent Bottom-Left Edge */}
      <div
        className="absolute bottom-1/4 -left-48 w-[420px] h-[420px] bg-gradient-to-r from-amber-300/25 via-emerald-200/20 to-transparent rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '3s' }}
      />
    </div>
  );
}

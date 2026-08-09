'use client';

import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">

      {/* Subtle Geometric Mesh Dot Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#0d9488 1.2px, transparent 1.2px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Orb 1: Vibrant Teal / Emerald Glow Top-Left */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-gradient-to-br from-teal-400/50 via-emerald-300/35 to-transparent rounded-full blur-3xl animate-float-slow" />

      {/* Orb 2: Warm Rose / Pink Glow Top-Right */}
      <div
        className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-gradient-to-bl from-rose-400/40 via-pink-300/30 to-transparent rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '2s' }}
      />

      {/* Orb 3: Cyan / Amber Glow Middle */}
      <div
        className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-300/35 via-teal-200/30 to-transparent rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '4s' }}
      />

      {/* Orb 4: Soft Indigo / Teal Glow Bottom-Right */}
      <div
        className="absolute -bottom-40 -right-20 w-[550px] h-[550px] bg-gradient-to-tl from-teal-400/45 via-indigo-300/30 to-transparent rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '1.5s' }}
      />

      {/* Orb 5: Warm Gold Accent Left Bottom */}
      <div
        className="absolute bottom-1/3 -left-32 w-[450px] h-[450px] bg-gradient-to-r from-amber-300/35 via-emerald-200/25 to-transparent rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '3s' }}
      />
    </div>
  );
}

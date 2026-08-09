'use client';

import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-35 sm:opacity-45">
      {/* Orb 1: Teal Glow Top Left */}
      <div className="absolute -top-24 -left-24 w-96 h-96 sm:w-[500px] sm:h-[500px] bg-gradient-to-br from-teal-300/40 via-emerald-200/30 to-transparent rounded-full blur-3xl animate-float-slow" />

      {/* Orb 2: Rose Glow Top Right */}
      <div
        className="absolute top-1/4 -right-32 w-80 h-80 sm:w-[450px] sm:h-[450px] bg-gradient-to-bl from-rose-300/35 via-pink-200/25 to-transparent rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '2s' }}
      />

      {/* Orb 3: Amber/Cyan Glow Center Left */}
      <div
        className="absolute top-2/3 -left-20 w-80 h-80 sm:w-[420px] sm:h-[420px] bg-gradient-to-tr from-cyan-300/30 via-teal-200/20 to-transparent rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '3.5s' }}
      />

      {/* Orb 4: Soft Violet/Teal Glow Bottom Right */}
      <div
        className="absolute -bottom-32 right-1/4 w-96 h-96 sm:w-[500px] sm:h-[500px] bg-gradient-to-tl from-emerald-300/30 via-teal-100/30 to-transparent rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '1.5s' }}
      />
    </div>
  );
}

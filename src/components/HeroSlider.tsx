'use client';

import React, { useState, useEffect } from 'react';
import { getFirstImageUrl } from '@/lib/imageUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSliderProps {
  slides: any[];
  allProducts: any[];
  allBundles?: any[];
  onQuickView: (product: any) => void;
  onQuickViewBundle?: (bundle: any) => void;
}

export default function HeroSlider({ slides, allProducts, allBundles = [], onQuickView, onQuickViewBundle }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Preload all slide images into browser cache immediately for 0ms slide switching
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    slides.forEach((s) => {
      if (s?.imageUrl) {
        const img = new Image();
        img.src = getFirstImageUrl(s.imageUrl);
      }
    });
  }, [slides]);

  // Auto-play slider every 2 seconds (2000ms as requested)
  useEffect(() => {
    if (!slides || slides.length === 0 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [slides, isHovered]);

  // If slides are not yet loaded, render an instant Skeleton Banner placeholder so top space is reserved instantly
  if (!slides || slides.length === 0) {
    return (
      <section className="relative w-full bg-white border-b border-gray-200 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative aspect-[2/1] sm:aspect-[2.3/1] lg:aspect-[2.5/1] w-full overflow-hidden rounded-xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse shadow-xs" />
        </div>
      </section>
    );
  }

  const currentSlide = slides[currentIndex];
  const linkedProduct = currentSlide?.productId
    ? allProducts.find((p) => p.id === currentSlide.productId)
    : null;

  const linkedBundle = currentSlide?.bundleId
    ? allBundles.find((b) => b.id === currentSlide.bundleId)
    : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleBannerClick = () => {
    if (linkedBundle && onQuickViewBundle) {
      onQuickViewBundle(linkedBundle);
    } else if (linkedProduct) {
      onQuickView(linkedProduct);
    } else {
      const el = document.getElementById('products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full bg-white border-b border-gray-200 py-2 sm:py-3"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pure Image Banner Container */}
        <div
          onClick={handleBannerClick}
          className="relative aspect-[2/1] sm:aspect-[2.3/1] lg:aspect-[2.5/1] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer group border border-gray-200/80 sheen-effect"
        >
          {/* Stacked Slide Images for smooth transition & priority loading */}
          {slides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            const imgUrl = getFirstImageUrl(slide.imageUrl);

            return (
              <img
                key={slide.id || idx}
                src={imgUrl}
                alt={slide.title || 'Hero Banner'}
                loading={idx === 0 ? 'eager' : 'lazy'}
                // @ts-ignore
                fetchpriority={idx === 0 ? 'high' : 'auto'}
                decoding="async"
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.015] ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              />
            );
          })}

          {/* Left Arrow */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 text-gray-800 hover:text-teal-900 bg-white/70 hover:bg-white backdrop-blur-md rounded-full transition-all z-20 shadow-md border border-white/80 active:scale-95"
            title="Өмнөх банер"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 text-gray-800 hover:text-teal-900 bg-white/70 hover:bg-white backdrop-blur-md rounded-full transition-all z-20 shadow-md border border-white/80 active:scale-95"
            title="Дараагийн банер"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Bottom Pagination Dots */}
          <div className="absolute bottom-2 sm:bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all border border-gray-600/40 ${
                  currentIndex === idx ? 'bg-gray-900 scale-110 shadow-xs' : 'bg-gray-400/60 hover:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

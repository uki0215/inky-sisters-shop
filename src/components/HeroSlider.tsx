'use client';

import React, { useState, useEffect } from 'react';
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

  // Auto-play slider every 2 seconds (2000ms as requested)
  useEffect(() => {
    if (!slides || slides.length === 0 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [slides, isHovered]);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const linkedProduct = currentSlide.productId
    ? allProducts.find((p) => p.id === currentSlide.productId)
    : null;

  const linkedBundle = currentSlide.bundleId
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

        {/* Pure Image Banner Container (For custom Canva Banners) */}
        <div
          onClick={handleBannerClick}
          className="relative aspect-[2/1] sm:aspect-[2.3/1] lg:aspect-[2.5/1] w-full overflow-hidden rounded-xl bg-gray-100 shadow-xs cursor-pointer group"
        >
          {/* Canva Banner Image */}
          <img
            src={currentSlide.imageUrl || 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=1400&auto=format&fit=crop&q=80'}
            alt="Hero Banner"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-101"
          />

          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 text-gray-700/70 hover:text-gray-900 transition-colors z-20"
            title="Өмнөх банер"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 text-gray-700/70 hover:text-gray-900 transition-colors z-20"
            title="Дараагийн банер"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* Bottom Pagination Dots */}
          <div className="absolute bottom-2 sm:bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all border border-gray-600/40 ${currentIndex === idx
                    ? 'bg-gray-800 scale-110 shadow-xs'
                    : 'bg-gray-400/60 hover:bg-gray-600'
                  }`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

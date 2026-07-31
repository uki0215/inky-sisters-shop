'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Gift, ArrowRight } from 'lucide-react';

interface PromoModalProps {
  banner: any;
  onExploreDiscounts: () => void;
}

export default function PromoModal({ banner, onExploreDiscounts }: PromoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (banner && banner.active) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [banner]);

  if (!isOpen || !banner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-gray-900 overflow-hidden transform transition-all animate-scaleUp">
        
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-red-500" />
          Онцгой Хямдралын Багц (Promotion)
        </div>

        {/* Banner Image */}
        {banner.imageUrl && (
          <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden mb-4 border border-gray-200 shadow-sm">
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
            {banner.discountCode && (
              <div className="absolute bottom-3 right-3 bg-red-500 text-white px-3 py-1 rounded-md font-mono font-bold text-xs shadow-md">
                Код: {banner.discountCode}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <h3 className="text-xl font-bold text-gray-900 mb-1.5 font-sans leading-snug">
          {banner.title}
        </h3>
        {banner.subtitle && (
          <p className="text-xs text-gray-600 mb-5 leading-relaxed">
            {banner.subtitle}
          </p>
        )}

        {/* Action button */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900"
          >
            Хаах
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onExploreDiscounts();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-md transition-all"
          >
            <Gift className="w-4 h-4" />
            Хямдралтай бараануудыг харах
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { formatMNT } from '@/lib/utils';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';

interface SavedModalProps {
  onQuickView: (product: any) => void;
}

export default function SavedModal({ onQuickView }: SavedModalProps) {
  const { savedItems, toggleSave, isSavedOpen, setIsSavedOpen, addToCart } = useCart();

  if (!isSavedOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-2xl text-gray-900 my-auto animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cherry-50 text-cherry-600 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-cherry-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 font-sans">
                Хадгалсан Бараанууд (Wishlist)
              </h3>
              <p className="text-xs text-gray-500">
                Нийт {savedItems.length} бараа хадгалагдсан байна.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSavedOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {savedItems.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Heart className="w-12 h-12 text-gray-300 mx-auto" />
            <h4 className="font-bold text-gray-800 text-sm">Хадгалсан бараа байхгүй байна</h4>
            <p className="text-xs text-gray-500">
              Та барааны дэлгэрэнгүй цонх болон карт дээрх "Хадгалах" товчийг даран энд хадгалж болно.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-3 hover:border-gray-300 transition-all"
              >
                <div
                  onClick={() => {
                    setIsSavedOpen(false);
                    onQuickView(item);
                  }}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <img
                    src={(() => {
                      const raw = typeof item.imageUrl === 'string' ? item.imageUrl : '';
                      return raw.split(',').map((s: string) => s.trim()).find((s: string) =>
                        s.length > 7 && (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/') || s.startsWith('data:image/'))
                      ) || '/placeholder-product.svg';
                    })()}
                    alt={item.name}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.svg'; }}
                    className="w-14 h-14 object-cover rounded-xl border border-gray-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-1 hover:text-teal-700 font-sans">
                      {item.name}
                    </h5>
                    <span className="text-xs font-extrabold text-red-600 font-sans block mt-0.5">
                      {formatMNT(item.discountPriceMnt || item.priceMnt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      addToCart(item);
                    }}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Сагслах</span>
                  </button>

                  <button
                    onClick={() => toggleSave(item)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Хасах"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

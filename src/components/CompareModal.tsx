'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { formatMNT } from '@/lib/utils';
import { getProductImageUrl } from '@/lib/imageUtils';
import { X, RefreshCw, ShoppingBag, Trash2, Check, Barcode } from 'lucide-react';

interface CompareModalProps {
  onQuickView: (product: any) => void;
}

export default function CompareModal({ onQuickView }: CompareModalProps) {
  const { compareItems, toggleCompare, isCompareOpen, setIsCompareOpen, addToCart } = useCart();

  if (!isCompareOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-2xl text-gray-900 my-auto animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 font-sans">
                Бараа Харгалдуулах (Compare List)
              </h3>
              <p className="text-xs text-gray-500">
                Нийт {compareItems.length} бараа харьцуулагдаж байна.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCompareOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {compareItems.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <RefreshCw className="w-12 h-12 text-gray-300 mx-auto" />
            <h4 className="font-bold text-gray-800 text-sm">Харьцуулах бараа байхгүй байна</h4>
            <p className="text-xs text-gray-500">
              Та барааны дэлгэрэнгүй цонх дээрх "Харьцуулах" товчийг даран бараануудыг зэрэгцүүлж харьцуулна уу.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[65vh] overflow-y-auto p-1">
            {compareItems.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative group hover:border-teal-500 transition-all"
              >
                <button
                  onClick={() => toggleCompare(item)}
                  className="absolute top-3 right-3 p-1.5 bg-white border border-gray-200 rounded-full text-gray-400 hover:text-red-600 transition-all shadow-xs"
                  title="Хасах"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div
                  onClick={() => {
                    setIsCompareOpen(false);
                    onQuickView(item);
                  }}
                  className="cursor-pointer space-y-2"
                >
                  <div className="aspect-square w-full rounded-xl bg-white overflow-hidden border border-gray-200">
                    <img
                      src={getProductImageUrl(item)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <h5 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-teal-700 font-sans">
                    {item.name}
                  </h5>

                  <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                    <Barcode className="w-3.5 h-3.5 text-teal-700" />
                    <span>#{item.barcode}</span>
                  </div>
                </div>

                {/* Spec List */}
                <div className="space-y-1.5 pt-2 border-t border-gray-200 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Үнэ:</span>
                    <span className="font-extrabold text-red-600 font-sans">
                      {formatMNT(item.discountPriceMnt || item.priceMnt)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Үлдэгдэл:</span>
                    <span className="font-bold font-mono text-teal-800">
                      {item.stock > 0 ? `${item.stock} ширхэг` : 'Дууссан'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Ангилал:</span>
                    <span className="font-semibold text-gray-800">
                      {item.category?.name || 'Бичиг хэрэг'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => addToCart(item)}
                  className="w-full py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Сагслах</span>
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

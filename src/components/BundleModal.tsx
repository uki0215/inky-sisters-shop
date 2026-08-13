'use client';

import React from 'react';
import { X, Gift, ShoppingBag, Check, Layers, Sparkles } from 'lucide-react';
import { formatMNT } from '@/lib/utils';
import { getFirstImageUrl, getProductImageUrl } from '@/lib/imageUtils';
import { useCart } from '@/context/CartContext';

interface BundleModalProps {
  bundle: any | null;
  onClose: () => void;
}

export default function BundleModal({ bundle, onClose }: BundleModalProps) {
  const { addBundleToCart } = useCart();
  const [added, setAdded] = React.useState(false);

  if (!bundle) return null;

  const handleAddBundleToCart = () => {
    addBundleToCart(bundle, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="bg-white border border-gray-200 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 p-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
            <Gift className="w-4 h-4 text-amber-400" />
            <span>Онцлох Иж Бүрэн Багц Set</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold font-sans text-white tracking-tight">
            {bundle.name}
          </h3>

          {bundle.description && (
            <p className="text-xs text-teal-100/90 mt-1 line-clamp-2">{bundle.description}</p>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-teal-50/70 p-4 rounded-2xl border border-teal-100">
            <img
              src={bundle.imageUrl ? getFirstImageUrl(bundle.imageUrl) : getProductImageUrl(bundle.items?.[0]?.product)}
              alt={bundle.name}
              className="w-28 h-28 object-cover rounded-xl border border-teal-200 shadow-xs shrink-0"
            />

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-1 bg-cherry-600 text-white font-black text-xs rounded-full font-mono shadow-xs">
                  -{bundle.discountPercent}% ХЯМДРАЛ
                </span>
                <span className="text-xs font-bold text-teal-800 bg-teal-200/80 px-2.5 py-1 rounded-full">
                  Нийт {bundle.items?.length || 0} Төрлийн Бараа
                </span>
              </div>

              <div className="flex items-baseline justify-center sm:justify-start gap-2 pt-1">
                <span className="text-2xl font-black text-cherry-600 font-mono">
                  {formatMNT(bundle.bundlePriceMnt)}
                </span>
                <span className="text-sm font-bold text-gray-400 line-through font-mono">
                  {formatMNT(bundle.originalPriceMnt)}
                </span>
              </div>
            </div>
          </div>

          {/* List of Included Products */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 font-sans border-b border-gray-100 pb-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <span>Багцад Дагалдах Бараануудын Жагсаалт:</span>
            </h4>

            <div className="space-y-2.5">
              {bundle.items?.map((item: any) => {
                const product = item.product;
                if (!product) return null;
                const hasDiscount = product.isDiscounted && product.discountPriceMnt;
                const originalPrice = product.priceMnt;
                const currentPrice = hasDiscount ? product.discountPriceMnt : product.priceMnt;

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-gray-50 border border-gray-200/80 rounded-2xl flex items-center justify-between gap-3 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-xl border border-gray-200 bg-white shrink-0"
                      />
                      <div className="min-w-0">
                        <h5 className="font-bold text-gray-900 text-xs truncate font-sans">{product.name}</h5>
                        <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[11px]">
                          {hasDiscount ? (
                            <>
                              <span className="text-gray-400 line-through">{formatMNT(originalPrice)}</span>
                              <span className="text-red-600 font-extrabold">{formatMNT(currentPrice)}</span>
                              <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                                -{product.discountPercent}%
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-600 font-semibold">Нэгж үнэ: {formatMNT(currentPrice)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 bg-teal-100 text-teal-950 font-bold text-xs rounded-lg font-mono block">
                        × {item.quantity} ш
                      </span>
                      <span className="text-[11px] font-extrabold text-teal-900 font-mono block mt-1">
                        Нийт: {formatMNT(currentPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-extrabold text-xs rounded-xl transition-all"
          >
            Хаах
          </button>

          <button
            onClick={handleAddBundleToCart}
            disabled={added}
            className={`flex-1 py-3 px-6 rounded-xl font-extrabold text-xs text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${added ? 'bg-emerald-600' : 'bg-teal-700 hover:bg-teal-800'
              }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>Сагсанд Нэмэгдлээ!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Бүх Барааг Сагсанд Нэмэх ({formatMNT(bundle.bundlePriceMnt)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { formatMNT } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { Barcode, Heart, RefreshCw } from 'lucide-react';

interface ProductCardProps {
  product: any;
  onQuickView: (product: any) => void;
  showStockQuantity?: boolean;
}

export default function ProductCard({ product, onQuickView, showStockQuantity = true }: ProductCardProps) {
  const { toggleSave, isSaved, toggleCompare, isCompared } = useCart();
  const isOutOfStock = product.stock <= 0;

  const saved = isSaved(product.id);
  const compared = isCompared(product.id);

  const isDiscountExpired = product.discountEndDate ? new Date() > new Date(product.discountEndDate) : false;
  const activeDiscount = product.isDiscounted && !isDiscountExpired;

  const getDiscountExpiryLabel = () => {
    if (!product.discountEndDate) return null;
    const now = new Date();
    const end = new Date(product.discountEndDate);
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return null;

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays >= 1) {
      return `Хямдрал дуусахад ${diffDays} өдөр`;
    } else if (diffHours >= 1) {
      return `Хямдрал дуусахад ${diffHours} цаг`;
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `Хямдрал дуусахад ${Math.max(1, diffMins)} минут`;
    }
  };

  const discountExpiryLabel = activeDiscount ? getDiscountExpiryLabel() : null;

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group relative bg-white border border-gray-200 hover:border-teal-500 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >

      {/* Image Container */}
      <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
        {(() => {
          const raw = typeof product.imageUrl === 'string' ? product.imageUrl : '';
          const firstUrl = raw.split(',').map((s: string) => s.trim()).find((s: string) =>
            s.length > 7 && (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/') || s.startsWith('data:image/'))
          ) || '/placeholder-product.svg';
          return (
            <img
              src={firstUrl}
              alt={product.name}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.svg'; }}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'opacity-40 grayscale' : 'opacity-100'}`}
            />
          );
        })()}

        {/* Top Badges */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
          {activeDiscount && product.discountPercent ? (
            <span className="px-2 py-0.5 bg-red-500 text-white font-extrabold text-[11px] rounded-md shadow-xs">
              -{product.discountPercent}%
            </span>
          ) : null}

          {isOutOfStock && (
            <span className="px-2 py-0.5 bg-gray-800 text-white font-bold text-[10px] uppercase rounded-md shadow-xs">
              Дууссан
            </span>
          )}
        </div>

        {/* Quick Action Overlay Buttons: Wishlist & Compare */}
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCompare(product);
            }}
            className={`p-1.5 rounded-full border shadow-xs transition-all ${compared
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white/90 hover:bg-white text-gray-700 border-gray-200 hover:text-amber-600'
              }`}
            title="Харьцуулах"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSave(product);
            }}
            className={`p-1.5 rounded-full border shadow-xs transition-all ${saved
                ? 'bg-rose-500 text-white border-rose-600'
                : 'bg-white/90 hover:bg-white text-gray-700 border-gray-200 hover:text-rose-600'
              }`}
            title="Хадгалах"
          >
            <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Category tag */}
        {product.category?.name && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 border border-gray-200 text-gray-700 text-[10px] font-semibold rounded-md backdrop-blur-xs">
            {product.category.name}
          </span>
        )}
      </div>

      {/* Details Container */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          {discountExpiryLabel && (
            <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 mb-1.5 shadow-2xs font-mono">
              ⏳ {discountExpiryLabel}
            </div>
          )}

          {/* Product Name */}
          <h4
            className="font-bold text-gray-900 text-xs sm:text-sm group-hover:text-teal-700 cursor-pointer line-clamp-2 leading-snug transition-colors mb-1 font-sans"
          >
            {product.name}
          </h4>

          {/* Barcode code */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400 mb-1">
            <Barcode className="w-3 h-3 text-gray-400" />
            <span>{product.barcode}</span>
          </div>
        </div>

        <div>
          {/* Price Layout */}
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
            <div>
              {isOutOfStock ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-bold">
                  Дууссан
                </span>
              ) : showStockQuantity ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                  Үлдэгдэл: {product.stock}
                </span>
              ) : null}
            </div>

            <div className="text-right ml-auto">
              {activeDiscount && product.discountPriceMnt ? (
                <div className="flex flex-col items-end leading-none">
                  <span className="text-xs text-gray-400 line-through font-bold font-sans mb-0.5">
                    {formatMNT(product.priceMnt)}
                  </span>
                  <span className="text-base sm:text-lg font-black text-red-600 font-sans tracking-tight">
                    {formatMNT(product.discountPriceMnt)}
                  </span>
                </div>
              ) : (
                <span className="text-base sm:text-lg font-black text-gray-900 font-sans tracking-tight">
                  {formatMNT(product.priceMnt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

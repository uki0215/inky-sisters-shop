'use client';

import React, { useState, useRef } from 'react';
import { formatMNT } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { X, ShoppingBag, Barcode, ChevronRight, ChevronLeft, Share2, Heart, RefreshCw, CheckCircle2 } from 'lucide-react';

interface QuickViewModalProps {
  product: any;
  allProducts?: any[];
  onSelectProduct?: (product: any) => void;
  onClose: () => void;
  showStockQuantity?: boolean;
}

export default function QuickViewModal({
  product: initialProduct,
  allProducts = [],
  onSelectProduct,
  onClose,
  showStockQuantity = true,
}: QuickViewModalProps) {
  const { addToCart, toggleSave, isSaved: checkIsSaved, toggleCompare, isCompared: checkIsCompared } = useCart();
  const [currentProduct, setCurrentProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const recommendScrollRef = useRef<HTMLDivElement>(null);

  if (!currentProduct) return null;

  const isOutOfStock = currentProduct.stock <= 0;

  // Filter recommended products
  const recommendedList = allProducts.filter((p) => p.id !== currentProduct.id);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const scrollRecommend = (direction: 'left' | 'right') => {
    if (recommendScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      recommendScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSelectRecommend = (p: any) => {
    setCurrentProduct(p);
    setQuantity(1);
    if (onSelectProduct) onSelectProduct(p);
  };

  // Financial calculations
  const isDiscountExpired = currentProduct?.discountEndDate ? new Date() > new Date(currentProduct.discountEndDate) : false;
  const hasDiscount = Boolean(
    currentProduct?.isDiscounted &&
    !isDiscountExpired &&
    currentProduct?.discountPriceMnt &&
    currentProduct.discountPriceMnt < currentProduct.priceMnt
  );
  const originalPrice = currentProduct?.priceMnt || 0;
  const currentPrice = hasDiscount ? currentProduct.discountPriceMnt : (currentProduct?.priceMnt || 0);
  const savings = hasDiscount ? originalPrice - currentProduct.discountPriceMnt : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(currentProduct);
    }
    showToast('🛒 Сагсанд амжилттай нэмэгдлээ!');
  };

  // 1. Save / Wishlist handler
  const handleToggleSave = () => {
    const nowSaved = toggleSave(currentProduct);
    if (nowSaved) {
      showToast('❤️ Хадгалсан барааны жагсаалтад нэмэгдлээ!');
    } else {
      showToast('♡ Хадгалсан барааны жагсаалтаас хасагдлаа.');
    }
  };

  // 2. Compare handler
  const handleToggleCompare = () => {
    const nowCompared = toggleCompare(currentProduct);
    if (nowCompared) {
      showToast('⚖️ Харьцуулах жагсаалтад нэмэгдлээ!');
    } else {
      showToast('⚖️ Харьцуулах жагсаалтаас хасагдлаа.');
    }
  };

  // 3. Share handler
  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentProduct.name,
          text: `Inky Sisters — ${currentProduct.name}`,
          url: shareUrl,
        });
        showToast('🔗 Бараа амжилттай хуваалцагдлаа!');
      } catch (err) {
        // Fallback copy
        copyLinkToClipboard(shareUrl);
      }
    } else {
      copyLinkToClipboard(shareUrl);
    }
  };

  const copyLinkToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('🔗 Барааны холбоос клипбордод хуулагдлаа!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-gray-200 rounded-3xl p-5 sm:p-8 shadow-2xl text-gray-900 my-auto animate-scaleUp">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full transition-all z-20 hover:bg-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Toast Notification Popup */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-teal-900 text-white font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce border border-teal-700 text-xs">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* TOP RECOMMENDED SLIDER SECTION */}
        {recommendedList.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 sm:p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 font-sans flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
                Танд санал болгох
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollRecommend('left')}
                  className="p-1 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-2xs hover:bg-gray-100 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRecommend('right')}
                  className="p-1 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-2xs hover:bg-gray-100 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              ref={recommendScrollRef}
              className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1 scroll-smooth"
            >
              {recommendedList.map((item) => {
                const itemDiscountExpired = item.discountEndDate ? new Date() > new Date(item.discountEndDate) : false;
                const itemHasDiscount = Boolean(item.isDiscounted && !itemDiscountExpired && item.discountPriceMnt && item.discountPriceMnt < item.priceMnt);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectRecommend(item)}
                    className="shrink-0 w-28 sm:w-36 bg-white border border-gray-200 rounded-xl p-2 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all group"
                  >
                    <div className="aspect-square w-full bg-gray-50 rounded-lg overflow-hidden mb-1.5">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=300&auto=format&fit=crop&q=80'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h5 className="text-[11px] font-bold text-gray-900 line-clamp-1 group-hover:text-teal-700">
                      {item.name}
                    </h5>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={`text-xs font-extrabold font-sans ${itemHasDiscount ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatMNT(itemHasDiscount ? item.discountPriceMnt : item.priceMnt)}
                      </span>
                      {itemHasDiscount && (
                        <span className="text-[9px] text-gray-400 line-through">
                          {formatMNT(item.priceMnt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MAIN PRODUCT DETAILS CONTAINER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
          
          {/* Main Image */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 shadow-sm">
            <img
              src={currentProduct.imageUrl || 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=600&auto=format&fit=crop&q=80'}
              alt={currentProduct.name}
              className={`w-full h-full object-cover ${isOutOfStock ? 'opacity-40 grayscale' : ''}`}
            />
            {hasDiscount && currentProduct.discountPercent && (
              <span className="absolute top-3 left-3 px-3 py-1 bg-red-600 text-white font-black text-xs rounded-xl shadow-md">
                -{currentProduct.discountPercent}% ХЯМДРАЛ
              </span>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 font-bold text-red-600 text-base uppercase shadow-inner">
                Дууссан
              </div>
            )}
          </div>

          {/* Product Details & Actions */}
          <div className="space-y-4">
            <div>
              {currentProduct.category?.name && (
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200 inline-block mb-1">
                  {currentProduct.category.name}
                </span>
              )}
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-sans leading-tight">
                {currentProduct.name}
              </h2>
              
              <div className="flex items-center gap-2 mt-2 text-xs font-mono text-gray-400">
                <Barcode className="w-4 h-4 text-teal-700" />
                <span>Бар код: #{currentProduct.barcode}</span>
              </div>
            </div>

            {currentProduct.description && (
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-200 font-sans">
                {currentProduct.description}
              </p>
            )}

            {/* Price Box with Discount Badges */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500 block uppercase">
                    {hasDiscount ? 'Хямдарсан үнэ' : 'Үнэ'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className={`text-2xl sm:text-3xl font-extrabold font-sans ${hasDiscount ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatMNT(currentPrice)}
                    </span>

                    {hasDiscount && currentProduct.discountPercent && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 font-black text-xs rounded border border-red-200">
                        -{currentProduct.discountPercent}%
                      </span>
                    )}
                  </div>
                </div>

                {hasDiscount && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-500 block uppercase">Анхны үнэ</span>
                    <span className="text-sm text-gray-400 line-through font-bold font-sans">
                      {formatMNT(originalPrice)}
                    </span>
                  </div>
                )}
              </div>

              {hasDiscount && savings > 0 && (
                <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs font-bold text-red-600">
                  <span>Хэмнэлт:</span>
                  <span>{formatMNT(savings)}</span>
                </div>
              )}
            </div>

            {/* Stock status indicator */}
            <div className="flex items-center justify-between text-xs font-bold px-1">
              <span className="text-gray-500">Үлдэгдэл нөөц:</span>
              <span className={`font-mono ${isOutOfStock ? 'text-red-600' : 'text-teal-700'}`}>
                {isOutOfStock
                  ? 'Дууссан (0 ширхэг)'
                  : showStockQuantity
                  ? `${currentProduct.stock} ширхэг бэлэн`
                  : 'Бэлэн байгаа'}
              </span>
            </div>

            {/* Quantity Selector & Add to Cart Button */}
            {!isOutOfStock && (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-700 hover:bg-gray-200 font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-xs font-bold text-gray-900 font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(currentProduct.stock, quantity + 1))}
                    className="px-3 py-2 text-gray-700 hover:bg-gray-200 font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Сагсанд Нэмэх</span>
                </button>
              </div>
            )}

            {/* Action Bar (HARTSUULAH, HADGALAH, HUWAALTSAH NOW FULLY FUNCTIONAL) */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
              <button
                onClick={handleToggleCompare}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                  checkIsCompared(currentProduct.id)
                    ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkIsCompared(currentProduct.id) ? 'text-teal-700 rotate-180' : ''} transition-transform`} />
                <span>{checkIsCompared(currentProduct.id) ? 'Харьцуулж байна' : 'Харьцуулах'}</span>
              </button>

              <button
                onClick={handleToggleSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                  checkIsSaved(currentProduct.id)
                    ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${checkIsSaved(currentProduct.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{checkIsSaved(currentProduct.id) ? 'Хадгалсан' : 'Хадгалах'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-200 transition-all font-semibold"
              >
                <Share2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Хуваалцах</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { formatMNT } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { X, ShoppingBag, Barcode, ChevronRight, ChevronLeft, Share2, Heart, RefreshCw, CheckCircle2, ZoomIn } from 'lucide-react';

interface QuickViewModalProps {
  product: any;
  allProducts?: any[];
  onSelectProduct?: (product: any) => void;
  onClose: () => void;
  showStockQuantity?: boolean;
}

const FALLBACK_IMG = '/placeholder-product.svg';

const isValidUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (t.length < 8) return false;
  return t.startsWith('http://') || t.startsWith('https://') || t.startsWith('/') || t.startsWith('data:image/');
};

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
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const recommendScrollRef = useRef<HTMLDivElement>(null);
  const thumbListRef = useRef<HTMLDivElement>(null);

  if (!currentProduct) return null;

  // Parse images
  const rawImages =
    typeof currentProduct?.imageUrl === 'string' && currentProduct.imageUrl.trim()
      ? currentProduct.imageUrl.split(',').map((s: string) => s.trim()).filter(isValidUrl)
      : [];
  const productImages = rawImages.length > 0 ? rawImages : [FALLBACK_IMG];
  const safeIdx = selectedImgIndex < productImages.length ? selectedImgIndex : 0;
  const mainImgUrl = productImages[safeIdx];

  const isOutOfStock = currentProduct.stock <= 0;
  const recommendedList = allProducts.filter((p) => p.id !== currentProduct.id);

  // Financial calculations
  const isDiscountExpired = currentProduct?.discountEndDate ? new Date() > new Date(currentProduct.discountEndDate) : false;
  const hasDiscount = Boolean(
    currentProduct?.isDiscounted && !isDiscountExpired &&
    currentProduct?.discountPriceMnt && currentProduct.discountPriceMnt < currentProduct.priceMnt
  );
  const originalPrice = currentProduct?.priceMnt || 0;
  const currentPrice = hasDiscount ? currentProduct.discountPriceMnt : (currentProduct?.priceMnt || 0);
  const savings = hasDiscount ? originalPrice - currentProduct.discountPriceMnt : 0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const scrollRecommend = (direction: 'left' | 'right') => {
    if (recommendScrollRef.current) {
      recommendScrollRef.current.scrollBy({ left: direction === 'left' ? -220 : 220, behavior: 'smooth' });
    }
  };

  const handleSelectRecommend = (p: any) => {
    setCurrentProduct(p);
    setQuantity(1);
    setSelectedImgIndex(0);
    if (onSelectProduct) onSelectProduct(p);
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addToCart(currentProduct);
    showToast('🛒 Сагсанд амжилттай нэмэгдлээ!');
  };

  const handleToggleSave = () => {
    const nowSaved = toggleSave(currentProduct);
    showToast(nowSaved ? '❤️ Хадгалсан барааны жагсаалтад нэмэгдлээ!' : '♡ Хадгалсан барааны жагсаалтаас хасагдлаа.');
  };

  const handleToggleCompare = () => {
    const nowCompared = toggleCompare(currentProduct);
    showToast(nowCompared ? '⚖️ Харьцуулах жагсаалтад нэмэгдлээ!' : '⚖️ Харьцуулах жагсаалтаас хасагдлаа.');
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: currentProduct.name, text: `Inky Sisters — ${currentProduct.name}`, url: shareUrl });
        showToast('🔗 Бараа амжилттай хуваалцагдлаа!');
      } catch { navigator.clipboard.writeText(shareUrl); showToast('🔗 Холбоос хуулагдлаа!'); }
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast('🔗 Холбоос хуулагдлаа!');
    }
  };

  const handleMainImgMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbListRef.current) {
      const thumbs = thumbListRef.current.querySelectorAll('button');
      thumbs[safeIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [safeIdx]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-5xl bg-white border border-gray-200 rounded-3xl shadow-2xl text-gray-900 my-auto animate-scaleUp overflow-hidden">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-white/80 backdrop-blur-sm rounded-full transition-all z-30 hover:bg-gray-100 shadow-sm border border-gray-200"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-teal-900 text-white font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce border border-teal-700 text-xs">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Recommended strip - compact horizontal bar on top */}
        {recommendedList.length > 0 && (
          <div className="px-5 pt-5">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
                  Танд санал болгох
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => scrollRecommend('left')} className="p-1 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-all">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => scrollRecommend('right')} className="p-1 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-all">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div ref={recommendScrollRef} className="flex items-center gap-2 overflow-x-auto scrollbar-none scroll-smooth">
                {recommendedList.map((item) => {
                  const expired = item.discountEndDate ? new Date() > new Date(item.discountEndDate) : false;
                  const disc = Boolean(item.isDiscounted && !expired && item.discountPriceMnt && item.discountPriceMnt < item.priceMnt);
                  const firstImg = item.imageUrl ? item.imageUrl.split(',')[0].trim() : '';
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectRecommend(item)}
                      className="shrink-0 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1.5 cursor-pointer hover:border-teal-400 hover:shadow-sm transition-all group"
                    >
                      <div className="w-9 h-9 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={isValidUrl(firstImg) ? firstImg : FALLBACK_IMG}
                          alt={item.name}
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-gray-800 line-clamp-1 group-hover:text-teal-700">{item.name}</p>
                        <p className={`text-[11px] font-extrabold font-sans ${disc ? 'text-red-600' : 'text-gray-700'}`}>
                          {formatMNT(disc ? item.discountPriceMnt : item.priceMnt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── MAIN CONTENT: Amazon-style layout ─── */}
        <div className="flex flex-col md:flex-row gap-0 p-5 pt-4">

          {/* LEFT: Vertical thumbnail strip */}
          {productImages.length > 1 && (
            <div
              ref={thumbListRef}
              className="flex md:flex-col gap-2 md:gap-2 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden shrink-0 md:w-[72px] md:max-h-[480px] pb-1 md:pb-0 md:pr-1 scrollbar-none"
            >
              {productImages.map((img: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImgIndex(idx)}
                  className={`shrink-0 w-14 h-14 md:w-full md:aspect-square rounded-xl overflow-hidden border-2 transition-all
                    ${safeIdx === idx
                      ? 'border-teal-600 ring-2 ring-teal-400/30 shadow-sm'
                      : 'border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-300'}`}
                >
                  <img
                    src={img}
                    alt={`Зураг ${idx + 1}`}
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* CENTER: Main image with zoom */}
          <div className="flex-1 md:px-4">
            <div
              className={`relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm
                ${productImages.length <= 1 ? 'aspect-square' : 'aspect-square'}`}
              style={{ cursor: zoom ? 'zoom-in' : 'zoom-in' }}
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
              onMouseMove={handleMainImgMouseMove}
            >
              <img
                src={mainImgUrl}
                alt={currentProduct.name}
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                className={`w-full h-full object-cover transition-transform duration-300 ${isOutOfStock ? 'opacity-40 grayscale' : ''} ${zoom ? 'scale-150' : 'scale-100'}`}
                style={zoom ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
              />

              {/* Badges */}
              {hasDiscount && currentProduct.discountPercent && (
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-red-600 text-white font-black text-[11px] rounded-xl shadow-md z-10">
                  -{currentProduct.discountPercent}% ХЯМДРАЛ
                </span>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 font-bold text-red-600 text-base uppercase">
                  Дууссан
                </div>
              )}

              {/* Zoom hint */}
              {!zoom && (
                <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm text-gray-500 text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 shadow-xs border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <ZoomIn className="w-3 h-3" /> Томруулах
                </div>
              )}

              {/* Image counter */}
              {productImages.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  {productImages.map((_: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImgIndex(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === safeIdx ? 'bg-teal-600 w-4' : 'bg-gray-300 hover:bg-gray-400'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Arrow navigation for mobile */}
            {productImages.length > 1 && (
              <div className="flex items-center justify-between mt-2 md:hidden">
                <button
                  onClick={() => setSelectedImgIndex(Math.max(0, safeIdx - 1))}
                  disabled={safeIdx === 0}
                  className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-xs text-gray-400 font-mono">{safeIdx + 1} / {productImages.length}</span>
                <button
                  onClick={() => setSelectedImgIndex(Math.min(productImages.length - 1, safeIdx + 1))}
                  disabled={safeIdx === productImages.length - 1}
                  className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Product details panel */}
          <div className="md:w-[320px] lg:w-[360px] shrink-0 space-y-4">

            {/* Category + Title + Barcode */}
            <div>
              {currentProduct.category?.name && (
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 inline-block mb-1.5">
                  {currentProduct.category.name}
                </span>
              )}
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">
                {currentProduct.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-gray-400">
                <Barcode className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Бар код: #{currentProduct.barcode}</span>
              </div>
            </div>

            {/* Description */}
            {currentProduct.description && (
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
                {currentProduct.description}
              </p>
            )}

            {/* Price box */}
            <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                {hasDiscount ? 'Хямдарсан үнэ' : 'Үнэ'}
              </span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`text-2xl sm:text-3xl font-extrabold font-sans ${hasDiscount ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatMNT(currentPrice)}
                </span>
                {hasDiscount && currentProduct.discountPercent && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 font-black text-[11px] rounded border border-red-200">
                    -{currentProduct.discountPercent}%
                  </span>
                )}
              </div>
              {hasDiscount && (
                <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-2">
                  <span className="text-gray-400 font-medium line-through">{formatMNT(originalPrice)}</span>
                  {savings > 0 && <span className="text-red-600 font-bold">-{formatMNT(savings)} хэмнэлт</span>}
                </div>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-gray-500 font-medium">Үлдэгдэл нөөц:</span>
              <span className={`font-bold font-mono ${isOutOfStock ? 'text-red-600' : 'text-teal-700'}`}>
                {isOutOfStock
                  ? 'Дууссан (0 ш)'
                  : showStockQuantity
                  ? `${currentProduct.stock} ширхэг бэлэн`
                  : 'Бэлэн байгаа'}
              </span>
            </div>

            {/* Quantity + Add to Cart */}
            {!isOutOfStock && (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2.5 text-gray-700 hover:bg-gray-200 font-bold text-sm">-</button>
                  <span className="px-3 py-2.5 text-sm font-bold text-gray-900 font-mono min-w-[32px] text-center">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(currentProduct.stock, quantity + 1))} className="px-3 py-2.5 text-gray-700 hover:bg-gray-200 font-bold text-sm">+</button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Сагсанд Нэмэх</span>
                </button>
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
              <button
                onClick={handleToggleCompare}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-[11px] font-bold transition-all ${
                  checkIsCompared(currentProduct.id)
                    ? 'bg-teal-50 border-teal-300 text-teal-800'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkIsCompared(currentProduct.id) ? 'text-teal-700' : ''}`} />
                Харьцуулах
              </button>

              <button
                onClick={handleToggleSave}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-[11px] font-bold transition-all ${
                  checkIsSaved(currentProduct.id)
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${checkIsSaved(currentProduct.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                {checkIsSaved(currentProduct.id) ? 'Хадгалсан' : 'Хадгалах'}
              </button>

              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 transition-all text-[11px] font-bold"
              >
                <Share2 className="w-3.5 h-3.5 text-teal-600" />
                Хуваалцах
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

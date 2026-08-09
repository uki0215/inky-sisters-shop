'use client';

import React, { useState, useRef, useEffect } from 'react';
import { formatMNT } from '@/lib/utils';
import { parseImageUrls, getFirstImageUrl } from '@/lib/imageUtils';
import { useCart } from '@/context/CartContext';
import {
  X,
  ShoppingBag,
  Barcode,
  ChevronRight,
  ChevronLeft,
  Share2,
  Heart,
  RefreshCw,
  CheckCircle2,
  ZoomIn,
  Plus,
  Trash2,
  Truck,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface QuickViewModalProps {
  product: any;
  allProducts?: any[];
  onSelectProduct?: (product: any) => void;
  onClose: () => void;
  showStockQuantity?: boolean;
}

interface SelectedVariant {
  imageUrl: string;
  quantity: number;
  imageIndex: number;
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
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariant[]>([]);

  const recommendScrollRef = useRef<HTMLDivElement>(null);
  const thumbListRef = useRef<HTMLDivElement>(null);

  // Reset selected variants when product changes
  useEffect(() => {
    setSelectedVariants([]);
    setQuantity(1);
    setSelectedImgIndex(0);
  }, [currentProduct?.id]);

  if (!currentProduct) return null;

  // Parse images
  const rawImages = parseImageUrls(currentProduct?.imageUrl);
  const productImages = rawImages.length > 0 ? rawImages : [FALLBACK_IMG];
  const safeIdx = selectedImgIndex < productImages.length ? selectedImgIndex : 0;
  const mainImgUrl = productImages[safeIdx];

  // Stock & Financial calculations
  const totalSelectedVariantsQty = selectedVariants.reduce((sum, v) => sum + v.quantity, 0);
  const remainingStock = Math.max(0, currentProduct.stock - totalSelectedVariantsQty);
  const isOutOfStock = currentProduct.stock <= 0;
  const isMaxStockReached = remainingStock <= 0;
  const recommendedList = allProducts.filter((p) => p.id !== currentProduct.id);

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
      recommendScrollRef.current.scrollBy({ left: direction === 'left' ? -270 : 270, behavior: 'smooth' });
    }
  };

  const handleSelectRecommend = (p: any) => {
    setCurrentProduct(p);
    if (onSelectProduct) onSelectProduct(p);
  };

  // Add currently previewed image variant to selection
  const handleAddVariant = (imgUrl: string, imgIdx: number) => {
    if (remainingStock <= 0) {
      showToast('⚠️ Уучлаарай, барааны үлдэгдэл нөөц хүрэлцэхгүй байна.');
      return;
    }

    setSelectedVariants((prev) => {
      const existingIndex = prev.findIndex((v) => v.imageUrl === imgUrl);
      if (existingIndex >= 0) {
        return prev.map((v, i) =>
          i === existingIndex ? { ...v, quantity: v.quantity + 1 } : v
        );
      } else {
        return [...prev, { imageUrl: imgUrl, quantity: 1, imageIndex: imgIdx }];
      }
    });

    showToast(`✨ Зураг #${imgIdx + 1} сонголтонд нэмэгдлээ!`);
  };

  // Update quantity of a selected image variant
  const handleUpdateVariantQty = (imgUrl: string, delta: number) => {
    if (delta > 0 && remainingStock <= 0) {
      showToast('⚠️ Барааны үлдэгдэл нөөц хүрэлцэхгүй байна.');
      return;
    }

    setSelectedVariants((prev) =>
      prev
        .map((v) => {
          if (v.imageUrl === imgUrl) {
            const newQty = v.quantity + delta;
            return newQty > 0 ? { ...v, quantity: newQty } : null;
          }
          return v;
        })
        .filter(Boolean) as SelectedVariant[]
    );
  };

  // Remove a selected image variant
  const handleRemoveVariant = (imgUrl: string) => {
    setSelectedVariants((prev) => prev.filter((v) => v.imageUrl !== imgUrl));
  };

  // Add all to cart
  const handleAddToCart = () => {
    if (selectedVariants.length > 0) {
      selectedVariants.forEach((variant) => {
        addToCart(
          currentProduct,
          variant.quantity,
          variant.imageUrl !== FALLBACK_IMG ? variant.imageUrl : null
        );
      });
      showToast(`🛒 Сонгосон ${selectedVariants.length} төрлийн нийт ${totalSelectedVariantsQty} ш бараа сагсанд амжилттай нэмэгдлээ!`);
      setSelectedVariants([]);
    } else {
      addToCart(
        currentProduct,
        quantity,
        mainImgUrl !== FALLBACK_IMG ? mainImgUrl : null
      );
      showToast('🛒 Сагсанд амжилттай нэмэгдлээ!');
    }
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

        {/* Recommended strip - Premium e-commerce carousel on top */}
        {recommendedList.length > 0 && (
          <div className="px-5 pt-4 pr-16">
            <div className="bg-gradient-to-r from-teal-50/80 via-white to-gray-50 border border-teal-100/90 rounded-2xl p-3 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between pr-2">
                <span className="text-xs sm:text-sm font-black text-teal-950 flex items-center gap-1.5 font-sans">
                  <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
                  <span>Танд санал болгох цуглуулга</span>
                  <span className="text-xs font-mono font-extrabold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-200">
                    {recommendedList.length}
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollRecommend('left')}
                    className="p-1.5 text-gray-600 hover:text-gray-950 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-all shadow-2xs"
                    title="Өмнөх"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollRecommend('right')}
                    className="p-1.5 text-gray-600 hover:text-gray-950 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-all shadow-2xs"
                    title="Дараагийн"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div ref={recommendScrollRef} className="flex items-center gap-3 overflow-x-auto scrollbar-none scroll-smooth py-1">
                {recommendedList.map((item) => {
                  const expired = item.discountEndDate ? new Date() > new Date(item.discountEndDate) : false;
                  const disc = Boolean(item.isDiscounted && !expired && item.discountPriceMnt && item.discountPriceMnt < item.priceMnt);
                  const firstImg = getFirstImageUrl(item.imageUrl, '');

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectRecommend(item)}
                      className="shrink-0 flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-2.5 cursor-pointer hover:border-teal-500 hover:shadow-lg transition-all group max-w-[240px] sm:max-w-[260px]"
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 relative shadow-2xs">
                        <img
                          src={isValidUrl(firstImg) ? firstImg : FALLBACK_IMG}
                          alt={item.name}
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {disc && item.discountPercent && (
                          <span className="absolute top-0.5 left-0.5 px-1 py-0.2 bg-red-600 text-white text-[9px] font-black rounded shadow-xs">
                            -{item.discountPercent}%
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs sm:text-sm font-extrabold text-gray-900 line-clamp-1 group-hover:text-teal-700 transition-colors">
                          {item.name}
                        </p>
                        <div className="flex items-baseline gap-1.5 font-sans">
                          <span className={`text-xs sm:text-sm font-black ${disc ? 'text-red-600' : 'text-emerald-700'}`}>
                            {formatMNT(disc ? item.discountPriceMnt : item.priceMnt)}
                          </span>
                          {disc && (
                            <span className="text-[10px] text-emerald-700 line-through font-bold">
                              {formatMNT(item.priceMnt)}
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 group-hover:underline pt-0.5">
                          Үзэх →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── MAIN CONTENT ─── */}
        <div className="flex flex-col md:flex-row gap-0 p-5 pt-4">

          {/* LEFT: Vertical thumbnail strip */}
          {productImages.length > 1 && (
            <div
              ref={thumbListRef}
              className="flex md:flex-col gap-2 md:gap-2 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden shrink-0 md:w-[72px] md:max-h-[480px] pb-1 md:pb-0 md:pr-1 scrollbar-none"
            >
              {productImages.map((img: string, idx: number) => {
                const isSelectedInList = selectedVariants.some((v) => v.imageUrl === img);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImgIndex(idx)}
                    className={`relative shrink-0 w-14 h-14 md:w-full md:aspect-square rounded-xl overflow-hidden border-2 transition-all group
                      ${safeIdx === idx
                        ? 'border-teal-600 ring-2 ring-teal-400/30 shadow-sm'
                        : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300'}`}
                  >
                    <img
                      src={img}
                      alt={`Зураг ${idx + 1}`}
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                      className="w-full h-full object-cover"
                    />
                    {isSelectedInList && (
                      <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* CENTER: Main image with zoom & variant selection button */}
          <div className="flex-1 md:px-4">
            <div
              className="relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm aspect-square group"
              style={{ cursor: 'zoom-in' }}
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

              {/* Discount Badge */}
              {hasDiscount && currentProduct.discountPercent && (
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-red-600 text-white font-black text-[11px] rounded-xl shadow-md z-10">
                  -{currentProduct.discountPercent}% ХЯМДРАЛ
                </span>
              )}

              {/* TOP RIGHT: Select / Add Variant Button */}
              {!isOutOfStock && productImages.length >= 1 && (
                <button
                  type="button"
                  disabled={isMaxStockReached}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddVariant(mainImgUrl, safeIdx);
                  }}
                  className={`absolute top-3 right-3 px-3 py-2 rounded-xl text-xs font-extrabold shadow-lg z-20 flex items-center gap-1.5 transition-all active:scale-95 border cursor-pointer ${
                    isMaxStockReached
                      ? 'bg-gray-100/90 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 hover:shadow-xl'
                  }`}
                  title="Энэ зургийн сонголтыг жагсаалтанд нэмэх"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>+ Сонгох</span>
                </button>
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
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
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
          <div className="md:w-[320px] lg:w-[360px] shrink-0 space-y-3">

            {/* Category + Title + Barcode */}
            <div>
              {currentProduct.category?.name && (
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 inline-block mb-1">
                  {currentProduct.category.name}
                </span>
              )}
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">
                {currentProduct.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-gray-400">
                <Barcode className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Бар код: #{currentProduct.barcode}</span>
              </div>
            </div>

            {/* Description */}
            {currentProduct.description && (
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                {currentProduct.description}
              </p>
            )}

            {/* Sleek Inline Price Card (No empty space on right, crossed-out original price in GREEN) */}
            <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  {hasDiscount ? 'Хямдарсан тусгай үнэ' : 'Худалдаалах үнэ'}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className={`text-xl sm:text-2xl font-black font-sans tracking-tight ${hasDiscount ? 'text-red-600' : 'text-emerald-700'}`}>
                    {formatMNT(currentPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs sm:text-sm font-bold font-sans text-emerald-700 line-through">
                      {formatMNT(originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              {hasDiscount && currentProduct.discountPercent && (
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 bg-red-600 text-white font-black text-xs rounded-xl shadow-xs block font-mono">
                    -{currentProduct.discountPercent}% OFF
                  </span>
                  {savings > 0 && (
                    <span className="text-[10px] text-red-600 font-extrabold block mt-0.5">
                      -{formatMNT(savings)} хэмнэлт
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 3 Trust & Delivery Guarantee Feature Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-2 text-center flex flex-col items-center justify-center space-y-0.5">
                <Truck className="w-4 h-4 text-teal-700" />
                <span className="text-[10px] font-extrabold text-gray-900 leading-tight block">Шуурхай хүргэлт</span>
                <span className="text-[9px] text-gray-500 block leading-tight">24-48 цагт</span>
              </div>
              <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-2 text-center flex flex-col items-center justify-center space-y-0.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span className="text-[10px] font-extrabold text-gray-900 leading-tight block">100% Оригинал</span>
                <span className="text-[9px] text-gray-500 block leading-tight">Чанарын баталгаа</span>
              </div>
              <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-2 text-center flex flex-col items-center justify-center space-y-0.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                <span className="text-[10px] font-extrabold text-gray-900 leading-tight block">Найдвартай</span>
                <span className="text-[9px] text-gray-500 block leading-tight">Баталгаат төлбөр</span>
              </div>
            </div>

            {/* ─── Selected Image Variants List Box ─── */}
            {selectedVariants.length > 0 && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    Сонгосон төрлүүд ({selectedVariants.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedVariants([])}
                    className="text-[10px] font-bold text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Бүгдийг арилгах
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                  {selectedVariants.map((v) => (
                    <div
                      key={v.imageUrl}
                      className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={v.imageUrl}
                          alt={`Variant ${v.imageIndex + 1}`}
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                          className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-200"
                        />
                        <div className="min-w-0">
                          <p className="font-extrabold text-gray-900 text-[11px] truncate">
                            Зураг #{v.imageIndex + 1}
                          </p>
                          <p className="font-mono text-[10px] text-emerald-800 font-bold">
                            {formatMNT(currentPrice)}/ш
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Quantity control */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 text-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateVariantQty(v.imageUrl, -1)}
                            className="px-2 py-0.5 text-gray-700 hover:bg-gray-200 font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 font-bold text-gray-900 font-mono text-[11px]">
                            {v.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateVariantQty(v.imageUrl, 1)}
                            className="px-2 py-0.5 text-gray-700 hover:bg-gray-200 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-black text-gray-950 font-mono text-xs min-w-[50px] text-right">
                          {formatMNT(v.quantity * currentPrice)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.imageUrl)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Хасах"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1.5 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700">Нийт сонгосон:</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-800 text-xs mr-2">
                      {totalSelectedVariantsQty} ширхэг
                    </span>
                    <span className="font-black font-sans text-emerald-950 text-sm">
                      {formatMNT(totalSelectedVariantsQty * currentPrice)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Dynamic Stock Reserve Indicator */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-gray-500 font-medium">Үлдэгдэл нөөц:</span>
              <span className={`font-bold font-mono ${isOutOfStock || isMaxStockReached ? 'text-red-600' : 'text-teal-700'}`}>
                {isOutOfStock
                  ? 'Дууссан (0 ш)'
                  : showStockQuantity
                  ? `${remainingStock} ширхэг бэлэн`
                  : 'Бэлэн байгаа'}
              </span>
            </div>

            {/* Quantity + Add to Cart Button */}
            {!isOutOfStock && (
              <div className="flex items-center gap-2.5">
                {selectedVariants.length === 0 && (
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2.5 text-gray-700 hover:bg-gray-200 font-bold text-sm">-</button>
                    <span className="px-3 py-2.5 text-sm font-bold text-gray-900 font-mono min-w-[32px] text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(remainingStock, quantity + 1))} className="px-3 py-2.5 text-gray-700 hover:bg-gray-200 font-bold text-sm">+</button>
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  disabled={selectedVariants.length === 0 && isMaxStockReached}
                  className={`flex-1 py-3 px-4 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 ${
                    selectedVariants.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-teal-700 hover:bg-teal-800'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {selectedVariants.length > 0
                      ? `Сонгосон (${totalSelectedVariantsQty} ш) Сагсанд Нэмэх — ${formatMNT(totalSelectedVariantsQty * currentPrice)}`
                      : 'Сагсанд Нэмэх'}
                  </span>
                </button>
              </div>
            )}

            {/* Action Bar: 3 buttons (Харьцуулах, Хадгалах, Хуваалцах) directly at the bottom */}
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

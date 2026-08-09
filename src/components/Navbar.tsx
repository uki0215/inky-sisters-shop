'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatMNT } from '@/lib/utils';
import { getFirstImageUrl } from '@/lib/imageUtils';
import { ShoppingBag, Search, Tag, Sparkles, Menu, ChevronDown, ChevronRight, ChevronLeft, PenTool, BookOpen, Brush, Briefcase, GraduationCap, Grid, Heart, RefreshCw, Eye, ArrowRight, Truck } from 'lucide-react';

interface NavbarProps {
  categories: any[];
  activeCategory: string;
  onSelectCategory: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  logoUrl?: string;
  products?: any[];
  onQuickView?: (product: any) => void;
  onOpenDelivery?: () => void;
  onHomeClick?: () => void;
}

export default function Navbar({
  categories,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  logoUrl,
  products = [],
  onQuickView,
  onOpenDelivery,
  onHomeClick,
}: NavbarProps) {
  const {
    totalItems,
    setIsCartOpen,
    savedItems,
    setIsSavedOpen,
    compareItems,
    setIsCompareOpen,
  } = useCart();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<any>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter ONLY main categories (where parentId is null), exclude "Бусад", "Ангилалгүй" / empty names
  const mainCategories = useMemo(() => {
    return (categories || []).filter((c) => {
      if (c.parentId) return false; // must be top-level
      const name = (c.name || '').trim();
      if (!name) return false; // skip unnamed
      const lower = name.toLowerCase();
      if (name === 'Бусад' || lower === 'other' || lower === 'uncategorized' || name.includes('Ангилалгүй') || lower.includes('бусад')) return false;
      return true;
    });
  }, [categories]);

  // Dynamic feature showcase product for hovered category in Mega Menu
  const showcaseProduct = useMemo(() => {
    if (!products || products.length === 0) return null;
    const currentCat = hoveredCategory || { slug: 'all' };
    if (currentCat.slug === 'all') return products[0];

    const catProds = products.filter(
      (p) =>
        p.categoryId === currentCat.id ||
        p.category?.id === currentCat.id ||
        p.category?.slug === currentCat.slug ||
        p.category?.parentId === currentCat.id
    );

    return catProds.length > 0 ? catProds[0] : products[0];
  }, [products, hoveredCategory]);

  // Live real-time search results filtering
  const liveSearchResults = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length === 0) return [];
    const q = searchQuery.toLowerCase().trim();
    return (products || []).filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const scrollPills = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Close mega menu and search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setIsMegaMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Category Icon map helper
  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'PenTool': return <PenTool className="w-4 h-4" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4" />;
      case 'Brush': return <Brush className="w-4 h-4" />;
      case 'Briefcase': return <Briefcase className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  // Subcategories mapping generator
  const subCategoryMap: Record<string, string[]> = {
    'pens-markers': ['Пастел Үзэг (Pastel Pens)', 'Майлдлайнер (Highlighters)', 'Гелин үзэг (Gel Pens)', 'Каллиграф багс (Calligraphy)', 'Бичгийн гар болон Ниб'],
    'notebooks-planners': ['Bullet Journal Дэвтэр', 'Аарьсан хавтастай дэвтэр', 'Спиральтай дэвтэр', 'Тодотгогч стикер (Sticky Notes)', 'Планер & Төлөвлөгч'],
    'art-drawing': ['Усан будаг & Багс', 'Эскиз дэвтэр (Sketchbook)', 'Өнгөт харандаа', 'Акрилик будаг', 'Мольберт & Хавтас'],
    'office-supplies': ['Үдэгч & Үдээс', 'Хайч & Тайрагч', 'Бичгийн цаас', 'Файл хавтас', 'Оффис органайзер'],
    'school-supplies': ['Үүргэвч & Пенал', 'Шөнө гэрэлтэгч шугам', 'Баллуур & Ирлэгч', 'Цавуу ба Скоч', 'Эхний ангийн багц'],
  };

  const defaultCategory = categories[0] || {
    id: 'pens',
    name: 'Үзэг & Маркер',
    slug: 'pens-markers',
  };

  const activeHover = hoveredCategory || defaultCategory;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 text-gray-900 shadow-sm relative">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={megaMenuRef}>
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo with uploaded Inky Sisters Badge */}
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={(e) => {
              setIsMegaMenuOpen(false);
              if (onHomeClick) {
                onHomeClick();
              } else {
                onSelectCategory('all');
              }
            }}
          >
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Inky Sisters Logo"
                className="w-14 h-14 object-contain transition-transform hover:scale-105"
              />
            )}
            <div>
              <span className="text-xl font-bold tracking-tight text-teal-950 block leading-none font-sans">
                INKY SISTERS
              </span>
              <span className="text-[10px] font-mono tracking-widest text-teal-700 uppercase block mt-1">
                Stationery &amp; Art Shop
              </span>
            </div>
          </Link>

          {/* Search Bar with Real-time Live Search */}
          <div className="flex-1 max-w-xl hidden md:block" ref={searchContainerRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Барааны нэр эсвэл Бар кодоор хайх (Scan)..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setIsSearchFocused(true);
                }}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    onSearchChange('');
                    setIsSearchFocused(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700"
                >
                  Арилгах
                </button>
              )}

              {/* REAL-TIME INSTANT SEARCH DROPDOWN */}
              {isSearchFocused && searchQuery.trim() !== '' && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-50 animate-fadeIn space-y-1">
                  <div className="bg-teal-50/70 px-4 py-2 border-b border-teal-100 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-teal-900 flex items-center gap-1.5 font-sans">
                      <Search className="w-3.5 h-3.5 text-teal-700" />
                      Шууд хайлтын илэрц ({liveSearchResults.length})
                    </span>
                    <span className="text-[10px] text-teal-700 font-bold">Real-time live search</span>
                  </div>

                  {liveSearchResults.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500 font-sans">
                      "{searchQuery}" хайлтад тохирох бараа олдсонгүй.
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                      {liveSearchResults.slice(0, 6).map((product) => (
                        <div
                          key={product.id}
                          onClick={() => {
                            if (onQuickView) onQuickView(product);
                            setIsSearchFocused(false);
                          }}
                          className="p-3 hover:bg-teal-50/60 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                              <img
                                src={getFirstImageUrl(product.imageUrl)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-black text-gray-900 group-hover:text-teal-950 truncate font-sans">
                                {product.name}
                              </h5>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-mono text-gray-500">
                                  #{product.barcode}
                                </span>
                                {product.stock > 0 ? (
                                  <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                                    Бэлэн: {product.stock}ш
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">
                                    Дууссан
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-red-600 font-sans block">
                              {formatMNT(
                                product.isDiscounted && product.discountPriceMnt
                                  ? product.discountPriceMnt
                                  : product.priceMnt
                              )}
                            </span>
                            <span className="text-[10px] font-bold text-teal-700 group-hover:underline flex items-center gap-0.5 justify-end mt-0.5">
                              Үзэх <Eye className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {liveSearchResults.length > 0 && (
                    <button
                      onClick={() => {
                        setIsSearchFocused(false);
                      }}
                      className="w-full py-2.5 bg-gray-50 hover:bg-teal-700 hover:text-white border-t border-gray-100 text-xs font-extrabold text-teal-800 transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      <span>Бүх {liveSearchResults.length} барааг доош харах</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: Compare, Saved (Wishlist), Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Compare Button */}
            <button
              onClick={() => setIsCompareOpen(true)}
              className="relative p-2.5 sm:px-3.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all flex items-center gap-1.5 active:scale-95 border border-gray-200"
              title="Харьцуулах"
            >
              <RefreshCw className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold hidden lg:inline">Харьцуулах</span>
              {compareItems.length > 0 && (
                <span className="bg-teal-700 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {compareItems.length}
                </span>
              )}
            </button>

            {/* Saved / Wishlist Button */}
            <button
              onClick={() => setIsSavedOpen(true)}
              className="relative p-2.5 sm:px-3.5 sm:py-2 bg-cherry-50 hover:bg-cherry-100 text-cherry-700 rounded-full transition-all flex items-center gap-1.5 active:scale-95 border border-cherry-200"
              title="Хадгалсан бүтээгдэхүүнүүд"
            >
              <Heart className="w-4 h-4 text-cherry-600 fill-cherry-600" />
              <span className="hidden sm:inline font-bold text-xs">Хадгалсан</span>
              {savedItems.length > 0 && (
                <span className="bg-cherry-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {savedItems.length}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-full shadow-sm transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              <span className="text-xs font-extrabold hidden sm:inline">Сагс</span>
              {totalItems > 0 && (
                <span className="bg-amber-400 text-teal-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Бараа эсвэл Бар кодоор хайх..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-900 focus:bg-white"
            />
          </div>
        </div>

        {/* Navigation Bar with Mega Menu Trigger & Delivery Button */}
        <div className="py-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Mega Menu Button */}
            <button
              onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm shrink-0 flex-1 sm:flex-none"
            >
              <Menu className="w-4 h-4" />
              <span>БҮХ АНГИЛАЛ</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Bundles Navigation Button (SAME TEAL COLOR AS MEGA MENU) */}
            <button
              onClick={() => {
                onSelectCategory('bundles');
                setIsMegaMenuOpen(false);
              }}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg flex items-center justify-center transition-all shadow-sm shrink-0 active:scale-95 flex-1 sm:flex-none ${
                activeCategory === 'bundles'
                  ? 'bg-teal-800 text-white shadow-md ring-2 ring-teal-600'
                  : 'bg-teal-700 hover:bg-teal-800 text-white'
              }`}
            >
              <span>ИЖ БҮРЭН БАГЦ</span>
            </button>
          </div>

          {/* Delivery Terms & Zone Map Button (Full-width on Mobile, Auto on Desktop) */}
          {onOpenDelivery && (
            <button
              onClick={() => {
                onOpenDelivery();
                setIsMegaMenuOpen(false);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-black whitespace-nowrap transition-all flex items-center justify-center gap-1.5 bg-cherry-600 hover:bg-cherry-700 text-white border border-cherry-500 shadow-xs shrink-0 active:scale-95"
            >
              <span>Хүргэлтийн Нөхцөл &amp; Бүс</span>
            </button>
          )}
        </div>

        {/* EXPANDABLE MEGA MENU FLYOUT PANEL (Matching screenshot design!) */}
        {isMegaMenuOpen && (
          <div
            className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-2xl z-50 animate-fadeIn"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white rounded-2xl p-2">
                
                {/* Column 1: Left Categories List (Hoverable) */}
                <div className="md:col-span-1 border-r border-gray-100 pr-4 space-y-1">
                  <span className="text-[11px] font-mono uppercase font-bold text-gray-400 px-3 block mb-2">
                    Дэлгүүрийн Ангилалууд
                  </span>
                  
                  <button
                    onMouseEnter={() => setHoveredCategory({ name: 'Бүх Ангилал', slug: 'all' })}
                    onClick={() => {
                      setIsMegaMenuOpen(false);
                      onSelectCategory('all');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                      activeHover?.slug === 'all'
                        ? 'bg-teal-50 text-teal-900 border border-teal-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-teal-700" />
                      <span>Бүх Бараанууд</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {mainCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onMouseEnter={() => setHoveredCategory(cat)}
                      onClick={() => {
                        setIsMegaMenuOpen(false);
                        onSelectCategory(cat.slug);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                        activeHover?.slug === cat.slug
                          ? 'bg-teal-50 text-teal-900 border border-teal-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {getCategoryIcon(cat.icon)}
                        <span>{cat.name}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  ))}
                </div>

                {/* Column 2 & 3: Middle Subcategories list for Hovered Category */}
                <div className="md:col-span-2 px-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                      <span>{activeHover?.name || 'Сонгосон Ангилал'}</span>
                    </h4>
                    <button
                      onClick={() => {
                        onSelectCategory(activeHover?.slug || 'all');
                        setIsMegaMenuOpen(false);
                      }}
                      className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                    >
                      Бүгдийг үзэх <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {activeHover?.children && activeHover.children.length > 0 ? (
                      activeHover.children
                        .filter((sub: any) => {
                          const name = (sub.name || '').trim();
                          if (!name) return false;
                          const lower = name.toLowerCase();
                          if (name === 'Бусад' || lower === 'other' || lower === 'uncategorized' || name.includes('Ангилалгүй') || lower.includes('бусад')) return false;
                          return true;
                        })
                        .map((sub: any) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            onSelectCategory(sub.slug || sub.id);
                            onSearchChange('');
                            setIsMegaMenuOpen(false);
                          }}
                          className="text-left p-2.5 rounded-xl bg-gray-50 hover:bg-teal-50 hover:border-teal-200 border border-gray-100 transition-all text-xs font-semibold text-gray-700 hover:text-teal-900 flex items-center justify-between group"
                        >
                          <span>{sub.name}</span>
                          <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-teal-700" />
                        </button>
                      ))
                    ) : (
                      (subCategoryMap[activeHover?.slug] || [
                        'Үдэгч & Үдээс',
                        'Хайч & Тайрагч',
                        'Бичгийн цаас',
                        'Файл хавтас',
                        'Оффис органайзер',
                      ]).map((subItem: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => {
                            onSearchChange(subItem.split(' ')[0]);
                            onSelectCategory(activeHover?.slug || 'all');
                            setIsMegaMenuOpen(false);
                          }}
                          className="text-left p-2.5 rounded-xl bg-gray-50 hover:bg-teal-50 hover:border-teal-200 border border-gray-100 transition-all text-xs font-semibold text-gray-700 hover:text-teal-900 flex items-center justify-between group"
                        >
                          <span>{subItem}</span>
                          <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-teal-700" />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Column 4: Right Feature Showcase Product Card */}
                {showcaseProduct && (
                  <div className="md:col-span-1 pl-2">
                    <div
                      onClick={() => {
                        if (onQuickView) onQuickView(showcaseProduct);
                        setIsMegaMenuOpen(false);
                      }}
                      className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-gray-900 shadow-md group cursor-pointer border border-gray-200"
                    >
                      <img
                        src={getFirstImageUrl(showcaseProduct.imageUrl)}
                        alt={showcaseProduct.name}
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-4 flex flex-col justify-end text-white">
                        <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-widest font-mono">
                          🔥 {activeHover?.name || 'ОНЦЛОХ БАРАА'}
                        </span>
                        <h5 className="font-black text-sm mt-0.5 line-clamp-1 font-sans">
                          {showcaseProduct.name}
                        </h5>
                        <span className="text-xs font-black text-red-400 font-sans mt-0.5">
                          {formatMNT(
                            showcaseProduct.isDiscounted && showcaseProduct.discountPriceMnt
                              ? showcaseProduct.discountPriceMnt
                              : showcaseProduct.priceMnt
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onQuickView) onQuickView(showcaseProduct);
                            setIsMegaMenuOpen(false);
                          }}
                          className="mt-3 py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl transition-all text-center flex items-center justify-center gap-1 shadow-sm active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Шууд үзэх / Захиалах</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

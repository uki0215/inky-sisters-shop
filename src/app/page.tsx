'use client';

import React, { useState, useEffect } from 'react';
import { getFirstImageUrl } from '@/lib/imageUtils';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import PromoModal from '@/components/PromoModal';
import QuickViewModal from '@/components/QuickViewModal';
import HeroSlider from '@/components/HeroSlider';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import SavedModal from '@/components/SavedModal';
import CompareModal from '@/components/CompareModal';
import DeliveryModal from '@/components/DeliveryModal';
import BarcodeListener from '@/components/BarcodeListener';
import HomeBundles from '@/components/HomeBundles';
import BundleModal from '@/components/BundleModal';
import AnimatedBackground from '@/components/AnimatedBackground';
import { CartProvider, useCart } from '@/context/CartContext';
import { formatMNT } from '@/lib/utils';
import { ShoppingBag, ChevronLeft, ChevronRight, ChevronDown, Barcode, Sparkles, ArrowRight, Eye, Tag, Star, CreditCard, SlidersHorizontal, RotateCcw, X, PenTool, BookOpen, Brush, Briefcase, LayoutGrid, Folder, GraduationCap, Gift, Layers, Bookmark, Flame } from 'lucide-react';

function HomeContent() {
  const { addBundleToCart } = useCart();
  const [products, setProducts] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('inky_cached_products');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });
  const [categories, setCategories] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('inky_cached_categories') || localStorage.getItem('inky_admin_cached_categories');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [featuredCollections, setFeaturedCollections] = useState<any[]>([]);
  const [banksList, setBanksList] = useState<any[]>([]);
  const [promoBanner, setPromoBanner] = useState<any>(null);
  const [settings, setSettings] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('inky_cached_settings');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return {
      showStockQuantity: true,
      logoUrl: '',
      address: 'Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо, Энхтайваны өргөн чөлөө',
      phone: '88112233, 99112233',
      email: 'info@inkysisters.mn',
      workingHours: 'Даваа - Ням: 10:00 - 20:00',
    };
  });
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minPriceFilter, setMinPriceFilter] = useState<string>('');
  const [maxPriceFilter, setMaxPriceFilter] = useState<string>('');
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([]);
  const [isFilterView, setIsFilterView] = useState(false);
  const [random20Products, setRandom20Products] = useState<any[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [quickViewBundle, setQuickViewBundle] = useState<any | null>(null);
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('inky_cached_products');
        if (cached && JSON.parse(cached).length > 0) return false;
      } catch (e) {}
    }
    return true;
  });
  const [scannedNotice, setScannedNotice] = useState<string | null>(null);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent && products.length === 0) setLoading(true);
    try {
      const [resProducts, resCategories, resPromo, resSettings, resSlides, resCollections, resBanks, resBundles] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/promotions'),
        fetch('/api/settings'),
        fetch('/api/hero-slides'),
        fetch('/api/featured-collections'),
        fetch('/api/banks'),
        fetch('/api/bundles?activeOnly=true'),
      ]);

      const [dataProducts, dataCategories, dataPromo, dataSettings, dataSlides, dataCollections, dataBanks, dataBundles] = await Promise.all([
        resProducts.json(),
        resCategories.json(),
        resPromo.json(),
        resSettings.json(),
        resSlides.json(),
        resCollections.json(),
        resBanks.json(),
        resBundles.json(),
      ]);

      if (Array.isArray(dataProducts)) {
        setProducts(dataProducts);
        try { localStorage.setItem('inky_cached_products', JSON.stringify(dataProducts)); } catch (e) {}
      }
      if (Array.isArray(dataCategories)) {
        setCategories(dataCategories);
        try {
          localStorage.setItem('inky_cached_categories', JSON.stringify(dataCategories));
          localStorage.setItem('inky_admin_cached_categories', JSON.stringify(dataCategories));
        } catch (e) {}
      }
      if (dataPromo) setPromoBanner(dataPromo);
      if (dataSettings) {
        setSettings(dataSettings);
        try {
          localStorage.setItem('inky_cached_settings', JSON.stringify(dataSettings));
        } catch (e) {}
      }
      if (Array.isArray(dataSlides)) {
        setHeroSlides(dataSlides);
        try {
          localStorage.setItem('inky_cached_hero_slides', JSON.stringify(dataSlides));
        } catch (e) {}
      }
      if (Array.isArray(dataCollections)) setFeaturedCollections(dataCollections);
      if (Array.isArray(dataBanks)) setBanksList(dataBanks);
      if (Array.isArray(dataBundles)) setBundles(dataBundles);
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    // Scroll screen to the absolute top on page load
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (e) {}

    // Load cached settings & hero slides immediately for instant 0ms rendering
    try {
      const cached = localStorage.getItem('inky_cached_settings');
      if (cached) {
        setSettings(JSON.parse(cached));
      }
      const cachedSlides = localStorage.getItem('inky_cached_hero_slides');
      if (cachedSlides) {
        setHeroSlides(JSON.parse(cachedSlides));
      }
    } catch (e) {}

    fetchData();

    // Cross-tab BroadcastChannel event listener
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('inky_stock_sync');
      channel.onmessage = () => {
        fetchData(true);
      };
    } catch (e) {}

    // Storage event listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'inky_last_stock_update') {
        fetchData(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Window focus listener
    const handleFocus = () => {
      fetchData(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const shuffled = [...products].sort(() => 0.5 - Math.random()).slice(0, 20);
      setRandom20Products(shuffled);
    }
  }, [products]);

  useEffect(() => {
    if (categories.length > 0 && expandedCategoryIds.length === 0) {
      const mainIds = categories.filter((c: any) => !c.parentId).map((c: any) => c.id);
      setExpandedCategoryIds(mainIds);
    }
  }, [categories]);

  useEffect(() => {
    if (activeCategory !== 'all') {
      const cat = categories.find((c) => c.slug === activeCategory || c.id === activeCategory);
      if (cat) {
        const targetId = cat.parentId || cat.id;
        setExpandedCategoryIds((prev) =>
          prev.includes(targetId) ? prev : [...prev, targetId]
        );
      }
    }
  }, [activeCategory, categories]);

  const isCatalogMode = isFilterView || activeCategory !== 'all' || !!searchQuery || !!minPriceFilter || !!maxPriceFilter;

  const toggleCategoryExpand = (catId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const renderCategoryIcon = (cat: any, isSub: boolean = false) => {
    const slug = (cat?.slug || '').toLowerCase();
    const name = (cat?.name || '').toLowerCase();
    const iconName = cat?.icon || '';

    const iconClass = isSub ? "w-3.5 h-3.5 text-teal-600 shrink-0" : "w-4 h-4 text-teal-700 shrink-0";

    if (iconName === 'PenTool' || slug.includes('pen') || name.includes('үзэг') || name.includes('маркер')) {
      return <PenTool className={iconClass} />;
    }
    if (iconName === 'BookOpen' || slug.includes('notebook') || name.includes('дэвтэр') || name.includes('төлөвлөгч')) {
      return <BookOpen className={iconClass} />;
    }
    if (iconName === 'Brush' || slug.includes('art') || name.includes('будаг') || name.includes('зураг')) {
      return <Brush className={iconClass} />;
    }
    if (iconName === 'Briefcase' || slug.includes('office') || name.includes('оффис') || name.includes('бичиг')) {
      return <Briefcase className={iconClass} />;
    }
    if (slug.includes('school') || name.includes('сургууль') || name.includes('цүнх') || name.includes('пенал')) {
      return <GraduationCap className={iconClass} />;
    }
    if (slug.includes('gift') || name.includes('бэлэг') || name.includes('сувенир')) {
      return <Gift className={iconClass} />;
    }

    if (isSub) {
      return <Tag className={iconClass} />;
    }

    return <Folder className={iconClass} />;
  };

  const handleHardwareScan = (scannedCode: string) => {
    setSearchQuery(scannedCode);
    setScannedNotice(`📷 Бар код уншуулагдлаа: ${scannedCode}`);
    setTimeout(() => setScannedNotice(null), 4000);
  };

  const scrollToProducts = () => {
    setTimeout(() => {
      const el = document.getElementById('products-section');
      if (el) {
        const yOffset = -90; // offset for sticky navbar
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 100);
  };

  const filteredProducts = products.filter((p) => {
    let matchesCategory = false;

    if (activeCategory === 'all') {
      matchesCategory = true;
    } else {
      // Try to find the selected category in our categories list by slug
      const selectedCat = categories.find(
        (c) => c.slug === activeCategory || c.id === activeCategory
      );

      if (!selectedCat) {
        // Fallback: direct slug or id match
        matchesCategory =
          (p.category?.slug === activeCategory) ||
          (p.category?.id === activeCategory) ||
          (p.categoryId === activeCategory);
      } else if (!selectedCat.parentId) {
        // It's a MAIN category: show products in this category AND all its subcategories
        const childIds = (selectedCat.children || categories.filter(c => c.parentId === selectedCat.id)).map((c: any) => c.id);
        matchesCategory =
          p.categoryId === selectedCat.id ||
          p.category?.id === selectedCat.id ||
          childIds.includes(p.categoryId) ||
          childIds.includes(p.category?.id);
      } else {
        // It's a SUBCATEGORY: show only products directly in this subcategory
        matchesCategory =
          p.categoryId === selectedCat.id ||
          p.category?.id === selectedCat.id ||
          p.category?.slug === selectedCat.slug;
      }
    }

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.barcode.includes(query) ||
      (p.description && p.description.toLowerCase().includes(query));

    let matchesPrice = true;
    const minP = minPriceFilter ? Number(minPriceFilter) : null;
    const maxP = maxPriceFilter ? Number(maxPriceFilter) : null;
    if (minP !== null && !isNaN(minP)) {
      matchesPrice = matchesPrice && p.priceMnt >= minP;
    }
    if (maxP !== null && !isNaN(maxP)) {
      matchesPrice = matchesPrice && p.priceMnt <= maxP;
    }

    return matchesCategory && matchesSearch && matchesPrice;
  });

  const discountedProducts = products.filter((p) => p.isDiscounted);

  // Category showcase images helper
  const categoryImages: Record<string, string> = {
    'pens-markers': 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=600&auto=format&fit=crop&q=80',
    'notebooks-planners': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    'art-drawing': 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80',
    'office-supplies': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    'school-supplies': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80',
  };

  return (
    <div className="relative min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-teal-700 selection:text-white overflow-x-hidden">

      {/* Floating Ambient Glowing Visual Effect */}
      <AnimatedBackground />

      {/* Global USB Barcode Scanner Listener */}
      <BarcodeListener onScan={handleHardwareScan} />

      {/* Navbar with Mega Menu */}
      <Navbar
        categories={categories}
        activeCategory={activeCategory}
        onHomeClick={() => {
          setActiveCategory('all');
          setIsFilterView(false);
          setSearchQuery('');
          setMinPriceFilter('');
          setMaxPriceFilter('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectCategory={(slug) => {
          setActiveCategory(slug);
          setIsFilterView(true);
          setSearchQuery('');
          setMinPriceFilter('');
          setMaxPriceFilter('');
          scrollToProducts();
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q) {
            setIsFilterView(true);
            scrollToProducts();
          }
        }}
        logoUrl={settings?.logoUrl}
        products={products}
        onQuickView={(product) => setQuickViewProduct(product)}
        onOpenDelivery={() => setIsDeliveryOpen(true)}
      />

      {/* Toast Notification */}
      {scannedNotice && (
        <div className="fixed top-24 right-4 z-50 bg-teal-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <Barcode className="w-5 h-5" />
          <span>{scannedNotice}</span>
        </div>
      )}

      {/* Refresh Promo Modal Banner */}
      <PromoModal
        banner={promoBanner}
        onExploreDiscounts={() => {
          setSearchQuery('');
          setActiveCategory('all');
          setIsFilterView(false);
          const element = document.getElementById('featured-discounts');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* AUTO-SLIDING HERO BANNER SECTION */}
      {!isCatalogMode && (
        <HeroSlider
          slides={heroSlides}
          allProducts={products}
          allBundles={bundles}
          onQuickView={setQuickViewProduct}
          onQuickViewBundle={setQuickViewBundle}
        />
      )}

      {/* THREE-PROMO-BANNER GRID SECTION (3 Зураг, Холбосон Бараа & Линк) */}
      {!isCatalogMode && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Banner 1 */}
            <div
              onClick={() => {
                if (settings.banner1ProductId) {
                  const targetProd = products.find((p) => p.id === settings.banner1ProductId);
                  if (targetProd) setQuickViewProduct(targetProd);
                } else if (settings.banner1Link) {
                  window.location.href = settings.banner1Link;
                }
              }}
              className="group relative h-48 sm:h-56 rounded-2xl overflow-hidden shadow-sm card-3d-glow border border-gray-200/80 block cursor-pointer sheen-effect transform-gpu"
            >
              <img
                src={settings.banner1Image || 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=800&auto=format&fit=crop&q=80'}
                alt={settings.banner1Title || 'Banner 1'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex items-end p-5">
                <div>
                  <h3 className="text-lg font-black text-white font-sans group-hover:text-teal-200 transition-colors">
                    {settings.banner1Title || 'Эстэтик Пастел Үзэгнүүд'}
                  </h3>
                  <span className="text-xs text-teal-300 font-extrabold flex items-center gap-1 mt-1 group-hover:translate-x-1 transition-transform">
                    {settings.banner1ProductId ? 'Бараа үзэх / Захиалах' : 'Үзэх'} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Banner 2 */}
            <div
              onClick={() => {
                if (settings.banner2ProductId) {
                  const targetProd = products.find((p) => p.id === settings.banner2ProductId);
                  if (targetProd) setQuickViewProduct(targetProd);
                } else if (settings.banner2Link) {
                  window.location.href = settings.banner2Link;
                }
              }}
              className="group relative h-48 sm:h-56 rounded-2xl overflow-hidden shadow-sm card-3d-glow border border-gray-200/80 block cursor-pointer sheen-effect transform-gpu"
            >
              <img
                src={settings.banner2Image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'}
                alt={settings.banner2Title || 'Banner 2'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex items-end p-5">
                <div>
                  <h3 className="text-lg font-black text-white font-sans group-hover:text-teal-200 transition-colors">
                    {settings.banner2Title || 'Планер & Төлөвлөгч Дэвтрүүд'}
                  </h3>
                  <span className="text-xs text-teal-300 font-extrabold flex items-center gap-1 mt-1 group-hover:translate-x-1 transition-transform">
                    {settings.banner2ProductId ? 'Бараа үзэх / Захиалах' : 'Үзэх'} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Banner 3 */}
            <div
              onClick={() => {
                if (settings.banner3ProductId) {
                  const targetProd = products.find((p) => p.id === settings.banner3ProductId);
                  if (targetProd) setQuickViewProduct(targetProd);
                } else if (settings.banner3Link) {
                  window.location.href = settings.banner3Link;
                }
              }}
              className="group relative h-48 sm:h-56 rounded-2xl overflow-hidden shadow-sm card-3d-glow border border-gray-200/80 block cursor-pointer sheen-effect transform-gpu"
            >
              <img
                src={settings.banner3Image || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80'}
                alt={settings.banner3Title || 'Banner 3'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex items-end p-5">
                <div>
                  <h3 className="text-lg font-black text-white font-sans group-hover:text-teal-200 transition-colors">
                    {settings.banner3Title || 'Зургийн Усан Будаг & Багс'}
                  </h3>
                  <span className="text-xs text-teal-300 font-extrabold flex items-center gap-1 mt-1 group-hover:translate-x-1 transition-transform">
                    {settings.banner3ProductId ? 'Бараа үзэх / Захиалах' : 'Үзэх'} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* SECTION 1: SECTION HEADER & FEATURED DISCOUNTS ("ОНЦЛОХ ХЯМДРАЛ") */}
      {/* SECTION 1: FEATURED DISCOUNTS ("Inky's sales") WITH BROWSE ALL BUTTON */}
      {discountedProducts.length > 0 && !isCatalogMode && (
        <section id="featured-discounts" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white/85 backdrop-blur-md rounded-3xl shadow-sm border border-gray-200/80 my-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight font-sans">
                Inky's sales
              </h2>
              <div className="w-16 h-1 bg-red-500 mt-2 rounded-full" />
            </div>

            <button
              onClick={() => {
                setActiveCategory('all');
                setIsFilterView(true);
                scrollToProducts();
              }}
              className="text-xs font-extrabold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 px-4 py-2 rounded-full self-start sm:self-auto font-sans shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>Бүгдийг үзэх</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {discountedProducts.slice(0, 6).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => {
                  fetch(`/api/products/${p.id}/click`, { method: 'POST' }).catch(() => { });
                  setQuickViewProduct(p);
                }}
                showStockQuantity={settings.showStockQuantity}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: TOP MOST POPULAR PRODUCTS ("Inky's trend") - 6 PRODUCTS GRID */}
      {!isCatalogMode && products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white my-6 border-y border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight font-sans">
                Inky's trend
              </h2>
              <div className="w-16 h-1 bg-amber-500 mt-2 rounded-full" />
            </div>

            <button
              onClick={() => {
                setActiveCategory('all');
                setIsFilterView(true);
                scrollToProducts();
              }}
              className="text-xs font-extrabold text-teal-800 hover:text-white bg-teal-50 hover:bg-teal-700 border border-teal-200 px-4 py-2 rounded-full self-start sm:self-auto font-sans shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>Бүгдийг үзэх</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[...products]
              .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
              .slice(0, 6)
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => {
                    fetch(`/api/products/${p.id}/click`, { method: 'POST' }).catch(() => { });
                    setQuickViewProduct(p);
                  }}
                  showStockQuantity={settings.showStockQuantity}
                />
              ))}
          </div>
        </section>
      )}

      {/* PRODUCT BUNDLES SHOWCASE SECTION ("ОНЦЛОХ ИЖ БҮРЭН БАГЦУУД") */}
      {!isCatalogMode && <HomeBundles onViewAll={() => setActiveCategory('bundles')} />}

      {/* SECTION 3: FEATURED PRODUCTS / COLLECTIONS ("Inky's choice") */}
      {!isCatalogMode && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight font-sans">
              Inky's choice
            </h2>
            <div className="w-16 h-1 bg-gray-900 mx-auto mt-2 rounded-full" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {featuredCollections.length > 0 ? (
              featuredCollections.slice(0, 4).map((col) => (
                <div
                  key={col.id}
                  onClick={() => {
                    if (col.linkCategory) {
                      setActiveCategory(col.linkCategory);
                      setIsFilterView(true);
                    } else if (col.productId) {
                      const p = products.find((pr) => pr.id === col.productId);
                      if (p) setQuickViewProduct(p);
                    }
                    scrollToProducts();
                  }}
                  className="relative rounded-2xl overflow-hidden aspect-[4/5] group bg-gray-900 border border-gray-200 cursor-pointer shadow-xs hover:shadow-lg transition-all"
                >
                  <img
                    src={getFirstImageUrl(col.imageUrl)}
                    alt={col.title}
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                    {col.subtitle && (
                      <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">{col.subtitle}</span>
                    )}
                    <h3 className="text-lg font-extrabold mt-1">{col.title}</h3>
                    <span className="text-xs text-gray-300 flex items-center gap-1 mt-2 font-semibold group-hover:text-white transition-colors">
                      Цуглуулга үзэх <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Default Fallback Card 1 */}
                <div
                  onClick={() => {
                    setActiveCategory('pens-markers');
                    scrollToProducts();
                  }}
                  className="relative rounded-2xl overflow-hidden aspect-[4/5] group bg-gray-900 border border-gray-200 cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=600&auto=format&fit=crop&q=80"
                    alt="Pastel Pen Set"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                    <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">Inky Special</span>
                    <h3 className="text-lg font-extrabold mt-1">Pastel Pen Sets</h3>
                    <span className="text-xs text-gray-300 flex items-center gap-1 mt-2 font-semibold group-hover:text-white transition-colors">
                      Үзэг & Маркер үзэх <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Default Fallback Card 2 */}
                <div
                  onClick={() => {
                    setActiveCategory('notebooks-planners');
                    scrollToProducts();
                  }}
                  className="relative rounded-2xl overflow-hidden aspect-[4/5] group bg-gray-900 border border-gray-200 cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"
                    alt="Bullet Journal"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Leather Journals</span>
                    <h3 className="text-lg font-extrabold mt-1">Bullet Planners</h3>
                    <span className="text-xs text-gray-300 flex items-center gap-1 mt-2 font-semibold group-hover:text-white transition-colors">
                      Дэвтэр үзэх <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Default Fallback Card 3 */}
                <div
                  onClick={() => {
                    setSearchQuery('Майлдлайнер');
                    scrollToProducts();
                  }}
                  className="relative rounded-2xl overflow-hidden aspect-[4/5] group bg-gray-900 border border-gray-200 cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=600&auto=format&fit=crop&q=80"
                    alt="Highlighters"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">Mildliners</span>
                    <h3 className="text-lg font-extrabold mt-1">Aesthetic Markers</h3>
                    <span className="text-xs text-gray-300 flex items-center gap-1 mt-2 font-semibold group-hover:text-white transition-colors">
                      Тодотгогч үзэх <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Default Fallback Card 4 */}
                <div
                  onClick={() => {
                    setActiveCategory('art-supplies');
                    scrollToProducts();
                  }}
                  className="relative rounded-2xl overflow-hidden aspect-[4/5] group bg-gray-900 border border-gray-200 cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80"
                    alt="Watercolor Paints"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Art Studio</span>
                    <h3 className="text-lg font-extrabold mt-1">Watercolor Kits</h3>
                    <span className="text-xs text-gray-300 flex items-center gap-1 mt-2 font-semibold group-hover:text-white transition-colors">
                      Усан будаг үзэх <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* SECTION 4: PAYMENT OPTIONS & BANK LOGOS ("ТӨЛБӨРИЙН НӨХЦӨЛҮҮД") */}
      {!isCatalogMode && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 my-6 bg-white rounded-3xl border border-gray-200 shadow-xs">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight font-sans">
              ТӨЛБӨРИЙН НӨХЦӨЛҮҮД
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-sans">
              Манай дэлгүүр нь арилжааны банкнуудын апликейшн болон QR төлбөрийг дэмждэг.
            </p>
            <div className="w-16 h-1 bg-gray-900 mx-auto mt-3 rounded-full" />
          </div>

          {/* COMMERCIAL BANKS LOGOS GRID - ONLY BANK NAME & BANK LOGO */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {banksList.length > 0 ? (
              banksList.map((bank) => (
                <div key={bank.id} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:border-teal-600 hover:shadow-md transition-all group">
                  <div className="w-14 h-14 bg-white p-2 rounded-2xl shadow-xs border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    {bank.bankLogoUrl ? (
                      <img src={bank.bankLogoUrl} alt={bank.bankName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-extrabold text-xs font-mono text-teal-800 uppercase">{bank.bankCode || bank.bankName.slice(0, 4)}</span>
                    )}
                  </div>
                  <span className="font-extrabold text-gray-900 text-xs font-sans tracking-tight">{bank.bankName}</span>
                </div>
              ))
            ) : (
              <>
                {/* Khan Bank */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:border-emerald-600 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-extrabold text-xs shadow-xs group-hover:scale-105 transition-transform">
                    ХААН
                  </div>
                  <span className="font-extrabold text-gray-900 text-xs font-sans">Хаан Банк</span>
                </div>

                {/* Golomt Bank */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:border-blue-600 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-extrabold text-xs shadow-xs group-hover:scale-105 transition-transform">
                    ГОЛОМТ
                  </div>
                  <span className="font-extrabold text-gray-900 text-xs font-sans">Голомт Банк</span>
                </div>

                {/* TDB Bank */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:border-teal-600 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-teal-800 text-white flex items-center justify-center font-extrabold text-xs shadow-xs group-hover:scale-105 transition-transform">
                    ХХБ
                  </div>
                  <span className="font-extrabold text-gray-900 text-xs font-sans">Худалдаа Хөгжлийн Банк</span>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* MAIN PRODUCTS GRID SECTION */}
      <main id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white/85 backdrop-blur-md rounded-3xl shadow-sm border border-gray-200/80 my-6">
        {!isCatalogMode ? (
          /* HOME PAGE MODE: 6 Products list, NO sidebar, "Бүгдийг үзэх" button on the right */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-sans tracking-tight">
                  Inky's store
                </h3>
              </div>

              <button
                onClick={() => {
                  setIsFilterView(true);
                  scrollToProducts();
                }}
                className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 group shrink-0"
              >
                <span>Бүгдийг үзэх</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 py-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-72 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {(random20Products.length > 0 ? random20Products : products).slice(0, 6).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={setQuickViewProduct}
                    showStockQuantity={settings.showStockQuantity}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* CATALOG FILTER MODE: With Left Sticky Sidebar Filter & Full Products List */
          <div>
            {/* Top Row: Back to Home button on left, Reset Filter chips on opposite right side */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-200">
              <button
                onClick={() => {
                  setIsFilterView(false);
                  setActiveCategory('all');
                  setSearchQuery('');
                  setMinPriceFilter('');
                  setMaxPriceFilter('');
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl border border-teal-200 transition-all shrink-0 shadow-xs active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Нүүр хуудас</span>
              </button>

              {/* Reset filter chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {activeCategory !== 'all' && (
                  <button
                    onClick={() => setActiveCategory('all')}
                    className="flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-full border border-teal-200 transition-all"
                  >
                    <span>Ангилал арилгах</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {(minPriceFilter || maxPriceFilter) && (
                  <button
                    onClick={() => {
                      setMinPriceFilter('');
                      setMaxPriceFilter('');
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200 transition-all"
                  >
                    <span>Үнийн шүүлт арилгах</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="flex items-center gap-1 text-xs font-bold text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full border border-red-200 transition-all"
                  >
                    <span>Хайлт арилгах</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

              {/* LEFT SIDEBAR FILTER (LOCKED / NON-STICKY) */}
              <aside className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-6">

                {/* CATEGORY TREE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h5 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider block font-sans">
                      📁 Ангилалууд
                    </h5>
                    {(activeCategory !== 'all' || minPriceFilter || maxPriceFilter) && (
                      <button
                        onClick={() => {
                          setActiveCategory('all');
                          setMinPriceFilter('');
                          setMaxPriceFilter('');
                        }}
                        className="text-[11px] font-bold text-gray-500 hover:text-teal-700 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Шинэчлэх</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => {
                        setActiveCategory('all');
                        scrollToProducts();
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between transition-all ${activeCategory === 'all'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        <LayoutGrid className={`w-4 h-4 shrink-0 ${activeCategory === 'all' ? 'text-white' : 'text-teal-700'}`} />
                        <span>Бүх Ангилал</span>
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveCategory('bundles');
                        scrollToProducts();
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold flex items-center justify-between transition-all ${activeCategory === 'bundles'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold shadow-xs'
                        : 'text-gray-800 hover:bg-gray-100'
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        <Gift className={`w-4 h-4 shrink-0 ${activeCategory === 'bundles' ? 'text-emerald-600' : 'text-gray-500'}`} />
                        <span>Иж Бүрэн Багц</span>
                      </span>
                    </button>

                    {categories
                      .filter((c: any) => {
                        if (c.parentId) return false;
                        const name = (c.name || '').trim();
                        if (!name) return false;
                        const lower = name.toLowerCase();
                        if (name === 'Бусад' || lower === 'other' || lower === 'uncategorized' || lower === 'ангилалгүй' || lower === 'бусад') return false;
                        return true;
                      })
                      .map((mainCat: any) => {
                        const subCats = categories.filter((sub: any) => {
                          if (sub.parentId !== mainCat.id) return false;
                          const name = (sub.name || '').trim();
                          if (!name) return false;
                          const lower = name.toLowerCase();
                          if (name === 'Бусад' || lower === 'other' || lower === 'uncategorized' || lower === 'ангилалгүй' || lower === 'бусад') return false;
                          return true;
                        });
                        const isMainActive = activeCategory === mainCat.slug || activeCategory === mainCat.id;
                        const isExpanded = expandedCategoryIds.includes(mainCat.id);

                        return (
                          <div key={mainCat.id} className="space-y-1">
                            <div
                              onClick={() => {
                                setActiveCategory(mainCat.slug);
                                scrollToProducts();
                              }}
                              className={`group cursor-pointer px-3 py-2 rounded-xl font-bold flex items-center justify-between transition-all ${isMainActive
                                ? 'bg-teal-50 border border-teal-200 text-teal-900'
                                : 'text-gray-800 hover:bg-gray-100'
                                }`}
                            >
                              <span className="flex items-center gap-2">
                                {renderCategoryIcon(mainCat, false)}
                                <span>{mainCat.name}</span>
                              </span>

                              {subCats.length > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => toggleCategoryExpand(mainCat.id, e)}
                                  className="p-1 hover:bg-gray-200 rounded-md text-gray-500 transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-teal-800" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>

                            {isExpanded && subCats.length > 0 && (
                              <div className="pl-4 pr-1 space-y-1 border-l-2 border-teal-100 ml-3 py-1">
                                {subCats.map((sub: any) => {
                                  const isSubActive = activeCategory === sub.slug || activeCategory === sub.id;

                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() => {
                                        setActiveCategory(sub.slug);
                                        scrollToProducts();
                                      }}
                                      className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-2 transition-all ${isSubActive
                                        ? 'bg-teal-700 text-white font-extrabold'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                      {renderCategoryIcon(sub, true)}
                                      <span>{sub.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* PRICE FILTER */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between font-sans">
                    <span>🏷️ Үнээр Шүүх (₮)</span>
                    {(minPriceFilter || maxPriceFilter) && (
                      <button
                        onClick={() => {
                          setMinPriceFilter('');
                          setMaxPriceFilter('');
                        }}
                        className="text-[10px] text-teal-700 font-bold hover:underline"
                      >
                        Арилгах
                      </button>
                    )}
                  </h5>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">Доод үнэ (₮)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={minPriceFilter}
                        onChange={(e) => setMinPriceFilter(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold focus:bg-white focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">Дээд үнэ (₮)</label>
                      <input
                        type="number"
                        placeholder="100,000"
                        value={maxPriceFilter}
                        onChange={(e) => setMaxPriceFilter(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold focus:bg-white focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { label: '< 10,000₮', min: '', max: '10000' },
                      { label: '10k - 30k₮', min: '10000', max: '30000' },
                      { label: '30k - 50k₮', min: '30000', max: '50000' },
                      { label: '50,000₮+', min: '50000', max: '' },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMinPriceFilter(preset.min);
                          setMaxPriceFilter(preset.max);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${minPriceFilter === preset.min && maxPriceFilter === preset.max
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

              </aside>

              {/* PRODUCTS LIST OR BUNDLES LIST */}
              <div className="lg:col-span-3">
                {activeCategory === 'bundles' ? (
                  (() => {
                    const filteredBundles = bundles.filter((b) => {
                      let matchesSearch = true;
                      if (searchQuery) {
                        const q = searchQuery.toLowerCase().trim();
                        matchesSearch =
                          b.name.toLowerCase().includes(q) ||
                          (b.description && b.description.toLowerCase().includes(q));
                      }
                      let matchesPrice = true;
                      const minP = minPriceFilter ? Number(minPriceFilter) : null;
                      const maxP = maxPriceFilter ? Number(maxPriceFilter) : null;
                      if (minP !== null && !isNaN(minP)) {
                        matchesPrice = matchesPrice && b.bundlePriceMnt >= minP;
                      }
                      if (maxP !== null && !isNaN(maxP)) {
                        matchesPrice = matchesPrice && b.bundlePriceMnt <= maxP;
                      }
                      return matchesSearch && matchesPrice;
                    });

                    if (loading) {
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
                          {[1, 2, 3].map((n) => (
                            <div key={n} className="h-80 bg-gray-200 rounded-3xl animate-pulse" />
                          ))}
                        </div>
                      );
                    }

                    if (filteredBundles.length === 0) {
                      return (
                        <div className="py-20 text-center bg-white rounded-3xl border border-gray-200 p-8 space-y-4 shadow-sm">
                          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100 shadow-2xs">
                            <Gift className="w-8 h-8" />
                          </div>
                          <h3 className="text-lg font-black text-gray-900 font-sans">
                            Багцын Мэдээлэл Алга Байна
                          </h3>
                          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed font-sans">
                            Одоогоор хямдралтай иж бүрэн багц үүсээгүй байна эсвэл хайлтын дүнд тохирох багц олдсонгүй. Та удахгүй дахин зочлоорой!
                          </p>
                          <button
                            onClick={() => {
                              setActiveCategory('all');
                              setMinPriceFilter('');
                              setMaxPriceFilter('');
                              setSearchQuery('');
                            }}
                            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>Бүх Бараануудыг харах</span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBundles.map((bundle) => (
                          <div
                            key={bundle.id}
                            onClick={() => setQuickViewBundle(bundle)}
                            className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer hover:border-teal-300 relative"
                          >
                            {/* Image & Discount Badge */}
                            <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                              <img
                                src={getFirstImageUrl(bundle.imageUrl)}
                                alt={bundle.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />

                              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                <span className="px-3 py-1 bg-rose-600 text-white text-xs font-black rounded-full font-mono shadow-md flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                                  -{bundle.discountPercent}% ХЯМДРАЛ
                                </span>
                              </div>

                              <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-teal-400" />
                                <span>{bundle.items?.length || 0} Барааны Иж бүрдэл</span>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                              <div>
                                <h3 className="font-extrabold text-gray-900 text-base group-hover:text-teal-800 transition-colors font-sans line-clamp-1">
                                  {bundle.name}
                                </h3>

                                {bundle.description && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {bundle.description}
                                  </p>
                                )}
                              </div>

                              {/* Price Display */}
                              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                                <div>
                                  <span className="text-[11px] text-gray-500 font-bold block mb-0.5 font-sans">
                                    Нийт дүн:
                                  </span>
                                  <div className="flex items-baseline gap-2 font-mono">
                                    <span className="text-lg font-black text-red-600 leading-none">
                                      {formatMNT(bundle.bundlePriceMnt)}
                                    </span>
                                    {bundle.originalPriceMnt > bundle.bundlePriceMnt && (
                                      <span className="text-xs font-bold text-gray-400 line-through">
                                        {formatMNT(bundle.originalPriceMnt)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 py-4">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="h-72 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-16 text-center bg-white rounded-2xl border border-gray-200 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
                    <h4 className="text-base font-bold text-gray-800">Бараа олдсонгүй</h4>
                    <p className="text-xs text-gray-500">
                      Сонгосон үнийн дүн эсвэл ангилалд бараа байхгүй байна. Та шүүлтийг өөрчлөнө үү.
                    </p>
                    <button
                      onClick={() => {
                        setActiveCategory('all');
                        setMinPriceFilter('');
                        setMaxPriceFilter('');
                        setSearchQuery('');
                      }}
                      className="px-4 py-2 bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Бүх шүүлтийг цэвэрлэх
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onQuickView={setQuickViewProduct}
                        showStockQuantity={settings.showStockQuantity}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Quick View Modal for Bundles */}
      {quickViewBundle && (
        <BundleModal
          bundle={quickViewBundle}
          onClose={() => setQuickViewBundle(null)}
        />
      )}

      {/* Quick View Modal with Recommendation List */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          allProducts={products}
          onSelectProduct={setQuickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          showStockQuantity={settings.showStockQuantity}
        />
      )}

      {/* Cart Drawer, Checkout, Saved (Wishlist), Compare Modals */}
      <CartDrawer />
      <CheckoutModal />
      <SavedModal onQuickView={setQuickViewProduct} />
      <CompareModal onQuickView={setQuickViewProduct} />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 text-gray-600 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Column 1: Logo & Store Bio */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {settings.logoUrl && (
                <img
                  src={settings.logoUrl}
                  alt="Inky Sisters Logo"
                  className="w-12 h-12 object-contain"
                />
              )}
              <div>
                <span className="font-extrabold text-lg text-teal-950 block leading-none font-sans">
                  INKY SISTERS
                </span>
                <span className="text-[10px] font-mono tracking-widest text-teal-700 uppercase block mt-1">
                  Stationery &amp; Art Shop
                </span>
              </div>
            </div>
            <p className="text-gray-500 leading-relaxed font-sans">
              Энгийн бичиг хэргийн дэлгүүр.
            </p>
          </div>

          {/* Column 2: Bank & Payment Options */}
          <div className="space-y-2.5">
            <p className="text-gray-600 font-semibold">
              {banksList.length > 0
                ? banksList.map((b) => b.bankName).join(' | ')
                : 'Хаан Банк | Голомт Банк | Худалдаа Хөгжлийн Банк'}
            </p>
            <p className="text-teal-800 font-semibold">
              Захиалга өгсний дараа Банкны QR уншуулах болон Дансаар шууд шилжүүлэх боломжтой.
            </p>
            {settings.workingHours && (
              <p className="text-gray-500 font-mono">🕒 Цагийн хуваарь: {settings.workingHours}</p>
            )}
          </div>

          {/* Column 3: Contact & Address */}
          <div className="space-y-2">
            <h5 className="font-extrabold text-gray-900 text-sm font-sans uppercase tracking-wider">
              Холбоо Барих &amp; Байршил
            </h5>
            <p className="text-gray-700 font-semibold">Хаяг: {settings.address}</p>
            <p className="text-gray-700 font-semibold">📞 Утас: {settings.phone}</p>
            <p className="text-gray-700 font-semibold">✉️ Имэйл: {settings.email}</p>
            <p className="text-gray-400 text-[11px] pt-1">© 2026 Inky Sisters Shop. Бүх эрх хуулиар хамгаалагдсан.</p>
          </div>

        </div>
      </footer>

      {/* Delivery Zone & Terms Modal */}
      <DeliveryModal
        isOpen={isDeliveryOpen}
        onClose={() => setIsDeliveryOpen(false)}
      />

      {/* Hero Slide Bundle View Modal */}
      {quickViewBundle && (
        <BundleModal
          bundle={quickViewBundle}
          onClose={() => setQuickViewBundle(null)}
        />
      )}

    </div>
  );
}

export default function HomePage() {
  return (
    <CartProvider>
      <HomeContent />
    </CartProvider>
  );
}

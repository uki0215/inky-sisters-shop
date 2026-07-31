'use client';

import React, { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ProductSelector from '@/components/Admin/ProductSelector';
import { formatMNT } from '@/lib/utils';
import { Sparkles, Save, Plus, Trash2, Image, Link, Star } from 'lucide-react';

export default function PromotionManager() {
  const [promo, setPromo] = useState<any>({
    title: '',
    subtitle: '',
    imageUrl: '',
    discountCode: '',
    active: true,
  });

  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [newSlide, setNewSlide] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    badge: '🔥 2026 ОНЫ ТРЕНД',
    productId: '',
    bundleId: '',
    linkType: 'PRODUCT',
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  const fetchPromosAndSlides = async () => {
    setLoading(true);
    try {
      const [resPromo, resSlides, resProd, resCat, resSet, resBundles] = await Promise.all([
        fetch('/api/promotions'),
        fetch('/api/hero-slides'),
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/settings'),
        fetch('/api/bundles'),
      ]);

      const dataPromo = await resPromo.json();
      const dataSlides = await resSlides.json();
      const dataProd = await resProd.json();
      const dataCat = await resCat.json();
      const dataSet = await resSet.json();
      const dataBundles = await resBundles.json();

      if (dataPromo) setPromo(dataPromo);
      if (Array.isArray(dataSlides)) setHeroSlides(dataSlides);
      if (Array.isArray(dataProd)) setProducts(dataProd);
      if (Array.isArray(dataCat)) setCategories(dataCat);
      if (dataSet) setSettings(dataSet);
      if (Array.isArray(dataBundles)) setBundles(dataBundles);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromosAndSlides();
  }, []);

  const handleSubmitPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promo),
      });

      if (res.ok) {
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: newSlide.title,
        subtitle: newSlide.subtitle,
        imageUrl: newSlide.imageUrl,
        badge: newSlide.badge,
        productId: newSlide.linkType === 'PRODUCT' ? newSlide.productId : null,
        bundleId: newSlide.linkType === 'BUNDLE' ? newSlide.bundleId : null,
      };

      const res = await fetch('/api/hero-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setNewSlide({
          title: '',
          subtitle: '',
          imageUrl: '',
          badge: '🔥 2026 ОНЫ ТРЕНД',
          productId: '',
          bundleId: '',
          linkType: 'PRODUCT',
        });
        fetchPromosAndSlides();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('Энэ банерыг устгахдаа итгэлтэй байна уу?')) return;
    try {
      const res = await fetch(`/api/hero-slides/${id}`, { method: 'DELETE' });
      if (res.ok) fetchPromosAndSlides();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. POPUP PROMO BANNER SECTION */}
      <div className="space-y-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 font-sans flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            Промошн & Поп-ап Баннер Удирдлага
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Энд тохируулсан баннер нь хэрэглэгч сайтраа орох эсвэл Refresh хийх бүрт нэг удаа поп-ап (Modal) байдлаар гарна.
          </p>
        </div>

        {savedMsg && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 text-xs">
            ✓ Промошн баннер амжилттай хадгалагдлаа!
          </div>
        )}

        <form onSubmit={handleSubmitPromo} className="bg-white border border-gray-200 p-5 rounded-xl space-y-3 max-w-2xl shadow-sm">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Гарчиг (Title) *</label>
            <input
              type="text"
              required
              value={promo.title}
              onChange={(e) => setPromo({ ...promo, title: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Дэд тайлбар (Subtitle)</label>
            <textarea
              rows={2}
              value={promo.subtitle || ''}
              onChange={(e) => setPromo({ ...promo, subtitle: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white"
            />
          </div>

          <div>
            <ImageUploader
              value={promo.imageUrl || ''}
              onChange={(url) => setPromo({ ...promo, imageUrl: url })}
              label="Поп-ап Баннер Зураг (Upload / PC)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Хямдралын Промо Код</label>
              <input
                type="text"
                placeholder="INKY2026"
                value={promo.discountCode || ''}
                onChange={(e) => setPromo({ ...promo, discountCode: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-red-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center pt-4">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promo.active}
                  onChange={(e) => setPromo({ ...promo, active: e.target.checked })}
                  className="w-4 h-4 rounded accent-teal-700"
                />
                Идэвхтэй харуулах (Active)
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Поп-ап Баннер Хадгалах</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. AUTO-ROTATING HERO BANNER SLIDES (2 sec Carousel) */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-sans flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              Нүүр Хуудасны Hero Слайд Баннерууд (2 сек тутамд солигдоно)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Сайтын хамгийн дээр автоматаар 2 секунд тутамд гүйж харагдах банеруудыг удирдана.
            </p>
          </div>
        </div>

        {/* Create Hero Slide Form */}
        <form onSubmit={handleAddSlide} className="bg-white border border-gray-200 p-5 rounded-xl space-y-4 shadow-sm max-w-3xl">
          <h4 className="font-bold text-sm text-gray-900 font-sans flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-teal-700" /> Шинэ Hero Слайд Баннер Нэмэх
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Слайд Гарчиг *</label>
              <input
                type="text"
                required
                placeholder="Пастел Үзэгний Шинэ Цуглуулга"
                value={newSlide.title}
                onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Тэмдэгт (Badge)</label>
              <input
                type="text"
                placeholder="🔥 2026 ОНЫ ТРЕНД"
                value={newSlide.badge}
                onChange={(e) => setNewSlide({ ...newSlide, badge: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Дэд Тайлбар / Текст</label>
            <textarea
              rows={2}
              placeholder="Суралцах ба ажлын ширээний үзэмжийг чимэх..."
              value={newSlide.subtitle}
              onChange={(e) => setNewSlide({ ...newSlide, subtitle: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <ImageUploader
                value={newSlide.imageUrl}
                onChange={(url) => setNewSlide({ ...newSlide, imageUrl: url })}
                label="Слайд Зураг (Upload / PC) *"
              />
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="block text-xs font-bold text-gray-700">Слайд дарахад нээгдэх зүйл (Холбох Төрөл):</label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNewSlide({ ...newSlide, linkType: 'PRODUCT', bundleId: '' })}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    newSlide.linkType === 'PRODUCT'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  📦 Ганц Бараа Сонгох (Product)
                </button>

                <button
                  type="button"
                  onClick={() => setNewSlide({ ...newSlide, linkType: 'BUNDLE', productId: '' })}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    newSlide.linkType === 'BUNDLE'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  🎁 Иж Бүрэн Багц Сонгох (Bundle Set)
                </button>
              </div>

              {newSlide.linkType === 'PRODUCT' ? (
                <ProductSelector
                  products={products}
                  categories={categories}
                  selectedProductId={newSlide.productId}
                  onSelectProduct={(id) => setNewSlide({ ...newSlide, productId: id })}
                  label="Холбох Бараа Сонгох (Ангилал/Дэд ангилал эсвэл Баркодоор хайх):"
                />
              ) : (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Холбох Багц Сонгох:</label>
                  <select
                    value={newSlide.bundleId}
                    onChange={(e) => setNewSlide({ ...newSlide, bundleId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white"
                  >
                    <option value="">-- Холбох Багц Сонгоно уу --</option>
                    {bundles.map((b) => (
                      <option key={b.id} value={b.id}>
                        🎁 {b.name} ({formatMNT(b.bundlePriceMnt)}) - {b.items?.length || 0} бараатай
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Hero Слайд Нэмэх</span>
          </button>
        </form>

        {/* Active Hero Slides List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm max-w-3xl">
          <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-700 uppercase font-mono">
            Одоогоор идэвхтэй байгаа Hero Слайдууд ({heroSlides.length})
          </div>

          <div className="divide-y divide-gray-100">
            {heroSlides.map((slide, index) => (
              <div key={slide.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                    <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono">
                        #{index + 1}
                      </span>
                      <span className="font-bold text-xs text-gray-900">{slide.title}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 block truncate max-w-md">
                      {slide.subtitle || 'Тайлбар байхгүй'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteSlide(slide.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Устгах"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. THREE-BANNER GRID CONFIGURATION (3 ТУСДАА СЕКЦ БАННЕРУУД) */}
      <div className="space-y-6 pt-6 border-t border-gray-200">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 font-sans flex items-center gap-2">
              🖼️ Нүүр Хуудасны 3-р Блок Баннерууд (3 Тусдаа Секц)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-sans">
              Нүүр хуудсанд харагдах 3 зэрэгцээ Промо баннерын зураг, гарчиг ба дарахад холбогдох бараа эсвэл линкийг тус тусад нь удирдана.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* BANNER SECTION 1 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-teal-100 text-teal-900 font-extrabold text-xs rounded-full font-mono">
                  СЕКЦ #1 — ЗҮҮН БАННЕР
                </span>
                <span className="text-xs text-gray-500 font-bold">Нүүр хуудасны хамгийн зүүн талын промо блок</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Product Selector for Banner 1 */}
                <ProductSelector
                  products={products}
                  categories={categories}
                  selectedProductId={settings.banner1ProductId || ''}
                  onSelectProduct={(productId) => {
                    const selProd = products.find((p) => p.id === productId);
                    setSettings({
                      ...settings,
                      banner1ProductId: productId,
                      banner1Title: selProd ? selProd.name : settings.banner1Title,
                      banner1Image: selProd && selProd.imageUrl ? selProd.imageUrl : settings.banner1Image,
                    });
                  }}
                  label="1. Энэ секцэнд шууд холбох Бараагаа сонгох (Автоматаар холбогдоно):"
                />

                <ImageUploader
                  value={settings.banner1Image || ''}
                  onChange={(url) => setSettings({ ...settings, banner1Image: url })}
                  label="2. Баннер #1 Зураг (Upload эсвэл Сонгох):"
                />

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    3. Баннер #1 Гарчиг бичвэр:
                  </label>
                  <input
                    type="text"
                    value={settings.banner1Title || ''}
                    onChange={(e) => setSettings({ ...settings, banner1Title: e.target.value })}
                    placeholder="Жишээ: Эстэтик Пастел Үзэгнүүд"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    4. Дарахад шилжих Линк / URL (Бараа сонгоогүй үед):
                  </label>
                  <input
                    type="text"
                    value={settings.banner1Link || ''}
                    onChange={(e) => setSettings({ ...settings, banner1Link: e.target.value })}
                    placeholder="#featured-discounts эсвэл /category/pens"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 block">Шууд харагдах байдал (Live Preview):</span>
                <div className="relative h-56 rounded-2xl overflow-hidden border border-gray-300 shadow-md">
                  <img
                    src={settings.banner1Image || 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=800&auto=format&fit=crop&q=80'}
                    alt="Preview 1"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex items-end p-4">
                    <div>
                      <h4 className="text-base font-black text-white font-sans">
                        {settings.banner1Title || 'Баннер #1 Гарчиг'}
                      </h4>
                      <span className="text-xs text-teal-300 font-extrabold flex items-center gap-1 mt-0.5">
                        {settings.banner1ProductId
                          ? '🛍️ Сонгосон Бараа холбогдсон (Дарж Түргэн үзнэ)'
                          : `Шилжих линк: ${settings.banner1Link || '#products'}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BANNER SECTION 2 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-xs rounded-full font-mono">
                  СЕКЦ #2 — ДУНД БАННЕР
                </span>
                <span className="text-xs text-gray-500 font-bold">Нүүр хуудасны голын промо блок</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Product Selector for Banner 2 */}
                <ProductSelector
                  products={products}
                  categories={categories}
                  selectedProductId={settings.banner2ProductId || ''}
                  onSelectProduct={(productId) => {
                    const selProd = products.find((p) => p.id === productId);
                    setSettings({
                      ...settings,
                      banner2ProductId: productId,
                      banner2Title: selProd ? selProd.name : settings.banner2Title,
                      banner2Image: selProd && selProd.imageUrl ? selProd.imageUrl : settings.banner2Image,
                    });
                  }}
                  label="1. Энэ секцэнд шууд холбох Бараагаа сонгох (Автоматаар холбогдоно):"
                />

                <ImageUploader
                  value={settings.banner2Image || ''}
                  onChange={(url) => setSettings({ ...settings, banner2Image: url })}
                  label="2. Баннер #2 Зураг (Upload эсвэл Сонгох):"
                />

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    3. Баннер #2 Гарчиг бичвэр:
                  </label>
                  <input
                    type="text"
                    value={settings.banner2Title || ''}
                    onChange={(e) => setSettings({ ...settings, banner2Title: e.target.value })}
                    placeholder="Жишээ: Планер & Төлөвлөгч Дэвтрүүд"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    4. Дарахад шилжих Линк / URL (Бараа сонгоогүй үед):
                  </label>
                  <input
                    type="text"
                    value={settings.banner2Link || ''}
                    onChange={(e) => setSettings({ ...settings, banner2Link: e.target.value })}
                    placeholder="#featured-discounts эсвэл /category/notebooks"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 block">Шууд харагдах байдал (Live Preview):</span>
                <div className="relative h-56 rounded-2xl overflow-hidden border border-gray-300 shadow-md">
                  <img
                    src={settings.banner2Image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'}
                    alt="Preview 2"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex items-end p-4">
                    <div>
                      <h4 className="text-base font-black text-white font-sans">
                        {settings.banner2Title || 'Баннер #2 Гарчиг'}
                      </h4>
                      <span className="text-xs text-teal-300 font-extrabold flex items-center gap-1 mt-0.5">
                        {settings.banner2ProductId
                          ? '🛍️ Сонгосон Бараа холбогдсон (Дарж Түргэн үзнэ)'
                          : `Шилжих линк: ${settings.banner2Link || '#products'}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BANNER SECTION 3 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-900 font-extrabold text-xs rounded-full font-mono">
                  СЕКЦ #3 — БАРУУН БАННЕР
                </span>
                <span className="text-xs text-gray-500 font-bold">Нүүр хуудасны баруун талын промо блок</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Product Selector for Banner 3 */}
                <ProductSelector
                  products={products}
                  categories={categories}
                  selectedProductId={settings.banner3ProductId || ''}
                  onSelectProduct={(productId) => {
                    const selProd = products.find((p) => p.id === productId);
                    setSettings({
                      ...settings,
                      banner3ProductId: productId,
                      banner3Title: selProd ? selProd.name : settings.banner3Title,
                      banner3Image: selProd && selProd.imageUrl ? selProd.imageUrl : settings.banner3Image,
                    });
                  }}
                  label="1. Энэ секцэнд шууд холбох Бараагаа сонгох (Автоматаар холбогдоно):"
                />

                <ImageUploader
                  value={settings.banner3Image || ''}
                  onChange={(url) => setSettings({ ...settings, banner3Image: url })}
                  label="2. Баннер #3 Зураг (Upload эсвэл Сонгох):"
                />

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    3. Баннер #3 Гарчиг бичвэр:
                  </label>
                  <input
                    type="text"
                    value={settings.banner3Title || ''}
                    onChange={(e) => setSettings({ ...settings, banner3Title: e.target.value })}
                    placeholder="Жишээ: Зургийн Усан Будаг & Багс"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    4. Дарахад шилжих Линк / URL (Бараа сонгоогүй үед):
                  </label>
                  <input
                    type="text"
                    value={settings.banner3Link || ''}
                    onChange={(e) => setSettings({ ...settings, banner3Link: e.target.value })}
                    placeholder="#featured-discounts эсвэл /category/art"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 block">Шууд харагдах байдал (Live Preview):</span>
                <div className="relative h-56 rounded-2xl overflow-hidden border border-gray-300 shadow-md">
                  <img
                    src={settings.banner3Image || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80'}
                    alt="Preview 3"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex items-end p-4">
                    <div>
                      <h4 className="text-base font-black text-white font-sans">
                        {settings.banner3Title || 'Баннер #3 Гарчиг'}
                      </h4>
                      <span className="text-xs text-teal-300 font-extrabold flex items-center gap-1 mt-0.5">
                        {settings.banner3ProductId
                          ? '🛍️ Сонгосон Бараа холбогдсон (Дарж Түргэн үзнэ)'
                          : `Шилжих линк: ${settings.banner3Link || '#products'}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch('/api/settings', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(settings),
                });
                alert('✓ 3-р Блок Баннеруудын бүх тохиргоо амжилттай хадгалагдлаа!');
              } catch (err) {
                console.error(err);
              }
            }}
            className="w-full sm:w-auto px-8 py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>3 Баннерын Тохиргоог Нийтэд Нийтлэх (Хадгалах)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

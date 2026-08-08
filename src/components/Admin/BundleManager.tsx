'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Check,
  Percent,
  Search,
  Eye,
  Edit2,
  Power,
  Layers,
  ChevronDown,
  ChevronUp,
  Gift,
  Barcode,
  RefreshCw,
} from 'lucide-react';
import { formatMNT, generateBarcode } from '@/lib/utils';
import ImageUploader from '@/components/ImageUploader';
import BarcodeRenderer from '@/components/BarcodeRenderer';

export default function BundleManager() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Homepage Section Header Settings
  const [sectionTitle, setSectionTitle] = useState('ОНЦЛОХ ИЖ БҮРЭН БАГЦУУД');
  const [sectionBadge, setSectionBadge] = useState('Хямдралтай Багц Сетүүд');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Form states
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number | string>(10);
  const [isActive, setIsActive] = useState(true);
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([]);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Product Search Dropdown inside form
  const [productSearch, setProductSearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [expandedBundleId, setExpandedBundleId] = useState<string | null>(null);
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bundlesRes, productsRes, settingsRes] = await Promise.all([
        fetch('/api/bundles'),
        fetch('/api/products'),
        fetch('/api/settings'),
      ]);
      const bundlesData = await bundlesRes.json();
      const productsData = await productsRes.json();
      const settingsData = await settingsRes.json();

      if (Array.isArray(bundlesData)) setBundles(bundlesData);
      if (Array.isArray(productsData)) setProducts(productsData);
      if (settingsData) {
        if (settingsData.bundleSectionTitle) setSectionTitle(settingsData.bundleSectionTitle);
        if (settingsData.bundleSectionBadge) setSectionBadge(settingsData.bundleSectionBadge);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSectionSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleSectionTitle: sectionTitle,
          bundleSectionBadge: sectionBadge,
        }),
      });
      if (res.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateBarcode = () => {
    setBarcode(generateBarcode());
  };

  const handleAddItemToBundle = (product: any) => {
    const existing = selectedItems.find((i) => i.productId === product.id);
    if (existing) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems([...selectedItems, { productId: product.id, quantity: 1 }]);
    }
  };

  const handleRemoveItemFromBundle = (productId: string) => {
    setSelectedItems(selectedItems.filter((i) => i.productId !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItemFromBundle(productId);
      return;
    }
    setSelectedItems(
      selectedItems.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  // Calculate sum of items retail prices (ALWAYS using base undiscounted price p.priceMnt)
  const computedOriginalPriceMnt = selectedItems.reduce((sum, item) => {
    const p = products.find((prod) => prod.id === item.productId);
    if (!p) return sum;
    return sum + (p.priceMnt || 0) * item.quantity;
  }, 0);

  const discPct = Number(discountPercent) || 0;
  const computedBundlePriceMnt = Math.round(computedOriginalPriceMnt * (1 - discPct / 100));

  const handleSaveBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Багцын нэр оруулна уу');
    if (selectedItems.length === 0) return alert('Багцад дор хаяж 1 бараа сонгоно уу');

    try {
      const payload = {
        barcode: barcode.trim() || null,
        name,
        description,
        imageUrl,
        discountPercent: discPct,
        isActive,
        items: selectedItems,
      };

      let res;
      if (editingBundleId) {
        res = await fetch(`/api/bundles/${editingBundleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/bundles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        resetForm();
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Багц хадгалахад алдаа гарлаа');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setBarcode('');
    setName('');
    setDescription('');
    setImageUrl('');
    setDiscountPercent(10);
    setIsActive(true);
    setSelectedItems([]);
    setEditingBundleId(null);
    setProductSearch('');
  };

  const handleEditClick = (bundle: any) => {
    setEditingBundleId(bundle.id);
    setBarcode(bundle.barcode || '');
    setName(bundle.name);
    setDescription(bundle.description || '');
    setImageUrl(bundle.imageUrl || '');
    setDiscountPercent(bundle.discountPercent || 0);
    setIsActive(bundle.isActive);
    setSelectedItems(
      bundle.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleActive = async (bundle: any) => {
    try {
      const res = await fetch(`/api/bundles/${bundle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !bundle.isActive }),
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBundle = async (id: string) => {
    if (!confirm('Энэ багцыг устгахдаа итгэлтэй байна уу?')) return;
    try {
      const res = await fetch(`/api/bundles/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      (p.category?.name && p.category.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Homepage Section Title & Badge Settings */}
      <form onSubmit={handleSaveSectionSettings} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-teal-700" />
            <div>
              <h4 className="font-extrabold text-sm text-gray-900 font-sans">Нүүр Хуудасны Багцын Секшний Гарчиг Тохируулах</h4>
              <p className="text-xs text-gray-500">Нүүр хуудсан дээр харагдах секшний үндсэн гарчиг болон жижиг баж текстийг өөрчлөх.</p>
            </div>
          </div>
          {settingsSaved && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              ✓ Хадгалагдлаа!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Секшний Гарчиг (Title)</label>
            <input
              type="text"
              required
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-900"
              placeholder="🎁 ОНЦЛОХ ИЖ БҮРЭН БАГЦУУД"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Дэд Баж Текст (Badge)</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={sectionBadge}
                onChange={(e) => setSectionBadge(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-900"
                placeholder="Хямдралтай Багц Сетүүд"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shrink-0 transition-colors shadow-xs"
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Create / Edit Bundle Form */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900 font-sans flex items-center gap-2">
              🎁 {editingBundleId ? 'Багц Засах' : 'Шинэ Багц Үүсгэх'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-sans">
              Олон барааг нийлүүлж нэгж багц болгон, тусгай % хямдралтайгаар зарах тохиргоо.
            </p>
          </div>

          {editingBundleId && (
            <button
              onClick={resetForm}
              className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg"
            >
              Цуцлах (Шинэ үүсгэх)
            </button>
          )}
        </div>

        <form onSubmit={handleSaveBundle} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Basic Info & Image */}
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-teal-800 flex items-center gap-1.5">
                  <Barcode className="w-4 h-4" />
                  Багцын Бар Код (Barcode Scanner-аар уншуулах эсвэл Авто үүсгэх)
                </label>
                <div className="flex gap-2">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Багцын бар код уншуулах..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        nameInputRef.current?.focus();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-900 focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="px-3.5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg border border-gray-300 flex items-center gap-1 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Шинэ Код
                  </button>
                </div>

                {barcode && (
                  <div className="pt-2">
                    <BarcodeRenderer
                      value={barcode}
                      productName={name || 'Шинэ Багц'}
                      priceMnt={computedBundlePriceMnt}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Багцын Нэр *
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="d.g. Сургуулийн Бэлтгэл Иж Бүрэн Багц"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Тайлбар (Заавал биш)
                </label>
                <textarea
                  rows={3}
                  placeholder="Багцын онцлог, хэнд зориулагдсан талаарх тайлбар..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white"
                />
              </div>

              <div>
                <ImageUploader
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                  label="Багцын Тусгай Зураг (Заавал биш)"
                />

                {!imageUrl && selectedItems.length > 0 && (() => {
                  const firstSelectedProd = products.find((p) => p.id === selectedItems[0]?.productId);
                  if (!firstSelectedProd?.imageUrl) return null;

                  return (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900">
                      <img src={firstSelectedProd.imageUrl} alt="Auto preview" className="w-9 h-9 object-cover rounded-lg border border-blue-200 shrink-0" />
                      <span className="text-[11px] leading-tight font-medium">
                        ℹ️ Багцын тусгай зураг оруулаагүй тул сонгосон эхний барааны (<b>{firstSelectedProd.name}</b>) зураг ашиглагдана.
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Хямдрах Хувь (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white pr-7"
                    />
                    <Percent className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Төлөв:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-gray-100 text-gray-500 border border-gray-300'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isActive ? 'Идэвхтэй' : 'Идэвхгүй'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Column 2: Search & Pick Products */}
            <div className="space-y-3 lg:col-span-1 border-l border-r border-gray-100 px-0 lg:px-4">
              <label className="block text-xs font-bold text-gray-700">
                Бараа Хайж Багцад Нэмэх:
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Барааны нэр эсвэл бар кодоор хайх..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:bg-white"
                />
              </div>

              <div className="h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {filteredProducts.map((product) => {
                  const isAdded = selectedItems.some((i) => i.productId === product.id);
                  const displayPrice = product.isDiscounted && product.discountPriceMnt ? product.discountPriceMnt : product.priceMnt;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleAddItemToBundle(product)}
                      className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        isAdded
                          ? 'bg-teal-50 border-teal-300'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <img
                          src={product.imageUrl || '/placeholder.png'}
                          alt={product.name}
                          className="w-8 h-8 object-cover rounded-md border shrink-0"
                        />
                        <div className="truncate">
                          <span className="font-bold text-gray-900 block truncate">{product.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono block">
                            {formatMNT(displayPrice)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`p-1 rounded-lg shrink-0 ${
                          isAdded ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-teal-700 hover:text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 3: Selected Bundle Items & Real-time Total Calculation */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>Сонгогдсон Бараанууд ({selectedItems.length}):</span>
                {selectedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedItems([])}
                    className="text-[10px] text-red-600 underline font-bold"
                  >
                    Бүгдийг арилгах
                  </button>
                )}
              </label>

              {selectedItems.length === 0 ? (
                <div className="h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-4 text-gray-400">
                  <Gift className="w-8 h-8 mb-2 opacity-50 text-teal-700" />
                  <span className="text-xs font-bold text-gray-600">Энд багцад орох бараанууд харагдана</span>
                  <span className="text-[10px] text-gray-400 mt-1">Зүүн талын барааны жагсаалтаас дээр дарж нэмнэ үү</span>
                </div>
              ) : (
                <div className="h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {selectedItems.map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    if (!product) return null;
                    const displayPrice = product.isDiscounted && product.discountPriceMnt ? product.discountPriceMnt : product.priceMnt;

                    return (
                      <div
                        key={item.productId}
                        className="p-2 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <img
                            src={product.imageUrl || '/placeholder.png'}
                            alt={product.name}
                            className="w-8 h-8 object-cover rounded-md border shrink-0"
                          />
                          <div className="truncate">
                            <span className="font-bold text-gray-900 block truncate">{product.name}</span>
                            <span className="text-[10px] text-gray-500 font-mono block">
                              {formatMNT(displayPrice)} × {item.quantity} = {formatMNT(displayPrice * item.quantity)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.productId, Number(e.target.value))}
                            className="w-12 px-1.5 py-1 bg-gray-50 border border-gray-300 rounded-lg text-center text-xs font-bold font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromBundle(item.productId)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Price Breakdown Banner */}
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Бараануудын Түүвэр Үнэ:</span>
                  <span className="font-mono font-bold line-through text-gray-400">
                    {formatMNT(computedOriginalPriceMnt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-teal-800 font-bold">
                  <span>Хямдралын Хувь ({discPct}%):</span>
                  <span className="font-mono text-emerald-700">
                    -{formatMNT(computedOriginalPriceMnt - computedBundlePriceMnt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-black text-teal-950 border-t border-teal-200/80 pt-2">
                  <span>ЭЦСИЙН БАГЦЫН ҮНЭ:</span>
                  <span className="text-base font-extrabold text-teal-800 font-mono">
                    {formatMNT(computedBundlePriceMnt)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Gift className="w-4 h-4" />
                <span>{editingBundleId ? 'Багцын өөрчлөлтийг хадгалах' : 'Шинэ Багц Үүсгэж Нийтлэх'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Existing Product Bundles Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-gray-900 font-sans flex items-center gap-2">
          📦 Нийтлэгдсэн Багцууд ({bundles.length})
        </h3>

        {loading ? (
          <div className="text-center py-10 text-xs text-gray-500 font-bold">Багцуудыг уншиж байна...</div>
        ) : bundles.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-xs text-gray-500 font-semibold">
            Одоогоор шинээр үүсгэсэн багц байхгүй байна. Дээрх формоор багц үүсгэнэ үү.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundles.map((bundle) => {
              const isExpanded = expandedBundleId === bundle.id;

              return (
                <div
                  key={bundle.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs space-y-4 transition-all ${
                    bundle.isActive ? 'border-gray-200' : 'border-gray-300 opacity-60 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={bundle.imageUrl || bundle.items?.[0]?.product?.imageUrl || 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=600&auto=format&fit=crop&q=80'}
                      alt={bundle.name}
                      className="w-20 h-20 object-cover rounded-xl border border-gray-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded-md font-mono">
                          -{bundle.discountPercent}% ХЯМДРАЛ
                        </span>
                        {!bundle.isActive && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-bold rounded-md">
                            Идэвхгүй
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-gray-900 text-sm mt-1 truncate font-sans">{bundle.name}</h4>
                      {bundle.barcode && (
                        <span className="font-mono text-[10px] text-teal-800 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 inline-block mt-0.5">
                          🏷️ #{bundle.barcode}
                        </span>
                      )}
                      {bundle.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{bundle.description}</p>
                      )}

                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-base font-black text-teal-900 font-mono">
                          {formatMNT(bundle.bundlePriceMnt)}
                        </span>
                        <span className="text-xs text-gray-400 line-through font-mono">
                          {formatMNT(bundle.originalPriceMnt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleActive(bundle)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                          bundle.isActive
                            ? 'text-emerald-700 hover:bg-emerald-50'
                            : 'text-gray-400 hover:bg-gray-200'
                        }`}
                        title={bundle.isActive ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEditClick(bundle)}
                        className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg"
                        title="Засах"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteBundle(bundle.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Устгах"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bundle Items Toggle */}
                  <div className="border-t border-gray-100 pt-3">
                    <button
                      onClick={() => setExpandedBundleId(isExpanded ? null : bundle.id)}
                      className="w-full flex items-center justify-between text-xs font-bold text-teal-800 hover:text-teal-950 py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-teal-700" />
                        <span>Дагалдах Бараанууд ({bundle.items?.length || 0})</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-200/70">
                        {bundle.items?.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs text-gray-700 font-semibold"
                          >
                            <span className="truncate pr-2">• {item.product?.name}</span>
                            <span className="font-mono font-bold text-gray-900 shrink-0">
                              × {item.quantity} ширхэг
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

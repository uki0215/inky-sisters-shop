'use client';

import React, { useState, useMemo } from 'react';
import { formatMNT } from '@/lib/utils';
import { getFirstImageUrl } from '@/lib/imageUtils';
import { Search, Tag, Check, X, Package, RefreshCw, Sparkles } from 'lucide-react';

interface ProductSelectorProps {
  products: any[];
  categories?: any[];
  selectedProductId: string;
  onSelectProduct: (productId: string) => void;
  label?: string;
}

export default function ProductSelector({
  products = [],
  categories = [],
  selectedProductId,
  onSelectProduct,
  label = 'Онцлох Захиалах Бараа Сонгох:',
}: ProductSelectorProps) {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isChanging, setIsChanging] = useState<boolean>(false);

  // Find currently selected product
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Filter products by category/subcategory AND search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategoryFilter !== 'ALL') {
        const matchesCategory =
          p.categoryId === selectedCategoryFilter ||
          p.category?.id === selectedCategoryFilter ||
          p.category?.slug === selectedCategoryFilter ||
          p.category?.parentId === selectedCategoryFilter;

        if (!matchesCategory) return false;
      }

      // Search query filter (Name, Barcode)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name && p.name.toLowerCase().includes(q);
        const matchesBarcode = p.barcode && p.barcode.toLowerCase().includes(q);
        if (!matchesName && !matchesBarcode) return false;
      }

      return true;
    });
  }, [products, selectedCategoryFilter, searchQuery]);

  return (
    <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold text-gray-900 font-sans flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          {label}
        </label>
        {selectedProduct && !isChanging && (
          <button
            type="button"
            onClick={() => setIsChanging(true)}
            className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Солих / Арилгах</span>
          </button>
        )}
      </div>

      {/* 1. SELECTED PRODUCT DISPLAY CARD */}
      {selectedProduct && !isChanging ? (
        <div className="flex items-center justify-between p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-white border border-teal-200 overflow-hidden shrink-0 shadow-xs">
              <img
                src={getFirstImageUrl(selectedProduct.imageUrl)}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-xs font-black text-teal-950 block font-sans">
                {selectedProduct.name}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-extrabold text-red-600 font-sans">
                  {formatMNT(
                    selectedProduct.isDiscounted && selectedProduct.discountPriceMnt
                      ? selectedProduct.discountPriceMnt
                      : selectedProduct.priceMnt
                  )}
                </span>
                <span className="text-[11px] font-mono text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                  Баркод: #{selectedProduct.barcode}
                </span>
                <span className="text-[11px] font-bold text-gray-600">
                  Үлдэгдэл: {selectedProduct.stock}ш
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectProduct('');
              setIsChanging(true);
            }}
            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 transition-all shrink-0"
          >
            Цуцлах
          </button>
        </div>
      ) : (
        /* 2. REAL-TIME SEARCH & PICKER INTERFACE */
        <div className="space-y-3">
          {/* Controls: Category Dropdown & Search Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Category / Subcategory Dropdown */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 block mb-1">
                1. Ангилал / Дэд ангилалаар шүүх:
              </label>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
              >
                <option value="ALL">📦 Бүх Ангилал & Дэд ангилал</option>
                {categories.map((cat) => (
                  <React.Fragment key={cat.id}>
                    <option value={cat.id} className="font-extrabold text-teal-950">
                      📁 {cat.name}
                    </option>
                    {cat.children?.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>
                        &nbsp;&nbsp;&nbsp;&nbsp;↳ {sub.name}
                      </option>
                    ))}
                  </React.Fragment>
                ))}
              </select>
            </div>

            {/* Live Search Input */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 block mb-1">
                2. Барааны нэр эсвэл Баркодоор хайх:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Хайх нэрээ бичнэ үү..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Live Matching Product List */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-500 block">
              Илэрсэн Бараанууд ({filteredProducts.length}):
            </span>

            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                Тохирох бараа олдсонгүй. Хайх үгээ шалгана уу.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-100 bg-gray-50/50 p-2 rounded-xl border border-gray-200">
                {filteredProducts.slice(0, 10).map((product) => {
                  const isSelected = product.id === selectedProductId;

                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        onSelectProduct(product.id);
                        setIsChanging(false);
                      }}
                      className={`p-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-teal-100 border border-teal-300'
                          : 'hover:bg-white hover:shadow-xs border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={getFirstImageUrl(product.imageUrl)}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-white border border-gray-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-extrabold text-gray-900 truncate font-sans">
                            {product.name}
                          </h5>
                          <span className="text-[10px] font-mono text-gray-500 block">
                            #{product.barcode} (Үлдэгдэл: {product.stock}ш)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-black text-red-600 font-sans">
                          {formatMNT(
                            product.isDiscounted && product.discountPriceMnt
                              ? product.discountPriceMnt
                              : product.priceMnt
                          )}
                        </span>
                        <button
                          type="button"
                          className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all ${
                            isSelected
                              ? 'bg-teal-800 text-white'
                              : 'bg-teal-700 text-white hover:bg-teal-800'
                          }`}
                        >
                          {isSelected ? '✓ Сонгогдсон' : 'Сонгох'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

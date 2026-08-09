'use client';

import React, { useState, useEffect, useRef } from 'react';
import ImageUploader from '@/components/ImageUploader';
import BarcodeRenderer from '@/components/BarcodeRenderer';
import { generateBarcode, formatMNT, formatYuan, notifyDataSync } from '@/lib/utils';
import { parseImageUrls, serializeImageUrls } from '@/lib/imageUtils';
import { X, Barcode, Calculator, Save, RefreshCw, Clock } from 'lucide-react';

interface ProductModalProps {
  product?: any;
  categories: any[];
  onClose: () => void;
  onSave: () => void;
}

function formatComma(num: number | string): string {
  if (num === '' || num === undefined || num === null) return '';
  const s = num.toString().replace(/[^0-9.]/g, '');
  if (!s) return '';
  const parts = s.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function parseComma(str: string | number): number {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const clean = str.toString().replace(/,/g, '').trim();
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

export default function ProductModal({ product, categories, onClose, onSave }: ProductModalProps) {
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [costYuanRaw, setCostYuanRaw] = useState<string>('0');

  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    description: '',
    categoryId: '',
    imageUrl: '',
    costYuan: 0,
    yuanRate: 0,
    costMnt: 0,
    priceMnt: 0,
    priceYuan: 0,
    boxCount: 1,
    unitsPerBox: 1,
    stock: 0,
    isDiscounted: false,
    discountPercent: 0,
    discountPriceMnt: 0,
    discountEndDate: '',
    isFeatured: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-focus the barcode input on open
    const timer = setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (product) {
      const formattedEndDate = product.discountEndDate
        ? new Date(new Date(product.discountEndDate).getTime() - new Date().getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        : '';

      const yuanCostVal = product.costYuan || 0;
      setCostYuanRaw(yuanCostVal ? yuanCostVal.toString() : '0');

      setFormData({
        barcode: product.barcode || '',
        name: product.name || '',
        description: product.description || '',
        categoryId: product.categoryId || (categories[0]?.id || ''),
        imageUrl: product.imageUrl || '',
        costYuan: yuanCostVal,
        yuanRate: product.yuanRate || 0,
        costMnt: product.costMnt || 0,
        priceMnt: product.priceMnt || 0,
        priceYuan: product.priceYuan || 0,
        boxCount: product.boxCount || 1,
        unitsPerBox: product.unitsPerBox || 1,
        stock: product.stock || 0,
        isDiscounted: product.isDiscounted || false,
        discountPercent: product.discountPercent || 0,
        discountPriceMnt: product.discountPriceMnt || 0,
        discountEndDate: formattedEndDate,
        isFeatured: product.isFeatured || false,
      });
    } else {
      setCostYuanRaw('0');
      setFormData((prev) => ({
        ...prev,
        categoryId: prev.categoryId || categories[0]?.id || '',
      }));
    }
  }, [product]);

  const parsedCostYuan = parseComma(costYuanRaw);

  const calculatedCostMnt = (parsedCostYuan > 0 && formData.yuanRate > 0)
    ? Math.round(parsedCostYuan * formData.yuanRate)
    : (formData.costMnt || 0);

  const totalUnitsFromBox = (formData.boxCount || 1) * (formData.unitsPerBox || 1);

  const handleGenerateBarcode = () => {
    setFormData((prev) => ({ ...prev, barcode: generateBarcode() }));
  };

  const addDaysToDiscount = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    target.setMinutes(target.getMinutes() - target.getTimezoneOffset());
    setFormData((prev) => ({ ...prev, discountEndDate: target.toISOString().slice(0, 16) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.barcode || !formData.barcode.trim()) {
      setError('Бар код оруулна уу (уншуулах эсвэл "Шинэ Код" товчийг дарна уу).');
      return;
    }

    if (!formData.name || !formData.categoryId) {
      setError('Нэр болон Ангиллыг сонгоно уу.');
      return;
    }

    setLoading(true);
    setError(null);

    const submitData = {
      ...formData,
      barcode: formData.barcode.trim(),
      costYuan: parsedCostYuan,
      costMnt: calculatedCostMnt,
    };

    try {
      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Алдаа гарлаа');

      notifyDataSync();
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-2xl text-gray-900 overflow-hidden transform transition-all animate-scaleUp">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-xl font-bold text-gray-900 mb-1 font-sans">
            {product ? 'Барааны Мэдээлэл Засах' : 'Шинэ Бараа Бүртгэх (Бар код & Юанийн Тооцоо)'}
          </h3>
          <p className="text-xs text-gray-500">
            Бар кодоор уншуулах эсвэл шинээр код үүсгэн бүртгэнэ үү. Авсан өртгийг Юаниар эсвэл шууд Төгрөгөөр оруулах боломжтой.
          </p>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-teal-800 flex items-center gap-1.5">
              <Barcode className="w-4 h-4" />
              Бар Код (Barcode Scanner-аар уншуулах эсвэл Авто үүсгэх)
            </label>
            <div className="flex gap-2">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Бар код уншуулах..."
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    nameInputRef.current?.focus();
                  }
                }}
                className="flex-1 px-3.5 py-2.5 bg-white border border-teal-300 rounded-xl text-base font-mono font-extrabold text-teal-950 focus:ring-2 focus:ring-teal-500 shadow-2xs"
              />
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="px-3.5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl border border-gray-300 flex items-center gap-1 transition-all shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Шинэ Код
              </button>
            </div>

            {formData.barcode && (
              <div className="pt-2">
                <BarcodeRenderer
                  value={formData.barcode}
                  productName={formData.name || 'Шинэ Бараа'}
                  priceMnt={formData.priceMnt}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Барааны Нэр *</label>
              <input
                ref={nameInputRef}
                type="text"
                required
                placeholder="Pastel Gel Pen Set"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-teal-500 shadow-2xs"
              />
            </div>

            {/* SEPARATE DIV FOR CATEGORY */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">Барааны Ангилал *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-teal-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SEPARATE DIV FOR DESCRIPTION */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">Барааны Тайлбар</label>
              <input
                type="text"
                placeholder="Богино тайлбар бичих..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <ImageUploader
                multiple
                values={parseImageUrls(formData.imageUrl)}
                onChangeMultiple={(urls) => setFormData((prev) => ({ ...prev, imageUrl: serializeImageUrls(urls) }))}
                onChange={(url) => {
                  // only used when single image mode triggers
                  if (url && !url.startsWith('[')) {
                    setFormData((prev) => ({ ...prev, imageUrl: url }));
                  }
                }}
                label="Барааны Зурагнууд"
              />
            </div>
          </div>

          {/* YUAN CALCULATOR & COST IN MNT */}
          <div className="p-4 bg-gray-50 border border-teal-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-teal-800 flex items-center gap-1.5 uppercase">
              <Calculator className="w-4 h-4" />
              Өртөг & Ханшийн Тооцоолуур (Юань / Төгрөг)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-gray-600 block mb-1">Авсан үнэ (¥):</label>
                <input
                  type="text"
                  placeholder="0.00"
                  value={costYuanRaw}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setCostYuanRaw(raw);
                    setFormData((prev) => ({ ...prev, costYuan: parseComma(raw) }));
                  }}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-mono text-sm font-bold text-gray-900 focus:ring-2 focus:ring-teal-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">Ханш (₮):</label>
                <input
                  type="text"
                  placeholder="485"
                  value={formatComma(formData.yuanRate || '')}
                  onChange={(e) => setFormData({ ...formData, yuanRate: parseComma(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-mono text-sm font-bold text-gray-900 focus:ring-2 focus:ring-teal-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">Хайрцагны тоо:</label>
                <input
                  type="text"
                  placeholder="1"
                  value={formatComma(formData.boxCount || '')}
                  onChange={(e) => setFormData({ ...formData, boxCount: parseComma(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-mono text-sm font-bold text-gray-900 focus:ring-2 focus:ring-teal-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-gray-600 block mb-1">Хайрцаг доторх:</label>
                <input
                  type="text"
                  placeholder="1"
                  value={formatComma(formData.unitsPerBox || '')}
                  onChange={(e) => setFormData({ ...formData, unitsPerBox: parseComma(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-mono text-sm font-bold text-gray-900 focus:ring-2 focus:ring-teal-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Direct MNT cost input if costYuan is 0 or yuanRate is 0 */}
            {(parsedCostYuan === 0 || formData.yuanRate === 0) && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1">
                <label className="block text-xs font-bold text-amber-900">
                  ₮ Төгрөгийн Өртөг Оруулах (Юань 0 үед шууд төгрөгөөр) *
                </label>
                <input
                  type="text"
                  placeholder="10,000"
                  value={formatComma(formData.costMnt || '')}
                  onChange={(e) => setFormData({ ...formData, costMnt: parseComma(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-white border border-amber-400 rounded-xl font-mono text-base font-extrabold text-amber-950 focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                <span className="text-gray-500 block text-[11px]">1 ширхэг авсан өртөг (₮):</span>
                <span className="font-mono font-black text-amber-700 text-base block">
                  {formatMNT(calculatedCostMnt)}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                <span className="text-gray-500 block text-[11px]">Нийт Нийлүүлсэн Тоо:</span>
                <span className="font-mono font-black text-teal-800 text-base block">
                  {totalUnitsFromBox} ширхэг
                </span>
              </div>
            </div>
          </div>

          {/* ADMIN SELLING PRICE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white border border-gray-200 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-teal-900 mb-1">
                Нэгжийн зарах үнэ (₮) *
              </label>
              <input
                type="text"
                required
                placeholder="12,500"
                value={formatComma(formData.priceMnt || '')}
                onChange={(e) => setFormData({ ...formData, priceMnt: parseComma(e.target.value) })}
                className="w-full px-3.5 py-2 bg-teal-50/50 border border-teal-500 rounded-xl text-lg font-black font-mono text-red-600 focus:bg-white focus:ring-2 focus:ring-teal-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Нийт Үлдэгдэл Тоо Ширхэг *
              </label>
              <input
                type="text"
                required
                placeholder="100"
                value={formatComma(formData.stock || '')}
                onChange={(e) => setFormData({ ...formData, stock: parseComma(e.target.value) })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-lg font-bold font-mono text-gray-900 focus:ring-2 focus:ring-teal-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Discount options */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={formData.isDiscounted}
                  onChange={(e) => setFormData({ ...formData, isDiscounted: e.target.checked })}
                  className="w-4 h-4 rounded accent-red-500"
                />
                Хямдралтай бараа болгох
              </label>
            </div>

            {formData.isDiscounted && (
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl space-y-3 font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-gray-700 font-bold block mb-1">
                      Хямдралын хувь (%):
                    </label>
                    <input
                      type="text"
                      placeholder="15"
                      value={formData.discountPercent || ''}
                      onChange={(e) => {
                        const pct = parseComma(e.target.value);
                        const discPrice = Math.round(formData.priceMnt * (1 - pct / 100));
                        setFormData({
                          ...formData,
                          discountPercent: pct,
                          discountPriceMnt: discPrice,
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl font-mono font-bold text-rose-900 text-sm focus:ring-2 focus:ring-rose-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-gray-700 font-bold block mb-1">
                      Эцсийн Хямдарсан Үнэ (₮):
                    </label>
                    <input
                      type="text"
                      placeholder="10,500"
                      value={formatComma(formData.discountPriceMnt || '')}
                      onChange={(e) => {
                        const dPrice = parseComma(e.target.value);
                        const pct = formData.priceMnt > 0 ? Math.round(((formData.priceMnt - dPrice) / formData.priceMnt) * 100) : 0;
                        setFormData({
                          ...formData,
                          discountPriceMnt: dPrice,
                          discountPercent: Math.max(0, pct),
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-rose-400 rounded-xl font-mono font-black text-red-600 text-sm focus:ring-2 focus:ring-rose-500 shadow-2xs"
                    />
                  </div>
                </div>

                {formData.priceMnt > 0 && formData.discountPriceMnt > 0 && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-rose-200/80 font-mono">
                    <span className="text-gray-500 font-sans">Үнийн хэмнэлт:</span>
                    <span className="font-bold text-red-700">
                      -{formatMNT(formData.priceMnt - formData.discountPriceMnt)} (-{formData.discountPercent}%)
                    </span>
                  </div>
                )}

                {/* Discount Expiry Duration Picker */}
                <div className="pt-2 border-t border-rose-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-700 font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Хямдрал Дуусах Хугацаа / Огноо:</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, discountEndDate: '' }))}
                      className="text-[10px] text-gray-400 hover:text-gray-600 underline font-semibold"
                    >
                      Хугацаагүй болгох
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="datetime-local"
                      value={formData.discountEndDate || ''}
                      onChange={(e) => setFormData({ ...formData, discountEndDate: e.target.value })}
                      className="px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-mono font-bold text-gray-900 focus:ring-2 focus:ring-rose-500"
                    />

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => addDaysToDiscount(1)}
                        className="px-2 py-1 bg-white hover:bg-rose-100 text-rose-800 font-bold text-[11px] rounded-md border border-rose-200 transition-colors"
                      >
                        +1 өдөр
                      </button>
                      <button
                        type="button"
                        onClick={() => addDaysToDiscount(3)}
                        className="px-2 py-1 bg-white hover:bg-rose-100 text-rose-800 font-bold text-[11px] rounded-md border border-rose-200 transition-colors"
                      >
                        +3 өдөр
                      </button>
                      <button
                        type="button"
                        onClick={() => addDaysToDiscount(7)}
                        className="px-2 py-1 bg-white hover:bg-rose-100 text-rose-800 font-bold text-[11px] rounded-md border border-rose-200 transition-colors"
                      >
                        +7 өдөр
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              Цуцлах
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{product ? 'Өөрчлөлтийг хадгалах' : 'Бараа бүртгэх'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

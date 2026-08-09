'use client';

import React, { useState } from 'react';
import { formatMNT } from '@/lib/utils';
import { X, RefreshCw, CreditCard, Banknote, Landmark, Plus, Minus, Trash2, RotateCcw, Save, AlertCircle } from 'lucide-react';

interface OrderReturnModalProps {
  order: any;
  allProducts: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function OrderReturnModal({
  order,
  allProducts,
  onClose,
  onSuccess,
}: OrderReturnModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>(order.paymentMethod || 'TRANSFER');
  const [returnNote, setReturnNote] = useState<string>(order.returnNote || '');
  const [items, setItems] = useState<any[]>(
    (order.items || []).map((item: any) => ({ ...item }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate new total
  const newTotalMnt = items.reduce((acc, curr) => acc + (curr.priceMnt * curr.quantity), 0);
  const priceDiffMnt = newTotalMnt - order.totalMnt;

  const handleQtyChange = (productId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleAddItem = (product: any) => {
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      handleQtyChange(product.id, 1);
    } else {
      // If product is discounted, calculate using its sale price
      const effectivePrice = product.isDiscounted && product.discountPriceMnt ? product.discountPriceMnt : product.priceMnt;
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          priceMnt: effectivePrice,
          quantity: 1,
        },
      ]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          returnNote,
          updatedItems: items,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Захиалга шинэчлэхэд алдаа гарлаа');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl text-gray-900 overflow-hidden transform transition-all animate-scaleUp space-y-4 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 font-sans">
                Захиалга Засах / Буцаалт & Солилт
              </h3>
              <p className="text-xs text-gray-500 font-sans mt-0.5">
                Захиалга: <span className="font-bold text-gray-900">{order.orderNumber}</span> ({order.customerName})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* Payment Method Selector */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
            <label className="text-xs font-bold text-gray-700 block">
              💳 Төлбөрийн Хэлбэр Сонгох
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                  paymentMethod === 'TRANSFER'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Landmark className="w-4 h-4" />
                Шилжүүлэг
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                  paymentMethod === 'CARD'
                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Карт (POS)
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                Бэлэн Мөнгө
              </button>
            </div>
          </div>

          {/* Ordered Items List & Quantity controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-800">
              <span>Захиалгын Бараанууд (Бараа буцаахад үлдэгдэл нэмэгдэнэ)</span>
              <span className="text-gray-500">{items.length} төрөл</span>
            </div>

            <div className="space-y-2 border border-gray-200 rounded-2xl p-3 bg-white">
              {items.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  Бараа сонгогдоогүй байна. Бүх бараа буцаагдсан.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <span className="font-bold text-gray-900 block font-sans">
                        {(item.productName || '').replace(/\[IMG:.*?\]/g, '').trim()}
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono">#{item.barcode} | {formatMNT(item.priceMnt)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Qty +/- */}
                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.productId, -1)}
                          className="p-1 hover:bg-gray-100 text-gray-700 rounded-md transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-bold font-mono">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.productId, 1)}
                          className="p-1 hover:bg-gray-100 text-gray-700 rounded-md transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="font-extrabold text-gray-900 w-24 text-right font-mono">
                        {formatMNT(item.priceMnt * item.quantity)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                        title="Усгах/Буцаах"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Product Selector for Exchanges */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">
              ➕ Бараа Солих / Нэмэх Сонголт:
            </label>
            <select
              onChange={(e) => {
                const p = allProducts.find((prod) => prod.id === e.target.value);
                if (p) {
                  handleAddItem(p);
                  e.target.value = '';
                }
              }}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Бараа сонгож нэмэх / солих --</option>
              {allProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (#{p.barcode}) - {formatMNT(p.priceMnt)} (Үлдэгдэл: {p.stock} ш)
                </option>
              ))}
            </select>
          </div>

          {/* Return Note */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">
              📝 Буцаалт / Засварын Тэмдэглэл:
            </label>
            <textarea
              rows={2}
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="Буцаасан эсвэл сольсон шалтгаан, нөхцөлийг бичнэ үү..."
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Price Fluctuation Summary Box */}
          <div className="p-3.5 bg-gray-900 text-white rounded-2xl space-y-1.5 text-xs font-sans">
            <div className="flex justify-between text-gray-400">
              <span>Анхны Захиалгын Дүн:</span>
              <span className="font-mono">{formatMNT(order.totalMnt)}</span>
            </div>
            <div className="flex justify-between text-gray-300 font-bold">
              <span>Шинэ Захиалгын Дүн:</span>
              <span className="font-mono text-teal-400">{formatMNT(newTotalMnt)}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-gray-800 font-extrabold">
              <span>Зөрүү Дүн:</span>
              {priceDiffMnt === 0 ? (
                <span className="text-gray-400 font-mono">0₮ (Өөрчлөлтгүй)</span>
              ) : priceDiffMnt < 0 ? (
                <span className="text-red-400 font-mono">
                  Буцааж олгох: {formatMNT(Math.abs(priceDiffMnt))}
                </span>
              ) : (
                <span className="text-emerald-400 font-mono">
                  Нэмж авах: +{formatMNT(priceDiffMnt)}
                </span>
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all"
            >
              Цуцлах
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Хадгалах & Бараа Шинэчлэх</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

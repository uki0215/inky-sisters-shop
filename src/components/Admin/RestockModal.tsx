'use client';

import React, { useState } from 'react';
import { formatMNT } from '@/lib/utils';
import { X, Plus, PackageCheck, TrendingUp, TrendingDown, RefreshCw, Calculator, DollarSign } from 'lucide-react';

interface RestockModalProps {
  product: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RestockModal({ product, onClose, onSuccess }: RestockModalProps) {
  const [addQuantity, setAddQuantity] = useState<number>(10);
  const [yuanRate, setYuanRate] = useState<number>(product.yuanRate || 485);
  const [costYuan, setCostYuan] = useState<number>(product.costYuan || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rate & Cost Fluctuation Comparisons
  const prevRate = product.yuanRate || 485;
  const rateDiff = yuanRate - prevRate;

  const prevCostYuan = product.costYuan || 0;
  const costYuanDiff = costYuan - prevCostYuan;

  const prevCostMnt = product.costMnt || prevCostYuan * prevRate;
  const newCostMnt = costYuan * yuanRate;
  const costMntDiff = newCostMnt - prevCostMnt;

  const totalRestockExpenseMnt = newCostMnt * addQuantity;

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addQuantity <= 0) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addStock: addQuantity,
          yuanRate: Number(yuanRate),
          costYuan: Number(costYuan),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Нөхөн орлого авахад алдаа гарлаа');
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
      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl text-gray-900 overflow-hidden transform transition-all animate-scaleUp space-y-4">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-lg font-extrabold text-gray-900 font-sans flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-teal-700" />
            Бараа Нэмж Нөхөх & Ханш Тулгах
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            <span className="font-bold text-gray-900">{product.name}</span> (#{product.barcode})
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleRestock} className="space-y-4">
          
          {/* Restock Quantity */}
          <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-teal-950">
              <span>Одоогийн Үлдэгдэл: <span className="font-mono">{product.stock} ш</span></span>
              <span>Нэмэгдсэний дараа: <span className="font-mono text-teal-800">{product.stock + addQuantity} ш</span></span>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-800 mb-1">
                Нэмж авах ширхэгийн тоо (Pieces) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={addQuantity}
                onChange={(e) => setAddQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-white border border-teal-400 rounded-xl text-lg font-bold font-mono text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>
          </div>

          {/* RMB Rate & Yuan Cost Fluctuation Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Yuan Rate Input */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <label className="block text-[11px] font-bold text-gray-700">
                Шинэ Юанийн Ханш (₮) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={yuanRate}
                onChange={(e) => setYuanRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono font-bold text-xs text-gray-900"
              />
              <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                <span>Өмнөх: {prevRate}₮</span>
                {rateDiff !== 0 && (
                  <span className={`font-bold flex items-center gap-0.5 ${rateDiff > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {rateDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {rateDiff > 0 ? `+${rateDiff.toFixed(1)}₮` : `${rateDiff.toFixed(1)}₮`}
                  </span>
                )}
              </div>
            </div>

            {/* Yuan Cost Input */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <label className="block text-[11px] font-bold text-gray-700">
                Шинэ Авсан Үнэ (¥ Юань) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={costYuan}
                onChange={(e) => setCostYuan(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono font-bold text-xs text-gray-900"
              />
              <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                <span>Өмнөх: ¥{prevCostYuan}</span>
                {costYuanDiff !== 0 && (
                  <span className={`font-bold flex items-center gap-0.5 ${costYuanDiff > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {costYuanDiff > 0 ? `+¥${costYuanDiff.toFixed(2)}` : `¥${costYuanDiff.toFixed(2)}`}
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* FLUTTER & COST COMPARISON REPORT CARD */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-teal-300 font-bold flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5" />
                Өмнөх болон Шинэ Өртгийн Харьцуулалт:
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Live calculation</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Өмнөх 1ш Өртөг ₮:</span>
                <span className="font-mono font-bold text-slate-200">{formatMNT(prevCostMnt)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Шинэ 1ш Өртөг ₮:</span>
                <span className="font-mono font-bold text-amber-300">{formatMNT(newCostMnt)}</span>
              </div>
            </div>

            {costMntDiff !== 0 && (
              <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-800">
                <span className="text-slate-400">1ш Өртгийн Зөрүү (Ханш/Үнийн хэлбэлзэл):</span>
                <span className={`font-bold font-mono ${costMntDiff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {costMntDiff > 0 ? `+${formatMNT(costMntDiff)} (Өссөн)` : `${formatMNT(costMntDiff)} (Буурсан)`}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-black text-amber-400 font-sans">
              <span>Нийт Оруулж буй Татан авалтын Зардал:</span>
              <span className="text-sm font-mono">{formatMNT(totalRestockExpenseMnt)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900"
            >
              Цуцлах
            </button>
            <button
              type="submit"
              disabled={loading || addQuantity <= 0}
              className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Хадгалж байна...' : 'Шинэ Нөхөн Орлого Хадгалах'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

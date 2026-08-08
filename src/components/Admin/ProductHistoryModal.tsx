'use client';

import React, { useEffect, useState } from 'react';
import { formatMNT } from '@/lib/utils';
import { X, History, TrendingUp, TrendingDown, Clock, PackageCheck, AlertCircle, Calendar, RefreshCw } from 'lucide-react';

interface ProductHistoryModalProps {
  product: any;
  onClose: () => void;
}

export default function ProductHistoryModal({ product, onClose }: ProductHistoryModalProps) {
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  const filteredHistory = historyList.filter((item) => {
    if (typeFilter === 'ALL') return true;
    return item.changeType === typeFilter;
  });

  useEffect(() => {
    fetchHistory();
  }, [product.id]);

  const fetchHistory = async () => {
    if (!product?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${product.id}/history`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Түүх ачаалахад алдаа гарлаа');
      }
      setHistoryList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'RESTOCK':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'PRICE_CHANGE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'INITIAL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ORDER_RETURN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ORDER_SWAP':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ORDER_EDIT':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'POS_SALE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBadgeTitle = (type: string) => {
    switch (type) {
      case 'RESTOCK':
        return 'Орлого Нөхөн Таталт';
      case 'PRICE_CHANGE':
        return 'Үнийн Өөрчлөлт';
      case 'INITIAL':
        return 'Анхны Бүртгэл';
      case 'ORDER_RETURN':
        return 'Захиалга Буцаалт';
      case 'ORDER_SWAP':
        return 'Захиалга Солилт';
      case 'ORDER_EDIT':
        return 'Захиалга Засвар';
      case 'POS_SALE':
        return 'Кассын Борлуулалт';
      default:
        return 'Мэдээллийн Засвар';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl text-gray-900 overflow-hidden transform transition-all animate-scaleUp space-y-5 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 font-sans">
                Барааны Өөрчлөлтийн Түүх
              </h3>
              <p className="text-xs text-gray-500 font-sans mt-0.5">
                <span className="font-bold text-gray-900">{product.name}</span> (#{product.barcode})
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

        {/* Current Financial Summary Card */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
          <div>
            <span className="text-gray-500 block text-[11px]">Одоогийн Зарах Үнэ</span>
            <span className="font-extrabold text-gray-900 text-sm">{formatMNT(product.priceMnt)}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[11px]">Юанийн Авсан Үнэ</span>
            <span className="font-bold text-teal-700 text-sm">¥{product.costYuan} <span className="text-[10px] text-gray-400">({product.yuanRate}₮)</span></span>
          </div>
          <div>
            <span className="text-gray-500 block text-[11px]">Одоогийн Үлдэгдэл</span>
            <span className="font-extrabold text-teal-800 text-sm">{product.stock} ширхэг</span>
          </div>
        </div>

        {/* History Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl text-[11px] font-bold font-sans border border-gray-200">
          {[
            { id: 'ALL', label: 'Бүгд' },
            { id: 'POS_SALE', label: '🏪 Касс' },
            { id: 'RESTOCK', label: '📦 Орлого' },
            { id: 'PRICE_CHANGE', label: '💰 Үнэ' },
            { id: 'ORDER_RETURN', label: '🔄 Буцаалт' },
            { id: 'ORDER_SWAP', label: '⇄ Солилт' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTypeFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                typeFilter === f.id
                  ? 'bg-teal-700 text-white shadow-xs font-extrabold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* History List Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
              <span className="text-xs font-bold">Түүх ачаалж байна...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-bold border border-red-200">
              ⚠️ {error}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-14 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-8 h-8 text-gray-400" />
              <p className="text-sm font-bold text-gray-700">Түүх олдсонгүй</p>
              <p className="text-xs text-gray-400">Сонгосон шүүлтүүрт харгалзах түүх байхгүй байна.</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs hover:border-gray-300 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getBadgeStyle(item.changeType)}`}>
                    {getBadgeTitle(item.changeType)}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {new Date(item.createdAt).toLocaleString('mn-MN')}
                  </span>
                </div>

                <p className="text-xs font-bold text-gray-800 font-sans">
                  {item.description}
                </p>

                {/* Details Breakdown */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 pt-1 border-t border-gray-100">
                  {item.changeType === 'ORDER_RETURN' ? (
                    <>
                      {item.newCostMnt !== null && item.newCostMnt !== undefined && item.newCostMnt > 0 && (
                        <span className="px-2.5 py-1 bg-red-50 text-red-800 border border-red-200 rounded-lg font-bold">
                          Анх авсан нэгж өртөг: <span className="font-extrabold">{formatMNT(item.newCostMnt)}</span>
                        </span>
                      )}
                      {item.newPriceMnt !== null && item.newPriceMnt !== undefined && item.newPriceMnt > 0 && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg font-bold">
                          Борлуулсан нэгж үнэ: <span className="font-extrabold">{formatMNT(item.newPriceMnt)}</span>
                        </span>
                      )}
                      {item.addedStock && (
                        <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg font-bold">
                          Буцааж агуулахад оруулсан: <span className="font-extrabold">+{item.addedStock} ш</span>
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {item.oldPriceMnt !== null && item.newPriceMnt !== null && (
                        <div>
                          <span className="text-gray-400">Зарах үнэ: </span>
                          <span className="font-semibold text-gray-800">{formatMNT(item.oldPriceMnt)} → {formatMNT(item.newPriceMnt)}</span>
                        </div>
                      )}
                      {item.oldCostYuan !== null && item.newCostYuan !== null && (
                        <div>
                          <span className="text-gray-400">Авсан (¥): </span>
                          <span className="font-semibold text-teal-800">¥{item.oldCostYuan} → ¥{item.newCostYuan}</span>
                        </div>
                      )}
                      {item.oldYuanRate !== null && item.newYuanRate !== null && (
                        <div>
                          <span className="text-gray-400">Ханш: </span>
                          <span className="font-semibold text-gray-800">{item.oldYuanRate}₮ → {item.newYuanRate}₮</span>
                        </div>
                      )}
                      {item.addedStock && (
                        <div>
                          <span className="text-gray-400">Нэмсэн үлдэгдэл: </span>
                          <span className="font-extrabold text-teal-700">+{item.addedStock} ш</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-all"
          >
            Хаах
          </button>
        </div>

      </div>
    </div>
  );
}

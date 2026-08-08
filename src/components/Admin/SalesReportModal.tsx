'use client';

import React, { useEffect, useState } from 'react';
import { formatMNT } from '@/lib/utils';
import { X, FileSpreadsheet, Download, RefreshCw, ShoppingBag, TrendingUp, DollarSign, Package } from 'lucide-react';

interface SalesReportModalProps {
  onClose: () => void;
}

export default function SalesReportModal({ onClose }: SalesReportModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports/sold-products');
      if (!res.ok) throw new Error('Тайлан ачаалахад алдаа гарлаа');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/reports/sold-products?export=csv', '_blank');
  };

  const [activeTab, setActiveTab] = useState<'SOLD_PRODUCTS' | 'DELETED_ORDERS'>('SOLD_PRODUCTS');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl text-gray-900 overflow-hidden transform transition-all animate-scaleUp space-y-4 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 font-sans">
                Зарагдсан Бараа & Устгагдсан Захиалгын Тайлан
              </h3>
              <p className="text-xs text-gray-500 font-sans mt-0.5">
                Нийт борлуулалтын тоо хэмжээ, орлого болон устгагдсан захиалгын журнал
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Excel (CSV) Татах</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setActiveTab('SOLD_PRODUCTS')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'SOLD_PRODUCTS'
                ? 'bg-white text-emerald-900 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Зарагдсан Бараанууд ({data?.items?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DELETED_ORDERS')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'DELETED_ORDERS'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🗑️ Устгагдсан Захиалгын Журнал ({data?.deletedLogs?.length || 0})
          </button>
        </div>

        {/* Loading / Error / Data */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-7 h-7 animate-spin text-emerald-600" />
            <span className="text-xs font-bold">Тайлангийн тооцоолол хийгдэж байна...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-bold border border-red-200">
            ⚠️ {error}
          </div>
        ) : data ? (
          <>
            {activeTab === 'SOLD_PRODUCTS' ? (
              <>
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                    <span className="text-gray-500 block text-xs">Зарагдсан Тоо</span>
                    <span className="text-lg font-extrabold text-gray-900 font-mono">
                      {data.summary.totalSoldQty.toLocaleString()} ш
                    </span>
                  </div>

                  <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                    <span className="text-emerald-800 block text-xs font-bold">Нийт Борлуулалт</span>
                    <span className="text-lg font-extrabold text-emerald-950 font-mono">
                      {formatMNT(data.summary.totalRevenueMnt)}
                    </span>
                  </div>

                  <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200">
                    <span className="text-amber-800 block text-xs font-bold">Нийт Өртөг</span>
                    <span className="text-lg font-extrabold text-amber-950 font-mono">
                      {formatMNT(data.summary.totalCostMnt)}
                    </span>
                  </div>

                  <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-200">
                    <span className="text-teal-800 block text-xs font-bold">Нийт Ашиг</span>
                    <span className="text-lg font-extrabold text-teal-950 font-mono">
                      {formatMNT(data.summary.totalProfitMnt)}
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-gray-100 text-gray-700 text-[11px] font-bold uppercase tracking-wider font-mono border-b border-gray-200">
                      <tr>
                        <th className="p-3">Баркод</th>
                        <th className="p-3">Барааны Нэр</th>
                        <th className="p-3 text-right">Зарагдсан</th>
                        <th className="p-3 text-right">Нэгж Үнэ</th>
                        <th className="p-3 text-right">Нийт Борлуулалт</th>
                        <th className="p-3 text-right">Ашиг</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-sans">
                      {data.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-400">
                            Одоогоор зарагдсан барааны мэдээлэл байхгүй байна.
                          </td>
                        </tr>
                      ) : (
                        data.items.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-3 font-mono text-gray-500">{item.barcode}</td>
                            <td className="p-3 font-bold text-gray-900">{item.productName}</td>
                            <td className="p-3 text-right font-bold text-gray-900 font-mono">{item.totalQtySold} ш</td>
                            <td className="p-3 text-right font-mono text-gray-600">{formatMNT(item.unitPriceMnt)}</td>
                            <td className="p-3 text-right font-bold font-mono text-emerald-800">{formatMNT(item.totalRevenueMnt)}</td>
                            <td className="p-3 text-right font-bold font-mono text-teal-700">{formatMNT(item.totalProfitMnt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              /* DELETED ORDERS LOG TAB */
              <div className="flex-1 overflow-y-auto border border-rose-200 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-rose-50 text-rose-950 text-[11px] font-bold uppercase tracking-wider font-mono border-b border-rose-200">
                    <tr>
                      <th className="p-3">Устгасан Огноо</th>
                      <th className="p-3">Захиалга &amp; Дэлгэрэнгүй Мэдээлэл</th>
                      <th className="p-3 text-right">Захиалгын Дүн</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 text-xs font-sans">
                    {!data.deletedLogs || data.deletedLogs.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-gray-400">
                          Устгагдсан захиалгын журнал одоогоор байхгүй байна.
                        </td>
                      </tr>
                    ) : (
                      data.deletedLogs.map((log: any, idx: number) => (
                        <tr key={idx} className="hover:bg-rose-50/50">
                          <td className="p-3 font-mono text-gray-500 shrink-0 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString('mn-MN')}
                          </td>
                          <td className="p-3 font-medium text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {log.description}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-700 shrink-0 whitespace-nowrap">
                            {formatMNT(log.amountMnt || 0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Файлыг Excel програм дээр шууд нээхэд кирилл бичиглэл зөв харагдана (.csv UTF-8 BOM).
          </span>
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

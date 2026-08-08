'use client';

import React from 'react';
import { formatMNT, formatYuan } from '@/lib/utils';
import BarcodeRenderer from '@/components/BarcodeRenderer';
import { X, Package, Tag, Edit, Plus, DollarSign, TrendingUp, Barcode, Layers, Percent, CheckCircle2, History } from 'lucide-react';

interface ProductDetailModalProps {
  product: any;
  onClose: () => void;
  onEdit: (product: any) => void;
  onRestock: (product: any) => void;
  onHistory?: (product: any) => void;
}

export default function ProductDetailModal({
  product,
  onClose,
  onEdit,
  onRestock,
  onHistory,
}: ProductDetailModalProps) {
  if (!product) return null;

  const costMnt = (product.costYuan && product.costYuan > 0 && product.yuanRate && product.yuanRate > 0)
    ? (product.costYuan * product.yuanRate)
    : (product.costMnt || 0);
  const priceMnt = product.isDiscounted && product.discountPriceMnt ? product.discountPriceMnt : product.priceMnt;
  const unitProfitMnt = priceMnt - costMnt;
  const profitMarginPercent = costMnt > 0 ? ((unitProfitMnt / costMnt) * 100).toFixed(1) : '0';

  const totalInventoryCostMnt = costMnt * product.stock;
  const totalInventorySaleValueMnt = priceMnt * product.stock;
  const totalPotentialProfitMnt = totalInventorySaleValueMnt - totalInventoryCostMnt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl text-gray-900 overflow-hidden transform transition-all animate-scaleUp space-y-6 max-h-[90vh] overflow-y-auto font-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Header Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 shadow-xs">
            <img
              src={product.imageUrl || 'https://placehold.co/200x200?text=No+Image'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                #{product.barcode}
              </span>
              {product.category && (
                <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                  📁 {product.category.name}
                </span>
              )}
            </div>

            <h3 className="text-xl font-black text-gray-900 font-sans tracking-tight">
              {product.name}
            </h3>

            {product.description && (
              <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
            )}
          </div>
        </div>

        {/* Visual Barcode & Printable Sticker */}
        {product.barcode && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl">
            <BarcodeRenderer
              value={product.barcode}
              productName={product.name}
              priceMnt={priceMnt}
            />
          </div>
        )}

        {/* 1. FINANCIALS & RMB (YUAN) COST BREAKDOWN GRID */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Санхүү, Ханш & Барааны Өртгийн Дэлгэрэнгүй
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Yuan Cost */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <span className="text-[10px] text-gray-500 font-bold block uppercase">
                Авсан Үнэ (¥ Юань):
              </span>
              <span className="text-sm font-mono font-black text-gray-900 block">
                ¥{product.costYuan || 0}
              </span>
              <span className="text-[10px] text-gray-400 block">Татан авалтын үнэ</span>
            </div>

            {/* Yuan Rate */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <span className="text-[10px] text-gray-500 font-bold block uppercase">
                Юанийн Ханш (₮):
              </span>
              <span className="text-sm font-mono font-black text-teal-800 block">
                {product.yuanRate ? `${product.yuanRate}₮` : '0₮ (Төгрөгөөр)'}
              </span>
              <span className="text-[10px] text-gray-400 block">1¥ Юанийн ханш</span>
            </div>

            {/* Cost MNT */}
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
              <span className="text-[10px] text-teal-900 font-bold block uppercase">
                1ш Өртөг (₮ Дүн):
              </span>
              <span className="text-sm font-mono font-black text-teal-950 block">
                {formatMNT(costMnt)}
              </span>
              <span className="text-[10px] text-teal-800 block">
                {product.costYuan > 0 && product.yuanRate > 0 ? '¥ × Ханш' : 'Шууд Төгрөгийн өртөг'}
              </span>
            </div>

            {/* Selling Price */}
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
              <span className="text-[10px] text-rose-900 font-bold block uppercase">
                Зарах Үнэ (₮):
              </span>
              <span className="text-sm font-mono font-black text-red-600 block">
                {formatMNT(priceMnt)}
              </span>
              <span className="text-[10px] text-rose-700 block">
                {product.isDiscounted ? `(Хямдарсан ${product.discountPercent}%)` : (product.yuanRate > 0 ? `(¥${(priceMnt / product.yuanRate).toFixed(1)})` : '(₮ Төгрөгөөр авсан)')}
              </span>
            </div>

          </div>

          {/* PROFIT PER UNIT BANNER */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-emerald-900">
                1ш Бараанаас Гарах Үндсэн Ашиг:
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-emerald-800 font-mono">
                +{formatMNT(unitProfitMnt)}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-700 block font-mono">
                (Ашиг: +{profitMarginPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* 2. INVENTORY & BOX BREAKDOWN GRID */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Package className="w-4 h-4 text-teal-700" />
            Агуулахын Үлдэгдэл ба Хайрцагны Тооцоо
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Stock Count */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <span className="text-[11px] text-gray-500 font-bold block uppercase">
                Нийт Үлдэгдэл Ширхэг:
              </span>
              <span className="text-lg font-mono font-black text-gray-900 block">
                {product.stock} ширхэг
              </span>
              <span className="text-[10px] text-gray-400 block">
                {product.boxCount || 1} хайрцаг × {product.unitsPerBox || 1}ш
              </span>
            </div>

            {/* Total Inventory Cost */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <span className="text-[11px] text-gray-500 font-bold block uppercase">
                Нийт Үлдэгдэл Өртөг Дүн:
              </span>
              <span className="text-lg font-mono font-black text-gray-900 block">
                {formatMNT(totalInventoryCostMnt)}
              </span>
              <span className="text-[10px] text-gray-400 block">Авсан нийт өртөг</span>
            </div>

            {/* Total Retail Sale Value */}
            <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
              <span className="text-[11px] text-teal-900 font-bold block uppercase">
                Нийт Зарах Боломжит Дүн:
              </span>
              <span className="text-lg font-mono font-black text-teal-950 block">
                {formatMNT(totalInventorySaleValueMnt)}
              </span>
              <span className="text-[10px] text-teal-800 block">
                Боломжит Ашиг: +{formatMNT(totalPotentialProfitMnt)}
              </span>
            </div>

          </div>
        </div>

        {/* Action Buttons: Edit, History & Restock */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
          {onHistory && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onHistory(product);
              }}
              className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-blue-200"
            >
              <History className="w-4 h-4 text-blue-700" />
              <span>Өөрчлөлтийн Түүх</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(product);
            }}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Edit className="w-4 h-4" />
            <span>Мэдээлэл Засах</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onRestock(product);
            }}
            className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Орлого Нөхөх</span>
          </button>
        </div>

      </div>
    </div>
  );
}

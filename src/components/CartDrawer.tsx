'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { formatMNT } from '@/lib/utils';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    totalAmountMnt,
    originalTotalAmountMnt,
    totalItems,
    setIsCheckoutOpen,
  } = useCart();

  if (!isCartOpen) return null;

  const hasDiscount = originalTotalAmountMnt > totalAmountMnt;
  const savedAmount = originalTotalAmountMnt - totalAmountMnt;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white text-gray-900 shadow-2xl flex flex-col justify-between transform transition-transform animate-slideLeft border-l border-gray-200">
          
          {/* Header */}
          <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100 text-teal-800">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 font-sans">Миний Сагс</h3>
                <p className="text-xs text-gray-500">
                  {totalItems > 0 ? `Нийт ${totalItems} бараа` : 'Сагс хоосон байна'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full border border-gray-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-gray-100">
            {cart.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center text-gray-400">
                <ShoppingBag className="w-16 h-16 text-gray-200 mb-3" />
                <p className="text-sm font-bold text-gray-700">Таны сагс хоосон байна</p>
                <p className="text-xs text-gray-400 mt-1">
                  Дэлгүүрээс бараа сонгон сагсандаа нэмнэ үү.
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const itemHasDiscount = !!item.originalPriceMnt && item.originalPriceMnt > item.priceMnt;

                return (
                  <div key={item.id} className="pt-4 first:pt-0 flex items-center gap-3">
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=600&auto=format&fit=crop&q=80'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-gray-900 truncate">
                        {item.name}
                      </h5>
                      <p className="text-[11px] font-mono text-gray-400">
                        Code: {item.barcode}
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-0.5 font-mono">
                        <span className="text-sm font-extrabold text-red-600">
                          {formatMNT(item.priceMnt)}
                        </span>
                        {itemHasDiscount && (
                          <span className="text-xs font-bold text-gray-400 line-through">
                            {formatMNT(item.originalPriceMnt!)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Устгах"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-md p-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-gray-600 hover:bg-white rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-bold text-gray-900 px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="p-1 text-gray-600 hover:bg-white disabled:opacity-30 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Action */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-gray-200 bg-gray-50 space-y-3">
              {hasDiscount && (
                <div className="flex items-center justify-between text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 shadow-2xs font-sans">
                  <span className="font-bold flex items-center gap-1">🎉 Нийт хэмнэлтийн урамшуулал:</span>
                  <span className="font-extrabold font-mono text-sm">-{formatMNT(savedAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Нийт Ширхэг:</span>
                <span className="font-bold text-gray-900">{totalItems} ш</span>
              </div>
              
              <div className="flex items-baseline justify-between text-sm border-t border-gray-200 pt-2 font-sans">
                <span className="font-bold text-gray-900">Нийт Дүн:</span>
                <div className="text-right">
                  <span className="text-xl font-black text-red-600 font-mono block">
                    {formatMNT(totalAmountMnt)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs font-extrabold text-gray-400 line-through font-mono block">
                      {formatMNT(originalTotalAmountMnt)}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3 px-5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Захиалах (Бүртгэлгүй шууд)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

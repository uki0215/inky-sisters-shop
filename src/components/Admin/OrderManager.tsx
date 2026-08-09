'use client';

import React, { useState, useEffect } from 'react';
import { formatMNT } from '@/lib/utils';
import { getFirstImageUrl, parseImageUrls } from '@/lib/imageUtils';
import SalesReportModal from '@/components/Admin/SalesReportModal';
import OrderReturnModal from '@/components/Admin/OrderReturnModal';
import {
  CheckCircle2,
  MapPin,
  Mail,
  CreditCard,
  Landmark,
  Banknote,
  ChevronDown,
  ChevronUp,
  BellRing,
  Search,
  XCircle,
  FileSpreadsheet,
  RotateCcw,
  Edit2,
  History,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Layers,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
} from 'lucide-react';

interface OrderManagerProps {
  products?: any[];
  onOrderUpdate?: () => void;
}

export default function OrderManager({ products = [], onOrderUpdate }: OrderManagerProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'HAS_RETURN' | 'HAS_EDIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Modals state
  const [isSalesReportOpen, setIsSalesReportOpen] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<any | null>(null);

  // Lightbox modal state for reviewing ordered product images & quantities up close
  const [lightboxSlides, setLightboxSlides] = useState<any[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  useEffect(() => {
    if (!lightboxSlides) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxSlides(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxSlides.length - 1));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev < lightboxSlides.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxSlides]);

  const openOrderLightbox = (order: any, targetItemIdx: number) => {
    if (!order.items || order.items.length === 0) return;

    const slides: any[] = [];
    let initialSlideIdx = 0;

    order.items.forEach((item: any, itemIdx: number) => {
      const isHeader = item.productName?.startsWith('🎁');
      const isSub = item.productName?.includes('└─');
      if (isHeader || isSub) return;

      let chosenImg = item.selectedImageUrl;
      if (!chosenImg && item.productName && item.productName.includes('[IMG:')) {
        const match = item.productName.match(/\[IMG:(.*?)\]/);
        if (match && match[1]) chosenImg = match[1];
      }

      const cleanName = (item.productName || '').replace(/\[IMG:.*?\]/g, '').trim();
      const productImgs = parseImageUrls(item.product?.imageUrl);
      const combined = Array.from(new Set([chosenImg, ...productImgs].filter(Boolean))) as string[];
      const finalImgs = combined.length > 0 ? combined : ['/placeholder-product.svg'];

      finalImgs.forEach((imgUrl, imgIdx) => {
        if (itemIdx === targetItemIdx && imgIdx === 0) {
          initialSlideIdx = slides.length;
        }
        slides.push({
          imgUrl,
          name: cleanName,
          barcode: item.barcode,
          quantity: item.quantity,
          priceMnt: item.priceMnt,
          totalPriceMnt: item.quantity * item.priceMnt,
          orderNumber: order.orderNumber,
        });
      });
    });

    if (slides.length === 0) return;
    setLightboxSlides(slides);
    setLightboxIndex(initialSlideIdx);
  };

  const getOrderActionFlags = (order: any) => {
    const note = order.returnNote || '';
    const hasReturn = note.includes('Буцаасан') || note.includes('Буцаалт') || note.includes('ORDER_REFUND');
    const hasEdit = note.includes('Засвар') || note.includes('Солисон') || note.includes('Тоо нэмсэн') || note.includes('Өөрчлөгдсөн') || note.includes('ORDER_EDIT');
    return { hasReturn, hasEdit };
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?status=${filter}`);
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (e) {
      console.error('Failed to fetch orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleUpdateStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      const isCancelled = newPaymentStatus === 'CANCELLED';
      // Optimistic state update so red badges disappear instantly
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                paymentStatus: newPaymentStatus,
                ...(isCancelled ? { orderStatus: 'CANCELLED' } : {}),
              }
            : o
        )
      );

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: newPaymentStatus,
          ...(isCancelled ? { orderStatus: 'CANCELLED' } : {}),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.notification?.message) {
          setNotificationMsg(`📢 Мэдэгдэл: ${data.notification.message}`);
          setTimeout(() => setNotificationMsg(null), 5000);
        }
        fetchOrders();
        if (onOrderUpdate) onOrderUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOrder = async (targetOrder: any) => {
    const isPaid = targetOrder.paymentStatus === 'PAID';
    const confirmMsg = isPaid
      ? 'Баталгаажсан энэ захиалгыг устгах уу? (Зарагдсан захиалга тул агуулахын барааны үлдэгдэл өөрчлөгдөхгүй)'
      : 'Төлөгдөөгүй энэ захиалгыг устгах уу? (Барааны үлдэгдэл буцаан агуулах руу нэмэгдэнэ)';

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/orders/${targetOrder.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setNotificationMsg('✓ Захиалга амжилттай устгагдлаа!');
        setTimeout(() => setNotificationMsg(null), 4000);
        fetchOrders();
        if (onOrderUpdate) onOrderUpdate();
      }
    } catch (e) {
      console.error('Failed to delete order', e);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Энэ захиалгыг цуцлах уу? (Барааны үлдэгдэл буцаан нэмэгдэнэ)')) return;
    handleUpdateStatus(orderId, 'CANCELLED');
  };

  const renderPaymentMethodBadge = (method?: string) => {
    switch (method) {
      case 'CARD':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md border border-purple-200">
            <CreditCard className="w-3 h-3" /> Карт (POS)
          </span>
        );
      case 'CASH':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
            <Banknote className="w-3 h-3" /> Бэлэн мөнгө
          </span>
        );
      case 'CREDIT':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-900 rounded-md border border-rose-300">
            <Clock className="w-3 h-3 text-rose-700" /> Зээлээр (Дараа төлбөрт)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md border border-teal-200">
            <Landmark className="w-3 h-3" /> Дансны шилжүүлэг
          </span>
        );
    }
  };

  const [salesChannel, setSalesChannel] = useState<'ALL' | 'ONLINE' | 'POS' | 'CREDIT'>('ALL');

  // Filter orders by channel (Online vs POS vs Credit) and search query
  const filteredOrders = orders.filter((order) => {
    const isPos = order.orderNumber?.startsWith('POS-');
    const isCredit = order.paymentMethod === 'CREDIT' || order.paymentStatus === 'UNPAID';

    if (salesChannel === 'ONLINE' && isPos) return false;
    if (salesChannel === 'POS' && (!isPos || isCredit)) return false;
    if (salesChannel === 'CREDIT' && !isCredit) return false;

    const { hasReturn, hasEdit } = getOrderActionFlags(order);

    if (filter === 'PENDING_PAYMENT' && (order.paymentStatus === 'PAID' || order.paymentStatus === 'CANCELLED')) return false;
    if (filter === 'PAID' && order.paymentStatus !== 'PAID') return false;
    if (filter === 'CANCELLED' && order.paymentStatus !== 'CANCELLED') return false;
    if (filter === 'HAS_RETURN' && !hasReturn) return false;
    if (filter === 'HAS_EDIT' && !hasEdit) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (order.customerPhone && order.customerPhone.includes(q)) ||
      (order.orderNumber && order.orderNumber.toLowerCase().includes(q)) ||
      (order.customerName && order.customerName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 font-sans flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-700" />
              <span>Борлуулалт &amp; Захиалгын Удирдлага</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-sans">
              Онлайн захиалгууд, кассын борлуулалт болон зээлийн авлагыг шүүн харах, төлбөр баталгаажуулах
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsSalesReportOpen(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Зарагдсан Барааны Тайлан (Excel)</span>
            </button>
          </div>
        </div>

        {/* Primary Channel Filter Tabs: ALL vs ONLINE vs POS vs CREDIT */}
        <div className="flex flex-wrap items-center gap-2 p-1 bg-gray-100/90 rounded-2xl border border-gray-200 text-xs font-extrabold font-sans">
          <button
            type="button"
            onClick={() => setSalesChannel('ALL')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              salesChannel === 'ALL'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200 font-extrabold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers className="w-4 h-4 text-teal-700" />
            <span>Бүх Борлуулалт ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSalesChannel('ONLINE')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              salesChannel === 'ONLINE'
                ? 'bg-teal-700 text-white shadow-md font-extrabold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-teal-300" />
            <span>Онлайн Захиалгууд ({orders.filter((o) => !o.orderNumber?.startsWith('POS-')).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSalesChannel('POS')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              salesChannel === 'POS'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-amber-950" />
            <span>Касс ({orders.filter((o) => o.orderNumber?.startsWith('POS-') && o.paymentMethod !== 'CREDIT').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSalesChannel('CREDIT')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              salesChannel === 'CREDIT'
                ? 'bg-rose-600 text-white shadow-md font-black'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4 text-rose-200" />
            <span>Зээлээр / Авлага ({orders.filter((o) => o.paymentMethod === 'CREDIT' || o.paymentStatus === 'UNPAID').length})</span>
          </button>
        </div>

        {/* Sub-Filter Buttons & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'ALL' ? 'bg-teal-700 text-white shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Бүгд
            </button>
            <button
              onClick={() => setFilter('PENDING_PAYMENT')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'PENDING_PAYMENT' ? 'bg-amber-600 text-white shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Төлбөр хүлээгдэж буй
            </button>
            <button
              onClick={() => setFilter('PAID')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'PAID' ? 'bg-teal-700 text-white shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Баталгаажсан
            </button>
            <button
              onClick={() => setFilter('HAS_RETURN')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'HAS_RETURN' ? 'bg-teal-700 text-white shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Буцаалт
            </button>
            <button
              onClick={() => setFilter('HAS_EDIT')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'HAS_EDIT' ? 'bg-teal-700 text-white shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Засвар
            </button>
          </div>

          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Утасны дугаар (9911...), Захиалгын код (INKY-...) эсвэл Нэрээр хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-600 transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-center gap-2 shadow-xs">
          <BellRing className="w-4 h-4 text-amber-600" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs font-semibold">Захиалгуудыг уншиж байна...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-500 text-xs space-y-2 shadow-xs">
          <p className="font-bold text-gray-800 text-sm">Тохирох захиалга олдсонгүй.</p>
          <p className="text-gray-400 text-xs">
            {searchQuery ? `"${searchQuery}" хайлтад тохирох захиалга олдсонгүй.` : 'Одоогоор энэ хэсэгт захиалга байхгүй байна.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;

            // Calculate original undiscounted sum for the order card
            let originalTotal = 0;
            const subItems = order.items?.filter((it: any) => it.productName.includes('└─'));
            if (subItems && subItems.length > 0) {
              originalTotal = subItems.reduce((sum: number, it: any) => sum + (it.priceMnt || 0) * (it.quantity || 1), 0);
            } else {
              originalTotal = order.items?.reduce((sum: number, it: any) => {
                const origUnitPrice = it.product?.priceMnt && it.product.priceMnt > it.priceMnt ? it.product.priceMnt : it.priceMnt;
                return sum + origUnitPrice * (it.quantity || 1);
              }, 0);
            }
            const hasOrderDiscount = originalTotal > order.totalMnt;

            const { hasReturn, hasEdit } = getOrderActionFlags(order);

            return (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs hover:border-teal-300 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-extrabold text-teal-800 text-sm bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                        {order.orderNumber}
                      </span>

                      {renderPaymentMethodBadge(order.paymentMethod)}

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-teal-100 text-teal-900 border-teal-200'
                            : order.paymentStatus === 'CANCELLED'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-amber-100 text-amber-900 border-amber-200'
                        }`}
                      >
                        {order.paymentStatus === 'PAID'
                          ? '✓ Төлбөр Баталгаажсан'
                          : order.paymentStatus === 'CANCELLED'
                          ? '✕ Цуцлагдсан'
                          : '⏳ Төлбөр Хүлээгдэж Буй'}
                      </span>

                      {hasReturn && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-800 rounded-md border border-red-200">
                          Буцаалттай
                        </span>
                      )}

                      {hasEdit && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200">
                          Засвартай
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 mt-1.5 font-sans">
                      Захиалагч: <span className="text-gray-900 font-extrabold">{order.customerName}</span> (Утас: <span className="font-mono font-bold text-teal-800">{order.customerPhone}</span>)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const discountPercent = hasOrderDiscount && originalTotal > 0
                        ? Math.round(((originalTotal - order.totalMnt) / originalTotal) * 100)
                        : 0;

                      return (
                        <div className="text-right px-3 py-1.5 bg-gray-50 rounded-2xl border border-gray-200/80 font-mono">
                          <div className="flex items-center justify-end gap-1.5 mb-0.5">
                            <span className="text-[11px] text-gray-500 font-sans font-bold">Нийт Дүн:</span>
                            {hasOrderDiscount && discountPercent > 0 && (
                              <span className="px-1.5 py-0.2 bg-rose-600 text-white font-black text-[10px] rounded-md font-mono shadow-2xs">
                                -{discountPercent}%
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline justify-end gap-2">
                            {hasOrderDiscount && (
                              <span className="text-xs font-extrabold text-gray-400 line-through">
                                {formatMNT(originalTotal)}
                              </span>
                            )}
                            <span
                              className={`text-base font-black font-sans block leading-tight ${
                                order.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {formatMNT(order.totalMnt)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Order Edit & Return Icon Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForReturn(order)}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-200 transition-all flex items-center justify-center shrink-0"
                      title="Захиалга Засах / Буцаалт хийх"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-700" />
                    </button>

                    {(order.paymentStatus === 'PENDING_PAYMENT' || order.paymentStatus === 'UNPAID' || order.paymentMethod === 'CREDIT') && order.paymentStatus !== 'PAID' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PAID')}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 border border-emerald-600"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>✓ Төлбөр Төлөгдсөн (Авлага хаах)</span>
                      </button>
                    )}

                    {/* Cancel Order Icon Button (Shown only for pending/unpaid orders, hidden for PAID or CANCELLED) */}
                    {order.paymentStatus !== 'PAID' && order.paymentStatus !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(order.id)}
                        className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-200 transition-all flex items-center justify-center shrink-0"
                        title="Захиалга цуцлах"
                      >
                        <XCircle className="w-4 h-4 text-amber-700" />
                      </button>
                    )}

                    {/* Delete Order Icon Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition-all flex items-center justify-center shrink-0"
                      title="Захиалга бүрмөсөн устгах"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </button>

                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="p-2 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-all"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t border-gray-100 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <div>
                        <span className="text-gray-500 block font-semibold">Хүргэх Хаяг:</span>
                        <span className="text-gray-900 font-medium block mt-0.5">{order.deliveryAddress}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block font-semibold">Сонгосон Банк / Сул хэлбэр:</span>
                        <span className="text-teal-800 font-bold block mt-0.5">{order.selectedBank} ({order.paymentMethod})</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block font-semibold">Огноо:</span>
                        <span className="text-gray-900 font-mono block mt-0.5">
                          {new Date(order.createdAt).toLocaleString('mn-MN')}
                        </span>
                      </div>
                    </div>

                    {order.returnNote && (
                      <div className="p-3 bg-amber-50/80 border border-amber-200 text-amber-950 rounded-xl space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-2 font-extrabold text-xs text-amber-900 border-b border-amber-200/60 pb-1">
                          <History className="w-4 h-4 text-amber-700" />
                          <span>📜 Захиалгын засвар &amp; Буцаалтын түүх (History):</span>
                        </div>
                        <div className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed pl-1 text-gray-800">
                          {order.returnNote}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <h5 className="font-extrabold text-gray-800">Захиалсан Бараанууд &amp; Багц:</h5>
                      <div className="space-y-1">
                        {order.items?.map((item: any, itemIdx: number) => {
                          const isBundleHeader = item.productName.startsWith('🎁');
                          const isBundleSubItem = item.productName.includes('└─');

                          let itemImg = item.selectedImageUrl;
                          if (!itemImg && item.productName && item.productName.includes('[IMG:')) {
                            const match = item.productName.match(/\[IMG:(.*?)\]/);
                            if (match && match[1]) itemImg = match[1];
                          }
                          if (!itemImg) {
                            itemImg = item.product?.imageUrl;
                          }

                          const cleanName = (item.productName || '').replace(/\[IMG:.*?\]/g, '').trim();

                          return (
                            <div
                              key={item.id || itemIdx}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                                isBundleHeader
                                  ? 'bg-rose-50 border-rose-300 text-rose-950 font-black shadow-2xs'
                                  : isBundleSubItem
                                  ? 'bg-teal-50/70 border-teal-200 pl-6 text-teal-950 font-medium'
                                  : 'bg-gray-50 border-gray-200 text-gray-900 font-bold'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openOrderLightbox(order, itemIdx);
                                  }}
                                  className="relative group/img cursor-pointer shrink-0"
                                  title="Зураг томруулж үзэх"
                                >
                                  <img
                                    src={getFirstImageUrl(itemImg)}
                                    alt={cleanName}
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.svg'; }}
                                    className="w-11 h-11 object-cover rounded-lg border border-gray-200 bg-white shrink-0 shadow-2xs group-hover/img:border-teal-500 group-hover/img:scale-105 transition-all"
                                  />
                                  <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <ZoomIn className="w-4 h-4" />
                                  </div>
                                </div>

                                <div
                                  onClick={() => openOrderLightbox(order, itemIdx)}
                                  className="min-w-0 cursor-pointer group/title"
                                >
                                  <span className="truncate block font-bold text-gray-900 font-sans group-hover/title:text-teal-700 transition-colors">
                                    {cleanName}
                                  </span>
                                  <span className="font-mono text-[10px] text-gray-500 block">
                                    #{item.barcode}
                                  </span>
                                </div>
                              </div>

                              <span className="font-mono font-extrabold text-teal-950 shrink-0 ml-2 text-xs">
                                {item.quantity} ш × {formatMNT(item.priceMnt)} = {formatMNT(item.quantity * item.priceMnt)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sales Report Modal */}
      {isSalesReportOpen && (
        <SalesReportModal onClose={() => setIsSalesReportOpen(false)} />
      )}

      {/* Order Return / Edit Modal */}
      {selectedOrderForReturn && (
        <OrderReturnModal
          order={selectedOrderForReturn}
          allProducts={products}
          onClose={() => setSelectedOrderForReturn(null)}
          onSuccess={fetchOrders}
        />
      )}

      {/* LIGHTBOX SLIDER MODAL FOR ORDERED PRODUCT IMAGES */}
      {lightboxSlides && lightboxSlides.length > 0 && (() => {
        const currentSlide = lightboxSlides[lightboxIndex] || lightboxSlides[0];

        const handlePrev = () => {
          setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxSlides.length - 1));
        };

        const handleNext = () => {
          setLightboxIndex((prev) => (prev < lightboxSlides.length - 1 ? prev + 1 : 0));
        };

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fadeIn text-white font-sans select-none"
            onClick={(e) => {
              if (e.target === e.currentTarget) setLightboxSlides(null);
            }}
          >
            {/* Top Bar Controls */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-teal-800 text-teal-100 rounded-full font-mono text-xs font-bold border border-teal-600 shadow-sm">
                  Захиалга #{currentSlide.orderNumber}
                </span>
                <span className="text-xs text-gray-300 font-mono font-medium">
                  Зураг {lightboxIndex + 1} / {lightboxSlides.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setLightboxSlides(null)}
                className="p-2.5 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer shadow-lg"
                title="Хаах (Esc)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main Image View & Slide Navigation Arrows */}
            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
              {lightboxSlides.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-all z-20 hover:scale-110 active:scale-95 cursor-pointer border border-white/20 shadow-2xl"
                  title="Өмнөх зураг"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}

              <div className="relative max-w-4xl max-h-[65vh] w-full flex items-center justify-center p-2">
                <img
                  src={getFirstImageUrl(currentSlide.imgUrl)}
                  alt={currentSlide.name}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.svg'; }}
                  className="max-w-full max-h-[65vh] object-contain rounded-2xl shadow-2xl border border-white/10 animate-scaleUp"
                />
              </div>

              {lightboxSlides.length > 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-all z-20 hover:scale-110 active:scale-95 cursor-pointer border border-white/20 shadow-2xl"
                  title="Дараах зураг"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}
            </div>

            {/* Bottom Info Footer & Carousel Strip */}
            <div className="space-y-4 max-w-4xl mx-auto w-full z-10">
              {/* Product Details & Quantity Badge */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-teal-300 font-bold bg-teal-950/70 px-2 py-0.5 rounded border border-teal-700/50">
                      #{currentSlide.barcode}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-black text-xs rounded-full border border-emerald-500/40 font-mono">
                      Захиалсан тоо: {currentSlide.quantity} ш
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white truncate font-sans">
                    {currentSlide.name}
                  </h4>
                </div>

                <div className="text-right font-mono shrink-0 bg-black/40 px-4 py-2 rounded-xl border border-white/10">
                  <span className="text-[11px] text-gray-400 block font-sans">Тоо ширхэг × Үнэ:</span>
                  <span className="text-lg font-black text-emerald-400 block">
                    {currentSlide.quantity} ш × {formatMNT(currentSlide.priceMnt)} = {formatMNT(currentSlide.totalPriceMnt)}
                  </span>
                </div>
              </div>

              {/* Horizontal Carousel Thumbnails */}
              {lightboxSlides.length > 1 && (
                <div className="flex items-center justify-center gap-2.5 overflow-x-auto py-1 scrollbar-thin max-w-full">
                  {lightboxSlides.map((slide, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        lightboxIndex === idx
                          ? 'border-teal-400 scale-105 ring-2 ring-teal-400/60 shadow-xl opacity-100'
                          : 'border-white/20 opacity-50 hover:opacity-90 hover:border-white/50'
                      }`}
                    >
                      <img
                        src={getFirstImageUrl(slide.imgUrl)}
                        alt={slide.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

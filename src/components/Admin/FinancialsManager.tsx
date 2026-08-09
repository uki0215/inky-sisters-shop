'use client';

import React, { useState, useEffect } from 'react';
import { formatMNT } from '@/lib/utils';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Plus,
  Trash2,
  Download,
  Calendar,
  FileSpreadsheet,
  Building2,
  Zap,
  Droplets,
  Wifi,
  Utensils,
  MoreHorizontal,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Package,
  Tag,
  Sparkles,
  Banknote,
  Landmark,
  CreditCard,
  Clock,
  RefreshCw,
  ShoppingCart,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function FinancialsManager() {
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('inky_admin_cached_financials');
        if (cached) return false;
      } catch (e) {}
    }
    return true;
  });
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'TRANSFER' | 'CARD' | 'CREDIT'>('ALL');
  
  // Collapsible Section Toggle States
  const [showLifetimeSection, setShowLifetimeSection] = useState(true);
  const [showCurrentInventorySection, setShowCurrentInventorySection] = useState(true);
  const [showPaymentMethodsSection, setShowPaymentMethodsSection] = useState(true);

  const [financialData, setFinancialData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('inky_admin_cached_financials');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return { totalSales: 0, paidSales: 0, totalProfit: 0, totalOrders: 0, orders: [] };
  });

  const [expenses, setExpenses] = useState<any[]>([]);

  // Form state for adding an operating expense
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'Түрээс',
    amountMnt: '',
    note: '',
  });

  const [addingExpense, setAddingExpense] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const expenseCategories = [
    { name: 'Түрээс', icon: <Building2 className="w-3.5 h-3.5 text-blue-600" />, color: 'bg-blue-50 border-blue-200 text-blue-800' },
    { name: 'Ус', icon: <Droplets className="w-3.5 h-3.5 text-cyan-600" />, color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
    { name: 'Тог', icon: <Zap className="w-3.5 h-3.5 text-amber-600" />, color: 'bg-amber-50 border-amber-200 text-amber-800' },
    { name: 'Интернэт', icon: <Wifi className="w-3.5 h-3.5 text-purple-600" />, color: 'bg-purple-50 border-purple-200 text-purple-800' },
    { name: 'Хоолны мөнгө', icon: <Utensils className="w-3.5 h-3.5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { name: 'Бусад зардал', icon: <MoreHorizontal className="w-3.5 h-3.5 text-gray-600" />, color: 'bg-gray-50 border-gray-200 text-gray-800' },
  ];

  const fetchData = async () => {
    const hasCachedFin = !!localStorage.getItem('inky_admin_cached_financials');
    if (!hasCachedFin) setLoading(true);
    try {
      const [resFin, resExp] = await Promise.all([
        fetch('/api/financials'),
        fetch('/api/expenses'),
      ]);

      const [dataFin, dataExp] = await Promise.all([resFin.json(), resExp.json()]);

      if (dataFin) {
        setFinancialData(dataFin);
        try { localStorage.setItem('inky_admin_cached_financials', JSON.stringify(dataFin)); } catch (e) {}
      }
      if (Array.isArray(dataExp)) setExpenses(dataExp);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amountMnt) return;

    setAddingExpense(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense),
      });

      if (res.ok) {
        setNewExpense({
          title: '',
          category: 'Түрээс',
          amountMnt: '',
          note: '',
        });
        showNotice('✓ Урсгал зардал амжилттай бүртгэгдлээ.');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Энэ зардлын бичилтийг устгах уу?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotice('✓ Зардал устгагдлаа.');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showNotice = (msg: string) => {
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg(null), 3000);
  };

  // Calculations
  const paidSales = financialData.paidSales ?? financialData.totalIncomeMnt ?? 0;
  const grossProfit = financialData.totalProfit ?? financialData.netProfitMnt ?? 0;
  const totalOperatingExpenses = expenses.reduce((sum, exp) => sum + (exp.amountMnt || 0), 0); // Нийт Урсгал зардал
  const netProfit = grossProfit - totalOperatingExpenses; // Цэвэр ашиг

  const posSalesTotal = financialData.posSalesMnt ?? (financialData.orders || [])
    .filter((o: any) => o.paymentStatus === 'PAID' && (o.orderNumber?.startsWith('POS-') || o.deliveryAddress?.includes('POS')))
    .reduce((acc: number, curr: any) => acc + curr.totalMnt, 0);

  const onlineSalesTotal = financialData.onlineSalesMnt ?? (financialData.orders || [])
    .filter((o: any) => o.paymentStatus === 'PAID' && !o.orderNumber?.startsWith('POS-') && !o.deliveryAddress?.includes('POS'))
    .reduce((acc: number, curr: any) => acc + curr.totalMnt, 0);

  // Payment Method Totals & Active Order Counts
  // (order.totalMnt is dynamically updated when items are returned or edited)
  const cashPaidOrders = (financialData.orders || []).filter(
    (o: any) => o.paymentStatus === 'PAID' && o.paymentMethod === 'CASH' && o.totalMnt > 0
  );
  const cashOrdersTotal = cashPaidOrders.reduce((acc: number, curr: any) => acc + curr.totalMnt, 0);
  const cashOrdersCount = cashPaidOrders.length;

  const transferPaidOrders = (financialData.orders || []).filter(
    (o: any) => o.paymentStatus === 'PAID' && (o.paymentMethod === 'TRANSFER' || !o.paymentMethod) && o.totalMnt > 0
  );
  const transferOrdersTotal = transferPaidOrders.reduce((acc: number, curr: any) => acc + curr.totalMnt, 0);
  const transferOrdersCount = transferPaidOrders.length;

  const cardPaidOrders = (financialData.orders || []).filter(
    (o: any) => o.paymentStatus === 'PAID' && o.paymentMethod === 'CARD' && o.totalMnt > 0
  );
  const cardOrdersTotal = cardPaidOrders.reduce((acc: number, curr: any) => acc + curr.totalMnt, 0);
  const cardOrdersCount = cardPaidOrders.length;

  const creditPaidOrders = (financialData.orders || []).filter(
    (o: any) => (o.paymentMethod === 'CREDIT' || o.paymentStatus === 'UNPAID') && o.paymentStatus !== 'PAID' && o.totalMnt > 0
  );
  const creditOrdersTotal = creditPaidOrders.reduce((acc: number, curr: any) => acc + curr.totalMnt, 0);
  const creditOrdersCount = creditPaidOrders.length;

  // EXCEL / CSV EXPORT GENERATOR
  const handleExportExcel = () => {
    // Construct CSV string with UTF-8 BOM
    let csv = '\uFEFF';

    // 1. REPORT HEADER
    csv += `"INKY SISTERS — САНХҮҮ БА УРСГАЛ ЗАРДЛЫН НЭГДСЭН ТАЙЛАН"\n`;
    csv += `"Огноо: ${new Date().toLocaleDateString('mn-MN')}"\n\n`;

    // 2. FINANCIAL SUMMARY TABLE
    csv += `"САНХҮҮГИЙН НЭГДСЭН НҮҮР"\n`;
    csv += `"Үзүүлэлт","Дүн (₮)"\n`;
    csv += `"Нийт Борлуулалтын Орлого","${financialData.paidSales}"\n`;
    csv += `"Барааны Өртөг / Борлуулалтын Үндсэн Ашиг","${grossProfit}"\n`;
    csv += `"Нийт Урсгал Зардал (Түрээс, Тог, Ус г.м)","${totalOperatingExpenses}"\n`;
    csv += `"ЦЭВЭР АШИГ (Net Profit)","${netProfit}"\n\n`;

    // 3. LIFETIME INVENTORY METRICS (NON-DECREASING)
    csv += `"НИЙТ ТАТАН АВАЛТЫН ТҮҮХЭН НЭГДСЭН ДҮН (Огт Хасагдахгүй)"\n`;
    csv += `"Нийт Татан Авалтын Өртөг Дүн","${financialData.totalPurchasedCostMnt || 0}"\n`;
    csv += `"Нийт Татан Авалтын Зарах Дүн","${financialData.totalPurchasedSaleValueMnt || 0}"\n`;
    csv += `"Нийт Татан Авалтын Боломжит Ашиг","${financialData.totalPurchasedPotentialProfitMnt || 0}"\n\n`;

    // 4. CURRENT INVENTORY METRICS
    csv += `"ОДООГИЙН АГУУЛАХЫН ҮЛДЭГДЭЛ БАРААНЫ ТООЦОО"\n`;
    csv += `"Одоогийн Үлдэгдэл Барааны Өртөг","${financialData.currentInventoryCostMnt || 0}"\n`;
    csv += `"Одоогийн Үлдэгдэл Барааны Зарах Дүн","${financialData.currentInventorySaleValueMnt || 0}"\n`;
    csv += `"Одоогийн Үлдэгдэл Барааны Боломжит Ашиг","${financialData.currentInventoryPotentialProfitMnt || 0}"\n\n`;

    // 5. OPERATING EXPENSES BREAKDOWN TABLE
    csv += `"УРСГАЛ ЗАРДЛЫН ДЭЛГЭРЭНГҮЙ БҮРТГЭЛ"\n`;
    csv += `"Огноо","Ангилал","Зардлын Нэр / Түүх","Тайбар / Тэмдэглэл","Дүн (₮)"\n`;

    expenses.forEach((exp) => {
      const dateStr = new Date(exp.createdAt).toLocaleDateString('mn-MN');
      csv += `"${dateStr}","${exp.category}","${exp.title.replace(/"/g, '""')}","${(exp.note || '').replace(/"/g, '""')}","${exp.amountMnt}"\n`;
    });

    csv += `\n"ЗАХИАЛГЫН БОРЛУУЛАЛТЫН ТАЙЛАН"\n`;
    csv += `"Захиалгын №","Захиалагч","Утас","Төлбөрийн Төлөв","Огноо","Нийт Дүн (₮)"\n`;

    (financialData.orders || []).forEach((ord: any) => {
      const dateStr = new Date(ord.createdAt).toLocaleDateString('mn-MN');
      csv += `"${ord.orderNumber}","${ord.customerName}","${ord.customerPhone}","${ord.paymentStatus}","${dateStr}","${ord.totalMnt}"\n`;
    });

    // Create Blob and trigger File Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Inky_Sisters_Financial_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotice('📊 Санхүүгийн тайлан Excel (CSV) файлуудаар амжилттай татагдлаа.');
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 font-sans flex items-center gap-2">
            <PieChart className="w-6 h-6 text-teal-700" />
            Санхүүгийн Хяналт &amp; Урсгал Зардал
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            Орлого, ашиг болон урсгал зардлыг тооцоолон цэвэр ашгийг хянаж, тайлан татах.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-gray-200"
            title="Тооцооллыг дахин шинэчлэх"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-700 ${loading ? 'animate-spin' : ''}`} />
            <span>Шинэчлэх</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Excel Тайлан Татах (CSV)</span>
          </button>
        </div>
      </div>

      {noticeMsg && (
        <div className="p-3 bg-teal-100 text-teal-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-teal-700" />
          <span>{noticeMsg}</span>
        </div>
      )}


      {/* SECTION 2: CURRENT IN-STOCK INVENTORY METRICS */}
      <div className="bg-white border border-gray-200 p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
        <div 
          onClick={() => setShowCurrentInventorySection(!showCurrentInventorySection)}
          className="flex items-center justify-between cursor-pointer select-none border-b border-gray-100 pb-3 group"
        >
          <div>
            <h3 className="text-base font-extrabold text-gray-900 font-sans flex items-center gap-2 group-hover:text-teal-700 transition-colors">
              <Package className="w-5 h-5 text-teal-700" />
              Агуулахын Үлдэгдэл
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-sans">
              Бэлэн байгаа барааны өртөг, зарах дүн ба боломжит ашиг.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-block text-[11px] font-bold font-mono bg-teal-50 text-teal-800 px-3 py-1 rounded-full border border-teal-200">
              Бодит үлдэгдэл
            </span>
            <button
              type="button"
              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
              title={showCurrentInventorySection ? "Хураах" : "Задрах"}
            >
              {showCurrentInventorySection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {showCurrentInventorySection && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
            {/* Card A: Current Inventory Cost */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <span className="text-xs text-gray-500 font-bold flex items-center gap-1.5 uppercase">
                <Package className="w-4 h-4 text-slate-600" />
                Үлдэгдлийн Өртөг:
              </span>
              <span className="text-xl font-extrabold text-gray-900 block font-sans">
                {formatMNT(financialData.currentInventoryCostMnt || 0, true)}
              </span>
              <span className="text-[11px] text-gray-500 block">
                Татан авалтын нийт өртөг
              </span>
            </div>

            {/* Card B: Inventory Retail Sale Value */}
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
              <span className="text-xs text-teal-900 font-bold flex items-center gap-1.5 uppercase">
                <Tag className="w-4 h-4 text-teal-700" />
                Зарах Боломжит Дүн:
              </span>
              <span className="text-xl font-extrabold text-teal-950 block font-sans">
                {formatMNT(financialData.currentInventorySaleValueMnt || 0, true)}
              </span>
              <span className="text-[11px] text-teal-800 block">
                Бүрэн зарагдвал олох орлого
              </span>
            </div>

            {/* Card C: Inventory Potential Profit */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <span className="text-xs text-emerald-900 font-bold flex items-center gap-1.5 uppercase">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                Боломжит Ашиг:
              </span>
              <span className="text-xl font-extrabold text-emerald-800 block font-sans">
                {formatMNT(financialData.currentInventoryPotentialProfitMnt || 0, true)}
              </span>
              <span className="text-[11px] text-emerald-800 block">
                Өртөг хассан цэвэр ашиг
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ROW 1.5: PAYMENT METHOD BREAKDOWN (CASH vs TRANSFER vs CARD) */}
      <div className="bg-white border border-gray-200 p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
        <div 
          onClick={() => setShowPaymentMethodsSection(!showPaymentMethodsSection)}
          className="flex items-center justify-between cursor-pointer select-none border-b border-gray-100 pb-3 group"
        >
          <div>
            <h3 className="text-base font-extrabold text-gray-900 font-sans flex items-center gap-2 group-hover:text-teal-700 transition-colors">
              <CreditCard className="w-5 h-5 text-teal-700" />
              Төлбөрийн Орлого
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-sans">
              Бэлэн, шилжүүлэг, карт болон зээлийн тооцоо.
            </p>
          </div>
          <button
            type="button"
            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all shrink-0"
            title={showPaymentMethodsSection ? "Хураах" : "Задрах"}
          >
            {showPaymentMethodsSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showPaymentMethodsSection && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
            {/* Cash Sales Card */}
            <div
              onClick={() => setPaymentFilter(paymentFilter === 'CASH' ? 'ALL' : 'CASH')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                paymentFilter === 'CASH'
                  ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500/20'
                  : 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-extrabold text-emerald-900 uppercase">
                <span className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-700" />
                  Бэлэн мөнгө
                </span>
                <span className="text-xs bg-emerald-200/80 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {cashOrdersCount}
                </span>
              </div>
              <span className="text-xl font-extrabold text-emerald-950 block font-sans mt-2">
                {formatMNT(cashOrdersTotal, true)}
              </span>
              <span className="text-[11px] text-emerald-800 block mt-0.5">
                Бэлнээр тушаагдсан орлого
              </span>
            </div>

            {/* Transfer Sales Card */}
            <div
              onClick={() => setPaymentFilter(paymentFilter === 'TRANSFER' ? 'ALL' : 'TRANSFER')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                paymentFilter === 'TRANSFER'
                  ? 'bg-teal-100 border-teal-400 ring-2 ring-teal-500/20'
                  : 'bg-teal-50/70 border-teal-200 hover:border-teal-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-extrabold text-teal-900 uppercase">
                <span className="flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-teal-700" />
                  Дансны Шилжүүлэг
                </span>
                <span className="text-xs bg-teal-200/80 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {transferOrdersCount}
                </span>
              </div>
              <span className="text-xl font-extrabold text-teal-950 block font-sans mt-2">
                {formatMNT(transferOrdersTotal, true)}
              </span>
              <span className="text-[11px] text-teal-800 block mt-0.5">
                Данс болон QR орлого
              </span>
            </div>

            {/* Card / POS Sales Card */}
            <div
              onClick={() => setPaymentFilter(paymentFilter === 'CARD' ? 'ALL' : 'CARD')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                paymentFilter === 'CARD'
                  ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-500/20'
                  : 'bg-purple-50/70 border-purple-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-extrabold text-purple-900 uppercase">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-purple-700" />
                  Карт (POS)
                </span>
                <span className="text-xs bg-purple-200/80 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {cardOrdersCount}
                </span>
              </div>
              <span className="text-xl font-extrabold text-purple-950 block font-sans mt-2">
                {formatMNT(cardOrdersTotal, true)}
              </span>
              <span className="text-[11px] text-purple-800 block mt-0.5">
                Пос терминалын орлого
              </span>
            </div>

            {/* Credit / Receivable Sales Card */}
            <div
              onClick={() => setPaymentFilter(paymentFilter === 'CREDIT' ? 'ALL' : 'CREDIT')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                paymentFilter === 'CREDIT'
                  ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-500/20'
                  : 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-extrabold text-rose-900 uppercase">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-700" />
                  Зээл / Авлага
                </span>
                <span className="text-xs bg-rose-200/80 px-2.5 py-0.5 rounded-full font-mono text-rose-950 font-bold">
                  {creditOrdersCount}
                </span>
              </div>
              <span className="text-xl font-extrabold text-rose-950 block font-sans mt-2">
                {formatMNT(creditOrdersTotal, true)}
              </span>
              <span className="text-[11px] text-rose-800 block mt-0.5">
                Дараа төлбөрт авлага
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ROW 2: FINANCIAL STAT CARDS (GROSS PROFIT vs OPERATING EXPENSES vs NET PROFIT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Sales (With POS vs Online Breakdown) */}
        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
            <span>Нийт Борлуулалт</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 font-sans">
            {formatMNT(paidSales, true)}
          </div>
          <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-1 text-[11px] font-mono">
            <div>
              <span className="text-gray-400 block font-sans text-[10px]">Кассаар:</span>
              <span className="font-bold text-amber-900">{formatMNT(posSalesTotal, true)}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-sans text-[10px]">Онлайнаар:</span>
              <span className="font-bold text-teal-800">{formatMNT(onlineSalesTotal, true)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Gross Profit */}
        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
            <span>Үндсэн Ашиг</span>
            <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-sans">
            {formatMNT(grossProfit, true)}
          </div>
          <span className="text-[11px] text-gray-400 block">
            Өртөг хассан ашиг
          </span>
        </div>

        {/* Card 3: Total Operating Expenses */}
        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
            <span>Урсгал Зардал</span>
            <ArrowDownCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-sans">
            -{formatMNT(totalOperatingExpenses, true)}
          </div>
          <span className="text-[11px] text-gray-400 block">
            Түрээс, тог, ус, бусад
          </span>
        </div>

        {/* Card 4: NET PROFIT (ЦЭВЭР АШИГ) */}
        <div className={`p-5 rounded-2xl border shadow-md space-y-2 ${
          netProfit >= 0
            ? 'bg-gradient-to-br from-teal-900 to-slate-900 text-white border-teal-800'
            : 'bg-gradient-to-br from-rose-950 to-slate-900 text-white border-rose-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-teal-200">
            <span>Цэвэр Ашиг (Net)</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-sans text-amber-300">
            {formatMNT(netProfit, true)}
          </div>
          <span className="text-[11px] text-teal-100/80 block">
            Үндсэн ашгаас зардлыг хассан дүн
          </span>
        </div>

      </div>

      {/* OPERATING EXPENSES RECORDING FORM */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-gray-900 font-sans flex items-center gap-2">
          <Plus className="w-4 h-4 text-teal-700" />
          Урсгал Зардал Бүртгэх
        </h3>

        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Зардлын Ангилал *</label>
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white"
            >
              <option value="Түрээс">Түрээсийн төлбөр</option>
              <option value="Ус">Усны мөнгө</option>
              <option value="Тог">Тог / Цахилгаан</option>
              <option value="Интернэт">Интернэт / Нэхэмжлэх</option>
              <option value="Хоолны мөнгө">Хоолны мөнгө</option>
              <option value="Бусад зардал">Бусад зардал</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Зардлын Утга / Нэр *</label>
            <input
              type="text"
              required
              placeholder="e.g. Дэлгүүрийн 7 сарын түрээс"
              value={newExpense.title}
              onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Зарцуулсан Дүн (₮) *</label>
            <input
              type="number"
              required
              placeholder="e.g. 500000"
              value={newExpense.amountMnt}
              onChange={(e) => setNewExpense({ ...newExpense, amountMnt: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-900 focus:bg-white"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={addingExpense}
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Зардал Бүртгэх</span>
            </button>
          </div>
        </form>
      </div>

      {/* OPERATING EXPENSES BREAKDOWN TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-extrabold text-gray-900 font-sans">
            Урсгал Зардлын Түүх ({expenses.length})
          </h3>
          <span className="text-xs font-mono font-bold text-rose-600">
            Нийт зардал: -{formatMNT(totalOperatingExpenses, true)}
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            Бүртгэгдсэн урсгал зардал байхгүй байна. Дээрх форм ашиглан нэмнэ үү.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase font-mono border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Огноо</th>
                  <th className="py-3 px-4">Ангилал</th>
                  <th className="py-3 px-4">Зардлын Нэр</th>
                  <th className="py-3 px-4 text-right">Зарцуулсан Дүн (₮)</th>
                  <th className="py-3 px-4 text-center">Устгах</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {expenses.map((exp) => {
                  const catObj = expenseCategories.find((c) => c.name === exp.category) || expenseCategories[5];
                  return (
                    <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-gray-500 whitespace-nowrap">
                        {new Date(exp.createdAt).toLocaleDateString('mn-MN')}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-extrabold text-[11px] ${catObj.color}`}>
                          {catObj.icon}
                          <span>{exp.category}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {exp.title}
                        {exp.note && <span className="block text-[10px] text-gray-400 font-normal">{exp.note}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 font-mono text-sm whitespace-nowrap">
                        -{formatMNT(exp.amountMnt, true)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Устгах"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DELETED ORDERS AUDIT LOG TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 font-sans flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              Устгагдсан Захиалгууд ({(financialData.deletedLogs || []).length})
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-sans">
              Устгагдсан захиалгуудын бүртгэл. Баталгаажсан захиалгын орлого хасагдахгүй.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Устгагдсан: {(financialData.deletedLogs || []).length}
          </span>
        </div>

        {(financialData.deletedLogs || []).length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 font-sans">
            Одоогоор устгагдсан захиалгын бичилт байхгүй байна.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase font-mono border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Устгасан Огноо</th>
                  <th className="py-3 px-4">Захиалгын Төлөв</th>
                  <th className="py-3 px-4">Дэлгэрэнгүй Мэдээлэл & Бараанууд</th>
                  <th className="py-3 px-4 text-right">Захиалгын Дүн (₮)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {(financialData.deletedLogs || []).map((log: any) => {
                  const isPaid = log.type === 'PAID_ORDER_DELETED' || log.description?.includes('[Төлөв: Төлөгдсөн]');
                  // Strip base64 image blobs and [IMG:...] tags from description before display
                  const cleanDescription = (log.description || '')
                    .replace(/\[IMG:[^\]]{0,30000}\]/g, '')
                    .replace(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]{0,100000}/g, '')
                    .trim();
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('mn-MN')}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-extrabold text-[11px] ${
                            isPaid
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-gray-100 border-gray-300 text-gray-700'
                          }`}
                        >
                          {isPaid ? '✅ Баталгаажсан (Төлөгдсөн)' : '⏳ Баталгаажаагүй'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900 leading-relaxed max-w-md break-words overflow-hidden">
                        {cleanDescription}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 font-mono text-sm whitespace-nowrap">
                        {formatMNT(log.amountMnt, true)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

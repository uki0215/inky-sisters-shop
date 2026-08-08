'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatMNT, formatYuan } from '@/lib/utils';
import ProductModal from '@/components/Admin/ProductModal';
import RestockModal from '@/components/Admin/RestockModal';
import ProductDetailModal from '@/components/Admin/ProductDetailModal';
import ProductHistoryModal from '@/components/Admin/ProductHistoryModal';
import OrderManager from '@/components/Admin/OrderManager';
import BankManager from '@/components/Admin/BankManager';
import CategoryManager from '@/components/Admin/CategoryManager';
import PromotionManager from '@/components/Admin/PromotionManager';
import FinancialsManager from '@/components/Admin/FinancialsManager';
import ProfileManager from '@/components/Admin/ProfileManager';
import FeaturedCollectionManager from '@/components/Admin/FeaturedCollectionManager';
import BarcodeListener from '@/components/BarcodeListener';
import ImageUploader from '@/components/ImageUploader';
import ProductSelector from '@/components/Admin/ProductSelector';
import PosManager from '@/components/Admin/PosManager';
import BundleManager from '@/components/Admin/BundleManager';
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertCircle,
  Plus,
  Edit,
  Eye,
  History,
  PackagePlus,
  Search,
  Barcode,
  ShoppingBag,
  Layers,
  QrCode,
  Sparkles,
  ArrowLeft,
  Settings,
  ChevronRight,
  ShieldCheck,
  User,
  Lock,
  LogOut,
  Key,
  CheckCircle2,
  Bell,
  AlertTriangle,
  X,
  CheckCheck,
  Trash2,
  Gift,
} from 'lucide-react';

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginUsername, setLoginUsername] = useState('inkysisters');
  const [loginPassword, setLoginPassword] = useState('inkysisters');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'pos' | 'financials' | 'products' | 'orders' | 'bundles' | 'categories' | 'banks' | 'promotions' | 'collections' | 'settings' | 'profile'
  >('pos');

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any>(null);
  const [settings, setSettings] = useState<any>({ showStockQuantity: true });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<any | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<any | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<any | null>(null);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<any | null>(null);

  // DB Reset Security Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetModalPassInput, setResetModalPassInput] = useState('');
  const [resetModalError, setResetModalError] = useState<string | null>(null);
  const [resetModalLoading, setResetModalLoading] = useState(false);
  const [forgotEmailNotice, setForgotEmailNotice] = useState<string | null>(null);
  const [forgotEmailLoading, setForgotEmailLoading] = useState(false);

  // Real-time Notification States
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const knownOrderIdsRef = React.useRef<Set<string>>(new Set());
  const [newOrderToast, setNewOrderToast] = useState<any | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const isFirstLoadRef = React.useRef(true);

  // Play synthesized notification sound when new order arrives
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.error('Audio play error:', e);
    }
  };

  const fetchOrdersRealtime = async () => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrdersList(data);

        if (!isFirstLoadRef.current) {
          // Only trigger sound & toast for ONLINE customer orders (skip POS cashier sales)
          const newOnlineOrders = data.filter(
            (o: any) => !knownOrderIdsRef.current.has(o.id) && !o.orderNumber?.startsWith('POS-')
          );
          if (newOnlineOrders.length > 0) {
            const latest = newOnlineOrders[0];
            setNewOrderToast(latest);
            playNotificationSound();
          }
        }

        const idSet = new Set<string>(data.map((o: any) => o.id));
        knownOrderIdsRef.current = idSet;
        isFirstLoadRef.current = false;
      }
    } catch (err) {
      console.error('Order fetch error:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrdersRealtime();
      const interval = setInterval(fetchOrdersRealtime, 3000); // Fast 3s real-time polling interval
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Track read / dismissed notifications
  const [readOrderIds, setReadOrderIds] = useState<Set<string>>(new Set());
  const [dismissedStockIds, setDismissedStockIds] = useState<Set<string>>(new Set());

  // Load read notifications state from localStorage on mount
  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem('admin_read_order_ids');
      if (savedOrders) setReadOrderIds(new Set(JSON.parse(savedOrders)));
      const savedStock = localStorage.getItem('admin_dismissed_stock_ids');
      if (savedStock) setDismissedStockIds(new Set(JSON.parse(savedStock)));
    } catch (e) {
      console.error('Failed to load read notifications from localStorage', e);
    }
  }, []);

  // Low stock alert threshold: 5 or less
  const lowStockProducts = React.useMemo(() => {
    return products.filter((p) => (p.stock || 0) <= 5 && !dismissedStockIds.has(p.id));
  }, [products, dismissedStockIds]);

  // Unread ONLINE orders (Exclude POS sales and Exclude Confirmed/Paid orders)
  const unreadOrders = React.useMemo(() => {
    return ordersList.filter(
      (o) =>
        !o.orderNumber?.startsWith('POS-') &&
        o.orderStatus === 'PENDING' &&
        o.paymentStatus === 'PENDING' &&
        !readOrderIds.has(o.id)
    );
  }, [ordersList, readOrderIds]);

  // Pending orders count for sidebar navigation tab
  const pendingOrdersCount = React.useMemo(() => {
    return ordersList.filter(
      (o) =>
        !o.orderNumber?.startsWith('POS-') &&
        (o.paymentStatus === 'PENDING_PAYMENT' || o.paymentStatus === 'UNPAID' || o.orderStatus === 'PENDING') &&
        o.paymentStatus !== 'PAID'
    ).length;
  }, [ordersList]);

  const totalNotifCount = unreadOrders.length + lowStockProducts.length;

  const handleMarkAllAsRead = () => {
    const allOrderIds = new Set<string>([...Array.from(readOrderIds), ...ordersList.map((o) => o.id)]);
    const allStockProductIds = new Set<string>([...Array.from(dismissedStockIds), ...products.map((p) => p.id)]);
    setReadOrderIds(allOrderIds);
    setDismissedStockIds(allStockProductIds);
    try {
      localStorage.setItem('admin_read_order_ids', JSON.stringify(Array.from(allOrderIds)));
      localStorage.setItem('admin_dismissed_stock_ids', JSON.stringify(Array.from(allStockProductIds)));
    } catch (e) {
      console.error('Failed to save read notifications to localStorage', e);
    }
    setNewOrderToast(null);
  };

  const handleDbResetConfirm = async () => {
    if (!resetModalPassInput) {
      setResetModalError('Өгөгдөл арилгах тусгай нууц үгээ оруулна уу.');
      return;
    }

    setResetModalLoading(true);
    setResetModalError(null);

    try {
      const res = await fetch('/api/admin/reset-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'WIPE_ALL_DATA',
          resetPassword: resetModalPassInput,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('✅ ' + data.message);
        setIsResetModalOpen(false);
        setResetModalPassInput('');
        fetchAdminData();
      } else {
        setResetModalError(data.error || '🔒 Өгөгдөл арилгах нууц үг буруу байна.');
      }
    } catch (e: any) {
      setResetModalError('Алдаа гарлаа: ' + e.message);
    } finally {
      setResetModalLoading(false);
    }
  };

  useEffect(() => {
    try {
      // Check local authentication state
      const authSaved = typeof window !== 'undefined' ? localStorage.getItem('inky_admin_auth') : null;
      if (authSaved === 'true') {
        setIsAuthenticated(true);
        fetchAdminData();
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    } catch (e) {
      console.error('Auth check error:', e);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Нэвтрэх үед алдаа гарлаа');

      localStorage.setItem('inky_admin_auth', 'true');
      setIsAuthenticated(true);
      fetchAdminData();
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('inky_admin_auth');
    setIsAuthenticated(false);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [resProd, resCat, resFin, resSet, resBun] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/financials'),
        fetch('/api/settings'),
        fetch('/api/bundles'),
      ]);

      const dataProd = await resProd.json();
      const dataCat = await resCat.json();
      const dataFin = await resFin.json();
      const dataSet = await resSet.json();
      const dataBun = await resBun.json();

      if (Array.isArray(dataProd)) setProducts(dataProd);
      if (Array.isArray(dataCat)) setCategories(dataCat);
      if (Array.isArray(dataBun)) setBundles(dataBun);
      if (dataFin) setFinancials(dataFin);
      if (dataSet && typeof dataSet.showStockQuantity === 'boolean') setSettings(dataSet);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScan = (code: string) => {
    setSearchQuery(code);
    setActiveTab('products');
    const matched = products.find((p) => p.barcode === code);
    if (matched) {
      setSelectedProductForEdit(matched);
      setIsProductModalOpen(true);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery)
  );

  // Tab Details Map
  const tabTitles: Record<string, string> = {
    pos: '🛒 Касс',
    financials: '📊 Санхүүгийн Тайлан & Орлого Өртөг',
    products: '📦 Барааны Бүртгэл',
    orders: '🛒 Захиалга Шалгах & Баталгаажуулах',
    bundles: '🎁 Иж Бүрэн Багцууд Удирдах',
    categories: '🗂️ Барааны Ангилалууд',
    banks: '💳 Банкны QR Тохиргоо',
    promotions: '✨ Промошн & Hero Слайдерууд',
    collections: '✨ Онцлох Цуглуулга Удирдах',
    settings: '⚙️ Системийн Ерөнхий Тохиргоо',
    profile: '👤 Дэлгүүрийн Хаяг & Админы Нууц үг',
  };

  // RENDER ADMIN LOGIN SCREEN IF NOT AUTHENTICATED
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-teal-700 selection:text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-2xl space-y-6 z-10 animate-scaleUp">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <img
              src="/logo.svg"
              alt="Inky Sisters"
              className="w-16 h-16 object-contain mx-auto bg-slate-900 rounded-2xl p-2.5 shadow-lg border border-slate-800"
            />
            <h2 className="text-2xl font-extrabold text-gray-900 font-sans tracking-tight">
              Админ Системд Нэвтрэх
            </h2>
            <p className="text-xs text-gray-500 font-sans">
              "Inky Sisters" дэлгүүрийн удирдлагын хэсэг
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-700" /> Нэвтрэх Нэр (Username)
              </label>
              <input
                type="text"
                required
                placeholder="inkysisters"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-teal-700" /> Нууц Үг (Password)
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              <span>{loginLoading ? 'Шалгаж байна...' : 'Нэвтрэх'}</span>
            </button>
          </form>

          {/* Footer Back link */}
          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs font-bold text-gray-500 hover:text-teal-700 transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Нүүр хуудас руу буцах</span>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-mono">
        Уншиж байна...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900 font-sans selection:bg-teal-700 selection:text-white">
      
      {/* Hardware Barcode Scanner Listener for Products Tab */}
      {activeTab === 'products' && (
        <BarcodeListener onScan={handleBarcodeScan} />
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-800 text-slate-100 shrink-0 flex flex-col justify-between p-4 shadow-xl z-30 sticky top-0 h-screen border-r border-slate-700/60 overflow-hidden">
        
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-2.5 border-b border-slate-700/50 sticky top-0 bg-slate-800 z-10">
            <img src={settings.logoUrl || '/logo.svg'} alt="Inky Sisters Logo" className="w-10 h-10 object-contain bg-white rounded-lg p-1" />
            <div>
              <span className="font-extrabold text-sm text-white block tracking-tight leading-none font-sans">
                INKY SISTERS
              </span>
              <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest block mt-1">
                Admin Dashboard
              </span>
            </div>
          </div>

          {/* Navigation Items List */}
          <nav className="space-y-1">
            {/* IN-STORE POS TAB - VERY TOP OF SIDEBAR */}
            <button
              onClick={() => setActiveTab('pos')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl font-black text-xs transition-all shadow-lg mb-2 ${
                activeTab === 'pos'
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/20'
                  : 'bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 border border-amber-400/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4.5 h-4.5 text-amber-400 fill-amber-400/20" />
                <span className="font-sans text-xs">🛒 Касс</span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>

            <button
              onClick={() => setActiveTab('financials')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'financials'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Санхүүгийн Тайлан</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'products'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Барааны Бүртгэл</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'orders'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-teal-300" />
                <span>Захиалга Тулгах</span>
              </div>
              {pendingOrdersCount > 0 && (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full font-extrabold text-[10px] animate-pulse font-mono">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('bundles')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'bundles'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Gift className="w-4 h-4 text-purple-400" />
                <span>Иж Бүрэн Багцууд</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'categories'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Ангилалууд</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('banks')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'banks'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-emerald-300" />
                <span>Банкны QR</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('promotions')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'promotions'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>Промошн & Слайд</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('collections')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'collections'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Онцлох Цуглуулга</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'settings'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-purple-400" />
                <span>Тохиргоо</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'profile'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-amber-300" />
                <span>Профайл & Нууц үг</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </nav>
        </div>

        {/* Bottom Logout & Back Links */}
        <div className="pt-3 mt-2 border-t border-slate-700/60 space-y-2 shrink-0 bg-slate-800 z-10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/60 hover:bg-red-900 text-red-200 font-bold text-xs rounded-xl transition-all border border-red-800/50"
          >
            <LogOut className="w-4 h-4" />
            <span>Системээс гарах (Logout)</span>
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-700/60 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition-all border border-slate-600/60"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Сайт руу буцах</span>
          </Link>
        </div>

      </aside>

      {/* RIGHT MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 min-h-screen">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 px-6 sm:px-8 py-4 flex items-center justify-between shadow-xs sticky top-0 z-20">
          <div>
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">
              Admin Panel / {activeTab}
            </span>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h2 className="text-xl font-extrabold text-gray-900 font-sans">
                {tabTitles[activeTab]}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Real-time Notification Bell Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2.5 rounded-xl border transition-all relative flex items-center justify-center ${
                  totalNotifCount > 0
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
                title="Сануулга & Мэдэгдэл"
              >
                <Bell className="w-4.5 h-4.5" />
                {totalNotifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-mono font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                    {totalNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden font-sans animate-fadeIn">
                  <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-teal-700" />
                      <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">
                        Сануулга ({totalNotifCount})
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {totalNotifCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="flex items-center gap-1 px-2.5 py-1 bg-teal-100 hover:bg-teal-200 text-teal-900 text-[11px] font-extrabold rounded-lg transition-colors border border-teal-300 shadow-2xs"
                          title="Бүх мэдэгдлийг уншсанаар тэмдэглэх"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-teal-800" />
                          <span>Бүгдийг унших</span>
                        </button>
                      )}
                      <button
                        onClick={() => setIsNotifOpen(false)}
                        className="text-gray-400 hover:text-gray-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                    {/* LOW STOCK ALERTS (Stock <= 20) */}
                    {lowStockProducts.length > 0 && (
                      <div className="p-3 bg-amber-50/60">
                        <div className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Үлдэгдэл дуусч буй бараанууд ({lowStockProducts.length})</span>
                        </div>
                        <div className="space-y-1.5">
                          {lowStockProducts.slice(0, 6).map((p) => (
                            <div
                              key={p.id}
                              className="p-2.5 bg-white border border-amber-200 rounded-xl flex items-center justify-between text-xs shadow-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-bold text-gray-900 block truncate">{p.name}</span>
                                <span className="text-[10px] font-mono text-amber-700 font-bold">
                                  ⚠️ Үлдэгдэл: {p.stock} ширхэг (Дуусч байна!)
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setRestockProduct(p);
                                  setIsNotifOpen(false);
                                }}
                                className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-bold rounded-lg shrink-0 shadow-xs"
                              >
                                Нөхөх
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* UNREAD / NEW ORDERS */}
                    {unreadOrders.length > 0 && (
                      <div className="p-3 bg-teal-50/40">
                        <div className="text-[11px] font-extrabold text-teal-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-teal-700" />
                          <span>Шинэ &amp; Хүлээгдэж буй захиалгууд ({unreadOrders.length})</span>
                        </div>
                        <div className="space-y-1.5">
                          {unreadOrders.slice(0, 6).map((o) => (
                            <div
                              key={o.id}
                              onClick={() => {
                                setActiveTab('orders');
                                setIsNotifOpen(false);
                              }}
                              className="p-2.5 bg-white border border-teal-200 rounded-xl cursor-pointer hover:bg-teal-50 transition-colors text-xs flex items-center justify-between shadow-xs"
                            >
                              <div>
                                <span className="font-extrabold text-gray-900 font-mono block">
                                  #{o.orderNumber}
                                </span>
                                <span className="text-[10px] text-gray-500 font-sans block">
                                  {o.customerName} ({o.customerPhone})
                                </span>
                              </div>
                              <span className="font-bold text-teal-900 font-mono text-xs">
                                {formatMNT(o.totalMnt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {totalNotifCount === 0 && (
                      <div className="p-8 text-center text-xs text-gray-400">
                        <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <span>Одоогоор шинэ сануулга байхгүй байна.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedProductForEdit(null);
                setIsProductModalOpen(true);
              }}
              className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Шинэ Бараа Бүртгэх</span>
            </button>
          </div>
        </header>

        {/* Tab Body Content */}
        <main className="p-6 sm:p-8 space-y-6 flex-1">
          
          {/* TAB 0: IN-STORE POS CASHIER TERMINAL */}
          {activeTab === 'pos' && (
            <PosManager
              products={products}
              categories={categories}
              bundles={bundles}
              onProductUpdate={fetchAdminData}
            />
          )}

          {/* TAB 1: FINANCIALS & OPERATING EXPENSES & EXCEL EXPORT */}
          {activeTab === 'financials' && (
            <FinancialsManager />
          )}

          {/* TAB 2: PRODUCTS & BARCODES */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              
              {/* Stock Display Toggle Card */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="toggleStock"
                    checked={settings.showStockQuantity}
                    onChange={async (e) => {
                      const checked = e.target.checked;
                      setSettings((prev: any) => ({ ...prev, showStockQuantity: checked }));
                      await fetch('/api/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ showStockQuantity: checked }),
                      });
                    }}
                    className="w-5 h-5 text-teal-700 rounded focus:ring-teal-500 border-gray-300 cursor-pointer"
                  />
                  <label htmlFor="toggleStock" className="cursor-pointer">
                    <span className="font-bold text-gray-900 text-sm block">
                      Сайт дээр барааны үлдэгдэл тоо ширхэгийг харуулах
                    </span>
                    <span className="text-xs text-gray-500 block">
                      {settings.showStockQuantity
                        ? '✓ Идэвхтэй: Хэрэглэгчдэд "Үлдэгдэл: 15 ширхэг" гэж тодорхой тоо харагдана.'
                        : '✗ Идэвхгүй: Хэрэглэгчдэд тоо харагдахгүй, зөвхөн "Бэлэн байгаа" эсвэл "Дууссан" төлөв харагдана.'}
                    </span>
                  </label>
                </div>

                <span
                  className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                    settings.showStockQuantity
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {settings.showStockQuantity ? 'Тоо харагдаж байна' : 'Тоо нуугдсан'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Барааны нэр эсвэл Бар кодоор хайх (Scan)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                  <Barcode className="w-4 h-4 text-teal-700" />
                  <span>Физик уншигчаар уншуулна уу</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Table Header Section */}
                <div className="p-4 bg-gray-50/90 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-sm text-gray-900 font-sans">
                      Барааны Жагсаалт
                    </span>
                    <span className="px-3 py-1 bg-teal-100 text-teal-900 font-mono font-extrabold text-xs rounded-full border border-teal-200 shadow-2xs">
                      Нийт {products.length} Төрлийн Бараа
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-700">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase font-mono tracking-wider">
                      <tr>
                        <th className="p-4">Бараа & Бар код</th>
                        <th className="p-4">Ангилал</th>
                        <th className="p-4">Юанийн Өртөг (¥)</th>
                        <th className="p-4">Зарах Үнэ (₮)</th>
                        <th className="p-4">Үлдэгдэл</th>
                        <th className="p-4 text-right">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProducts.map((p) => {
                        const isZeroStock = p.stock <= 0;

                        return (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                            <td
                              onClick={() => setSelectedProductForDetail(p)}
                              className="p-4 flex items-center gap-3"
                            >
                              <img
                                src={p.imageUrl || 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=600&auto=format&fit=crop&q=80'}
                                alt={p.name}
                                className="w-12 h-12 object-cover rounded-xl border border-gray-200 bg-gray-50 group-hover:scale-105 transition-transform"
                              />
                              <div>
                                <span className="font-bold text-gray-900 text-sm block group-hover:text-teal-700 transition-colors">
                                  {p.name}
                                </span>
                                <span className="font-mono text-[11px] text-gray-400">
                                  📷 {p.barcode}
                                </span>
                              </div>
                            </td>

                            <td className="p-4 font-semibold text-gray-600">
                              {p.category?.name || '—'}
                            </td>

                            <td className="p-4 font-mono">
                              <div>{formatYuan(p.costYuan)}</div>
                              <div className="text-[11px] text-gray-400">Өртөг: {formatMNT(p.costMnt)}</div>
                            </td>

                            <td className="p-4 font-extrabold text-red-600 font-mono text-sm">
                              {p.isDiscounted && p.discountPriceMnt ? (
                                <div>
                                  <span className="line-through text-gray-400 text-[10px] block">
                                    {formatMNT(p.priceMnt)}
                                  </span>
                                  <span>{formatMNT(p.discountPriceMnt)}</span>
                                </div>
                              ) : (
                                formatMNT(p.priceMnt)
                              )}
                            </td>

                            <td className="p-4 font-mono">
                              {isZeroStock ? (
                                <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg font-bold border border-red-200">
                                  Дууссан
                                </span>
                              ) : p.stock <= 5 ? (
                                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg font-bold border border-amber-300 inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                                  <span>{p.stock}</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-teal-100 text-teal-800 rounded-lg font-bold">
                                  {p.stock}
                                </span>
                              )}
                            </td>

                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProductForHistory(p);
                                  }}
                                  className="p-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all inline-flex items-center"
                                  title="Өөрчлөлтийн түүх харах"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProductForDetail(p);
                                  }}
                                  className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-all inline-flex items-center"
                                  title="Дэлгэрэнгүй харах"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRestockProduct(p);
                                  }}
                                  className="p-2 text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-all inline-flex items-center"
                                  title="Нөхөх (Restock)"
                                >
                                  <PackagePlus className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProductForEdit(p);
                                    setIsProductModalOpen(true);
                                  }}
                                  className="p-2 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-all inline-flex items-center"
                                  title="Засах"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm(`"${p.name}" барааг устгахдаа итгэлтэй байна уу?`)) {
                                      try {
                                        const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
                                        if (res.ok) {
                                          fetchAdminData();
                                        } else {
                                          alert('Бараа устгахад алдаа гарлаа');
                                        }
                                      } catch (err) {
                                        console.error(err);
                                        alert('Бараа устгахад алдаа гарлаа');
                                      }
                                    }
                                  }}
                                  className="p-2 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-all inline-flex items-center"
                                  title="Бараа устгах"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <OrderManager products={products} onOrderUpdate={fetchOrdersRealtime} />
          )}

          {/* TAB: BUNDLES */}
          {activeTab === 'bundles' && <BundleManager />}

          {/* TAB 4: CATEGORIES */}
          {activeTab === 'categories' && <CategoryManager />}

          {/* TAB 5: BANKS */}
          {activeTab === 'banks' && <BankManager />}

          {/* TAB 6: PROMOTIONS */}
          {activeTab === 'promotions' && <PromotionManager />}

          {/* TAB 7: FEATURED COLLECTIONS */}
          {activeTab === 'collections' && (
            <FeaturedCollectionManager categories={categories} products={products} />
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 font-sans">
                ⚙️ Дэлгүүрийн Системийн Тохиргоо
              </h3>

              {/* 1. Logo Upload & Customization */}
              <div className="space-y-4 bg-teal-50/50 p-5 rounded-2xl border border-teal-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900 font-sans">1. Дэлгүүрийн Лого Солих ба Оруулах</h4>
                    <p className="text-xs text-gray-500 mt-0.5 font-sans">
                      Компьютерээсээ шинэ Лого зургаа хуулснаар веб сайтын цэс болон Админ самбарын лого шууд шинэчлэгдэнэ.
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white border border-teal-200 p-1 shadow-xs shrink-0 flex items-center justify-center">
                    <img src={settings.logoUrl || '/logo.svg'} alt="Current Logo" className="w-full h-full object-contain" />
                  </div>
                </div>

                <ImageUploader
                  label="Шинэ Лого Зураг Сонгож Хуулах:"
                  value={settings.logoUrl || '/logo.svg'}
                  onChange={async (url) => {
                    setSettings((prev: any) => ({ ...prev, logoUrl: url }));
                    await fetch('/api/settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ logoUrl: url }),
                    });
                    alert('✓ Дэлгүүрийн лого амжилттай шинэчлэгдлээ!');
                  }}
                />
              </div>

              {/* 2. Stock Display Setting */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-800">2. Барааны Үлдэгдэл Харагдац</h4>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="toggleStockSettings"
                      checked={settings.showStockQuantity}
                      onChange={async (e) => {
                        const checked = e.target.checked;
                        setSettings((prev: any) => ({ ...prev, showStockQuantity: checked }));
                        await fetch('/api/settings', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ showStockQuantity: checked }),
                        });
                      }}
                      className="w-5 h-5 mt-0.5 text-teal-700 rounded focus:ring-teal-500 border-gray-300 cursor-pointer"
                    />
                    <label htmlFor="toggleStockSettings" className="cursor-pointer">
                      <span className="font-bold text-gray-900 text-sm block">
                        Сайт дээр барааны үлдэгдэл тоо ширхэгийг харуулах
                      </span>
                      <span className="text-xs text-gray-500 block mt-1">
                        {settings.showStockQuantity
                          ? 'Идэвхтэй: Хэрэглэгчид карт дээр болон түргэн харах цонхонд "Үлдэгдэл: 15 ширхэг" гэсэн нарийвчилсан тоог харна.'
                          : 'Идэвхгүй: Тоо ширхэгийг харуулахгүй, зөвхөн "Бэлэн байгаа" эсвэл "Дууссан" гэсэн нийтлэг төлөвийг харуулна.'}
                      </span>
                    </label>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold ${
                      settings.showStockQuantity
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {settings.showStockQuantity ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </span>
                </div>
              </div>

              {/* 2. Hero Banner Customization */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="font-bold text-sm text-gray-800">2. Нүүр Хуудасны Hero Банер Тохиргоо</h4>
                <p className="text-xs text-gray-500">
                  Сайтын хамгийн дээр харагдах Hero банерын гарчиг, тайлбар болон Онцлох барааг сонгоно уу.
                </p>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await fetch('/api/settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(settings),
                    });
                    alert('Hero банерын тохиргоо амжилттай хадгалагдлаа!');
                  }}
                  className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200"
                >
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Банерын Тэмдэгт (Badge Text):
                    </label>
                    <input
                      type="text"
                      value={settings.heroBadge || ''}
                      onChange={(e) => setSettings({ ...settings, heroBadge: e.target.value })}
                      placeholder="🔥 ЭРЭЛТТЭЙ БАРАА"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Үндсэн Гарчиг (Hero Title):
                    </label>
                    <input
                      type="text"
                      value={settings.heroTitle || ''}
                      onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                      placeholder="Онцлох Бичиг Хэргийн Цуглуулга"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-extrabold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Дэд Текст / Тайлбар (Hero Subtitle):
                    </label>
                    <textarea
                      rows={2}
                      value={settings.heroSubtitle || ''}
                      onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                      placeholder="Хамгийн тренд болж буй пастел үзэг, дэвтрүүдийг шууд захиалаарай..."
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Hero Банер Зурах Зургийн URL (Image URL):
                      </label>
                      <input
                        type="text"
                        value={settings.heroImageUrl || ''}
                        onChange={(e) => setSettings({ ...settings, heroImageUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <ProductSelector
                        products={products}
                        categories={categories}
                        selectedProductId={settings.heroProductId || ''}
                        onSelectProduct={(id) => setSettings({ ...settings, heroProductId: id })}
                        label="Онцлох Захиалах Бараа Сонгох (Ангилалаар болон Баркодоор хайж сонгох):"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-sm"
                  >
                    Тохиргоо Хадгалах
                  </button>
                </form>
              </div>

              {/* DANGER ZONE: DATABASE RESET TO 0 */}
              <div className="bg-red-50 border border-red-200 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-red-700 font-extrabold text-sm uppercase">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>⚠️ АЮУЛТАЙ БҮС: ӨГӨГДЛИЙН БААЗЫГ 0 БОЛГОХ (DB RESET)</span>
                </div>
                <p className="text-xs text-red-600 leading-relaxed font-sans">
                  Энэхүү үйлдлийг хийснээр системд байгаа бүх туршилтын захиалга, борлуулалтын санхүү, зардал, бараа, багц болон түүхүүд бүрэн арилж 0 болно.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setResetModalPassInput('');
                    setResetModalError(null);
                    setForgotEmailNotice(null);
                    setIsResetModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Бүх өгөгдлийг арилгаж 0 болгох (DB Reset)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: PROFILE & PASSWORD CHANGE */}
          {activeTab === 'profile' && <ProfileManager />}

        </main>
      </div>

      {/* Product Edit / Add Modal */}
      {isProductModalOpen && (
        <ProductModal
          product={selectedProductForEdit}
          categories={categories}
          onClose={() => setIsProductModalOpen(false)}
          onSave={fetchAdminData}
        />
      )}

      {/* Restock Modal */}
      {restockProduct && (
        <RestockModal
          product={restockProduct}
          onClose={() => setRestockProduct(null)}
          onSuccess={fetchAdminData}
        />
      )}

      {/* Product Detail Spec Modal */}
      {selectedProductForDetail && (
        <ProductDetailModal
          product={selectedProductForDetail}
          onClose={() => setSelectedProductForDetail(null)}
          onEdit={(p) => {
            setSelectedProductForEdit(p);
            setIsProductModalOpen(true);
          }}
          onRestock={(p) => {
            setRestockProduct(p);
          }}
          onHistory={(p) => {
            setSelectedProductForHistory(p);
          }}
        />
      )}

      {/* Product History Modal */}
      {selectedProductForHistory && (
        <ProductHistoryModal
          product={selectedProductForHistory}
          onClose={() => setSelectedProductForHistory(null)}
        />
      )}

      {/* Live Incoming Order Popup Toast */}
      {newOrderToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-teal-950 text-white p-4 rounded-2xl shadow-2xl border-2 border-amber-400 animate-bounce space-y-2 font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>🔔 ШИНЭ ЗАХИАЛГА ИРЛЭЭ!</span>
            </div>
            <button
              onClick={() => setNewOrderToast(null)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="font-mono font-extrabold text-sm text-white">
              Захиалгын №: #{newOrderToast.orderNumber}
            </div>
            <div className="text-xs text-gray-300 mt-0.5">
              Харилцагч: {newOrderToast.customerName} ({newOrderToast.customerPhone})
            </div>
            <div className="text-sm font-extrabold text-amber-400 font-mono mt-1">
              Дүн: {formatMNT(newOrderToast.totalMnt)}
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab('orders');
              setNewOrderToast(null);
            }}
            className="w-full mt-2 py-2 bg-amber-400 hover:bg-amber-500 text-teal-950 font-extrabold text-xs rounded-xl shadow-md transition-all text-center block"
          >
            Захиалга Шалгах &amp; Баталгаажуулах
          </button>
        </div>
      )}

      {/* DB Reset Confirmation Security Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-5 font-sans relative">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-600 border-b border-red-100 pb-3">
              <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-black text-base text-gray-900">Өгөгдлийн Бааз Арилгах (DB Reset)</h3>
                <p className="text-xs text-red-600 font-bold">Аюулгүй байдлын тусгай нууц үг шаардлагатай</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Анхаар! Энэхүү үйлдлийг хийснээр бүх бараа, захиалга, санхүүгийн түүхүүд 0 болж устгагдана. Өгөгдөл арилгах тусгай нууц үгээ оруулна уу:
            </p>

            {resetModalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{resetModalError}</span>
              </div>
            )}

            {forgotEmailNotice && (
              <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
                <span>{forgotEmailNotice}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-gray-800">
                🔒 Өгөгдөл Арилгах Нууц Үг (Reset Password):
              </label>
              <input
                type="password"
                autoFocus
                placeholder="••••••••"
                value={resetModalPassInput}
                onChange={(e) => setResetModalPassInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDbResetConfirm();
                  }
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl font-mono text-sm font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-500"
              />

              <div className="pt-1 flex justify-between items-center text-xs">
                <button
                  type="button"
                  disabled={forgotEmailLoading}
                  onClick={async () => {
                    setForgotEmailLoading(true);
                    setResetModalError(null);
                    setForgotEmailNotice(null);
                    try {
                      const res = await fetch('/api/admin/forgot-reset-password', { method: 'POST' });
                      const data = await res.json();
                      if (res.ok) {
                        setForgotEmailNotice(data.message);
                      } else {
                        setResetModalError(data.error || 'И-мэйл илгээхэд алдаа гарлаа.');
                      }
                    } catch (err: any) {
                      setResetModalError(err.message);
                    } finally {
                      setForgotEmailLoading(false);
                    }
                  }}
                  className="text-teal-700 hover:text-teal-900 font-extrabold underline flex items-center gap-1 transition-all"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{forgotEmailLoading ? 'Илгээж байна...' : '🔑 Нууц үгээ мартсан уу? И-мэйлээр авах'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
              >
                Цуцлах
              </button>
              <button
                type="button"
                disabled={resetModalLoading || !resetModalPassInput}
                onClick={handleDbResetConfirm}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{resetModalLoading ? 'Цэвэрлэж байна...' : 'Бүх өгөгдлийг 0 болгох'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

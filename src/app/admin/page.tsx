'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatMNT, formatYuan, notifyDataSync } from '@/lib/utils';
import { getFirstImageUrl } from '@/lib/imageUtils';
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
  ChevronLeft,
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
  RefreshCw,
  Trash2,
  Gift,
  Printer,
  FileSpreadsheet,
  FileText,
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [products, setProducts] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('inky_admin_cached_products');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });
  const [categories, setCategories] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('inky_admin_cached_categories');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });
  const [bundles, setBundles] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('inky_admin_cached_financials');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });
  const [settings, setSettings] = useState<any>({ showStockQuantity: true });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('inky_admin_cached_products');
        if (cached && JSON.parse(cached).length > 0) return false;
      } catch (e) {}
    }
    return true;
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Left Sidebar Collapse state (persistent in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('inky_admin_sidebar_collapsed');
        return saved === 'true';
      } catch (e) {}
    }
    return false;
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('inky_admin_sidebar_collapsed', String(next));
        } catch (e) {}
      }
      return next;
    });
  };

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

  // Unread ONLINE orders (Exclude POS sales and Exclude Confirmed/Paid/Cancelled orders)
  const unreadOrders = React.useMemo(() => {
    return ordersList.filter(
      (o) =>
        !o.orderNumber?.startsWith('POS-') &&
        o.orderStatus !== 'CANCELLED' &&
        o.paymentStatus !== 'CANCELLED' &&
        o.orderStatus === 'PENDING' &&
        (o.paymentStatus === 'PENDING_PAYMENT' || o.paymentStatus === 'UNPAID') &&
        !readOrderIds.has(o.id)
    );
  }, [ordersList, readOrderIds]);

  // Pending orders count for sidebar navigation tab "Захиалга Тулгах"
  const pendingOrdersCount = React.useMemo(() => {
    return ordersList.filter(
      (o) =>
        !o.orderNumber?.startsWith('POS-') &&
        o.paymentStatus !== 'PAID' &&
        o.paymentStatus !== 'CANCELLED' &&
        o.orderStatus !== 'CANCELLED' &&
        (o.paymentStatus === 'PENDING_PAYMENT' || o.paymentStatus === 'UNPAID' || o.orderStatus === 'PENDING')
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

  const fetchAdminData = async (silent = false) => {
    if (!silent && products.length === 0) setLoading(true);
    try {
      const [resProd, resCat, resFin, resSet, resBun] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/financials'),
        fetch('/api/settings'),
        fetch('/api/bundles'),
      ]);

      const [dataProd, dataCat, dataFin, dataSet, dataBun] = await Promise.all([
        resProd.json(),
        resCat.json(),
        resFin.json(),
        resSet.json(),
        resBun.json(),
      ]);

      if (Array.isArray(dataProd)) {
        setProducts(dataProd);
        try { localStorage.setItem('inky_admin_cached_products', JSON.stringify(dataProd)); } catch (e) {}
      }
      if (Array.isArray(dataCat)) {
        setCategories(dataCat);
        try { localStorage.setItem('inky_admin_cached_categories', JSON.stringify(dataCat)); } catch (e) {}
      }
      if (Array.isArray(dataBun)) setBundles(dataBun);
      if (dataFin) {
        setFinancials(dataFin);
        try { localStorage.setItem('inky_admin_cached_financials', JSON.stringify(dataFin)); } catch (e) {}
      }
      if (dataSet && typeof dataSet.showStockQuantity === 'boolean') setSettings(dataSet);
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Real-time Live Stock Sync across POS, Admin, and Online Store (event-driven on change, window focus, or broadcast)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Cross-tab BroadcastChannel event listener
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('inky_stock_sync');
      channel.onmessage = () => {
        fetchAdminData(true);
      };
    } catch (e) { }

    // Storage event fallback
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'inky_last_stock_update') {
        fetchAdminData(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Window Focus Listener (refresh when tab gains focus)
    const handleFocus = () => {
      fetchAdminData(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated]);

  // PDF Export for Product Presentation Catalog ("PDF Танилцуулга")
  const handleExportProductCatalogPDF = () => {
    const listToPrint = filteredProducts;

    if (listToPrint.length === 0) {
      alert('Экспортлох бараа байхгүй байна!');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Попап цонх нээхийг зөвшөөрнө үү!');
      return;
    }

    const rowsHtml = listToPrint
      .map(
        (p, idx) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; font-weight: bold; font-family: monospace; font-size: 12px; color: #4b5563;">${idx + 1}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">
          <img
            src="${getFirstImageUrl(p.imageUrl)}"
            alt="${p.name}"
            style="width: 56px; height: 56px; object-fit: cover; border-radius: 10px; border: 1px solid #d1d5db; display: block; margin: 0 auto;"
          />
        </td>
        <td style="padding: 10px; border: 1px solid #e5e7eb;">
          <strong style="font-size: 14px; color: #111827; display: block;">${p.name}</strong>
        </td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; font-family: monospace; font-weight: bold; font-size: 14px; color: #0d9488; text-align: right; white-space: nowrap;">
          ${p.isDiscounted && p.discountPriceMnt
            ? `<div><span style="text-decoration: line-through; color: #9ca3af; font-size: 11px; display: block;">${(p.priceMnt || 0).toLocaleString()}₮</span>${(
              p.discountPriceMnt || 0
            ).toLocaleString()}₮</div>`
            : `${(p.priceMnt || 0).toLocaleString()}₮`
          }
        </td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; font-size: 12px; color: #4b5563; line-height: 1.4;">
          ${p.description || '—'}
        </td>
      </tr>
    `
      )
      .join('');

    const logoSrc = window.location.origin + (settings?.logoUrl || '/logo.svg');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inky Sisters Shop - PDF Танилцуулга</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 15px; color: #111827; background: #fff; }
            .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px; }
            .brand-box { display: flex; align-items: center; gap: 14px; }
            .brand-logo { height: 48px; width: auto; max-width: 140px; object-fit: contain; }
            .title { font-size: 22px; font-weight: 900; color: #0f766e; font-family: sans-serif; letter-spacing: 0.5px; }
            .subtitle { font-size: 13px; color: #4b5563; font-weight: 600; margin-top: 2px; }
            .meta { font-size: 11px; text-align: right; color: #374151; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f0fdf4; color: #0f766e; padding: 10px; border: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; font-family: monospace; font-weight: bold; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div class="brand-box">
              <img src="${logoSrc}" class="brand-logo" alt="Logo" onerror="this.style.display='none'" />
              <div>
                <div class="title">INKY SISTERS SHOP</div>
                <div class="subtitle">✨ PDF Танилцуулга</div>
              </div>
            </div>
            <div class="meta">
              <div>Огноо: <strong>${new Date().toLocaleDateString('mn-MN')}</strong></div>
              <div>Нийт Бараа: <strong>${listToPrint.length} төрөл</strong></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th style="width: 70px;">Зураг</th>
                <th style="width: 220px;">Барааны Нэр</th>
                <th style="width: 110px; text-align: right;">Үнэ</th>
                <th>Тайлбар</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
      <aside
        className={`${
          isSidebarCollapsed ? 'w-16 px-2 py-3' : 'w-64 p-4'
        } bg-slate-800 text-slate-100 shrink-0 flex flex-col justify-between shadow-xl z-30 sticky top-0 h-screen border-r border-slate-700/60 overflow-hidden transition-all duration-300 ease-in-out`}
      >
        <div className="flex-1 overflow-y-auto pr-0.5 space-y-4 scrollbar-thin">
          {/* Brand Header */}
          <div
            className={`flex items-center ${
              isSidebarCollapsed ? 'justify-center py-2' : 'justify-between px-2 py-2.5'
            } border-b border-slate-700/50 sticky top-0 bg-slate-800 z-10 transition-all`}
          >
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={settings.logoUrl || '/logo.svg'}
                  alt="Inky Sisters Logo"
                  className="w-9 h-9 object-contain bg-white rounded-lg p-1 shrink-0 shadow-xs"
                />
                <div className="truncate">
                  <span className="font-extrabold text-sm text-white block tracking-tight leading-none font-sans">
                    INKY SISTERS
                  </span>
                  <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest block mt-1">
                    Admin Dashboard
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={toggleSidebar}
              className={`p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-600/50 shrink-0 flex items-center justify-center ${
                isSidebarCollapsed ? 'w-full py-2' : ''
              }`}
              title={isSidebarCollapsed ? 'Цэс дэлгэх' : 'Цэс хураах'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-teal-400" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Items List */}
          <nav className="space-y-1">
            {/* IN-STORE POS TAB - VERY TOP OF SIDEBAR */}
            <button
              onClick={() => setActiveTab('pos')}
              title="Касс (POS)"
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between p-3'
              } rounded-2xl font-black text-xs transition-all shadow-lg mb-2 ${
                activeTab === 'pos'
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/20'
                  : 'bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 border border-amber-400/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4.5 h-4.5 text-amber-400 fill-amber-400/20 shrink-0" />
                {!isSidebarCollapsed && <span className="font-sans text-xs">Касс</span>}
              </div>
              {!isSidebarCollapsed && <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />}
            </button>

            {[
              { id: 'financials', label: 'Санхүүгийн Тайлан', icon: TrendingUp, color: 'text-emerald-400' },
              { id: 'products', label: 'Барааны Бүртгэл', icon: Package, color: 'text-amber-400' },
              {
                id: 'orders',
                label: 'Захиалга Тулгах',
                icon: ShoppingBag,
                color: 'text-teal-300',
                badge: pendingOrdersCount,
              },
              { id: 'bundles', label: 'Иж Бүрэн Багцууд', icon: Gift, color: 'text-purple-400' },
              { id: 'categories', label: 'Ангилалууд', icon: Layers, color: 'text-sky-400' },
              { id: 'banks', label: 'Банкны QR', icon: QrCode, color: 'text-emerald-300' },
              { id: 'promotions', label: 'Промошн & Слайд', icon: Sparkles, color: 'text-pink-400' },
              { id: 'collections', label: 'Онцлох Цуглуулга', icon: Layers, color: 'text-amber-400' },
              { id: 'settings', label: 'Тохиргоо', icon: Settings, color: 'text-purple-400' },
              { id: 'profile', label: 'Профайл & Нууц үг', icon: User, color: 'text-amber-300' },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  title={item.label}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center p-2.5 relative' : 'justify-between px-3 py-2.5'
                  } rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${item.color} shrink-0`} />
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </div>

                  {item.badge !== undefined && item.badge > 0 ? (
                    <span
                      className={`${
                        isSidebarCollapsed
                          ? 'absolute -top-1 -right-1 px-1.5 py-0.2'
                          : 'px-2 py-0.5'
                      } bg-red-500 text-white rounded-full font-extrabold text-[10px] animate-pulse font-mono shadow-xs`}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    !isSidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logout & Back Links */}
        <div className="pt-3 mt-2 border-t border-slate-700/60 space-y-2 shrink-0 bg-slate-800 z-10">
          <button
            onClick={handleLogout}
            title="Системээс гарах (Logout)"
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-center gap-2 py-2 px-3'
            } bg-red-950/60 hover:bg-red-900 text-red-200 font-bold text-xs rounded-xl transition-all border border-red-800/50`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Системээс гарах</span>}
          </button>

          <Link
            href="/"
            title="Сайт руу буцах"
            className={`w-full flex items-center ${
              isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-center gap-2 py-2 px-3'
            } bg-slate-700/60 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition-all border border-slate-600/60`}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Сайт руу буцах</span>}
          </Link>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 min-h-screen">

        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 rounded-xl bg-gray-100 hover:bg-teal-50 text-gray-700 hover:text-teal-700 border border-gray-200 transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95"
              title={isSidebarCollapsed ? 'Цэс дэлгэх' : 'Цэс хураах'}
            >
              {isSidebarCollapsed ? (
                <>
                  <ChevronRight className="w-4 h-4 text-teal-600" />
                  <span className="text-gray-700 font-sans">Цэс дэлгэх</span>
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                  <span className="hidden sm:inline text-gray-700 font-sans">Цэс хураах</span>
                </>
              )}
            </button>

            <span className="text-[11px] font-mono font-bold text-gray-500 uppercase tracking-wider block">
              Admin Panel / {activeTab}
            </span>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Real-time Notification Bell Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2.5 rounded-xl border transition-all relative flex items-center justify-center ${totalNotifCount > 0
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
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
                      {products.length} бараа
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportProductCatalogPDF}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all border border-red-500 cursor-pointer shadow-2xs"
                      title="Барааны зураг, нэр, энгийн үнэ ба тайлбар бүхий PDF танилцуулга экспортлох"
                    >
                      <Printer className="w-4 h-4" />
                      <span>📄 PDF Барааны танилцуулга хэвлэх</span>
                    </button>
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
                                src={getFirstImageUrl(p.imageUrl)}
                                alt={p.name}
                                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.svg'; }}
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
          {activeTab === 'categories' && <CategoryManager onCategoryUpdate={fetchAdminData} />}

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
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Шинэ захиалга ирлээ</span>
            </div>
            <button
              type="button"
              onClick={() => setNewOrderToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
              title="Хаах"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="font-mono font-extrabold text-sm text-white">
              Захиалгын №: #{newOrderToast.orderNumber}
            </div>
            <div className="text-xs text-slate-300">
              Захиалагч: {newOrderToast.customerName} ({newOrderToast.customerPhone})
            </div>
            <div className="text-sm font-extrabold text-teal-400 font-mono pt-1">
              Дүн: {formatMNT(newOrderToast.totalMnt)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTab('orders');
              setNewOrderToast(null);
            }}
            className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all text-center block"
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

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
              >
                Цуцлах
              </button>
              <button
                type="button"
                disabled={resetModalLoading || !resetModalPassInput}
                onClick={handleDbResetConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{resetModalLoading ? 'Цэвэрлэж байна...' : 'Бүх өгөгдлийг 0 болгох'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

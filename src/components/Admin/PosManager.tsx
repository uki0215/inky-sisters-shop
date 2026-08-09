'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { formatMNT, formatYuan, generateBarcode } from '@/lib/utils';
import { getFirstImageUrl } from '@/lib/imageUtils';
import BarcodeListener from '@/components/BarcodeListener';
import {
  ShoppingCart,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  Banknote,
  CreditCard,
  Landmark,
  CheckCircle2,
  Printer,
  X,
  Sparkles,
  RefreshCw,
  Tag,
  Package,
  Layers,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface PosManagerProps {
  products: any[];
  categories: any[];
  bundles?: any[];
  onProductUpdate?: () => void;
}

export default function PosManager({ products = [], categories = [], bundles = [], onProductUpdate }: PosManagerProps) {
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'CARD' | 'SPLIT' | 'CREDIT'>('CASH');
  const [paidAmountText, setPaidAmountText] = useState<string>('');
  const [splitCardText, setSplitCardText] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [creditNote, setCreditNote] = useState<string>('');
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [banksList, setBanksList] = useState<any[]>([]);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/banks');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBanksList(data.filter((b: any) => b.isActive));
      }
    } catch (e) {
      console.error('Failed to fetch banks', e);
    }
  };

  // Play cash register sound effect on completed checkout
  const playCashSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Sound 1: High coin chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1200, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.1);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.2);

      // Sound 2: Cash register cha-ching bell
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(2400, ctx.currentTime);
        gain2.gain.setValueAtTime(0.4, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.35);
      }, 80);
    } catch (e) {
      console.error(e);
    }
  };

  // Add product to cashier cart
  const handleAddToCart = (product: any) => {
    if (product.stock <= 0) {
      setErrorMsg(`"${product.name}" барааны үлдэгдэл дууссан байна!`);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    const priceToUse = product.isDiscounted && product.discountPriceMnt ? product.discountPriceMnt : product.priceMnt;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      if (existingIndex >= 0) {
        const existingItem = prev[existingIndex];
        if (existingItem.quantity >= product.stock) {
          setErrorMsg(`"${product.name}" барааны үлдэгдэл хүрэлцэхгүй байна (${product.stock} ш байна).`);
          setTimeout(() => setErrorMsg(null), 4000);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            barcode: product.barcode,
            imageUrl: product.imageUrl,
            priceMnt: priceToUse,
            originalPriceMnt: product.priceMnt,
            stock: product.stock,
            quantity: 1,
          },
        ];
      }
    });
  };

  // Add bundle to cashier cart
  const handleAddBundleToCart = (bundle: any) => {
    const bundleProductId = `bundle-${bundle.id}`;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === bundleProductId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: bundleProductId,
            productName: `🎁 ${bundle.name}`,
            barcode: `BDL-${bundle.id.slice(-4).toUpperCase()}`,
            imageUrl: bundle.imageUrl,
            priceMnt: bundle.bundlePriceMnt,
            originalPriceMnt: bundle.bundlePriceMnt,
            stock: 99,
            quantity: 1,
            isBundle: true,
          },
        ];
      }
    });
  };

  const playScanBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {}
  };

  // Auto-focus barcode input when POS opens
  useEffect(() => {
    const timer = setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Hardware or manual barcode scan listener handler
  const handleBarcodeScanned = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    // Search product by barcode
    const matchedProduct = products.find(
      (p) => p.barcode && p.barcode.trim().toLowerCase() === cleanCode.toLowerCase()
    );

    if (matchedProduct) {
      handleAddToCart(matchedProduct);
      playScanBeep();
      setManualBarcode('');
      setSearchQuery('');
      setErrorMsg(null);
      return;
    }

    // Search bundle by barcode
    const matchedBundle = (bundles || []).find(
      (b) =>
        (b.barcode && b.barcode.trim().toLowerCase() === cleanCode.toLowerCase()) ||
        `bdl-${b.id.slice(-4).toLowerCase()}` === cleanCode.toLowerCase()
    );

    if (matchedBundle) {
      handleAddBundleToCart(matchedBundle);
      playScanBeep();
      setManualBarcode('');
      setSearchQuery('');
      setErrorMsg(null);
      return;
    }

    setErrorMsg(`Бар код олдсонгүй: "${cleanCode}"`);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const handleManualBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleBarcodeScanned(manualBarcode);
  };

  const handleQtyChange = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.stock) {
              setErrorMsg(`Үлдэгдэл хүрэлцэхгүй байна (${item.stock} ш байна).`);
              setTimeout(() => setErrorMsg(null), 4000);
              return item;
            }
            return { ...item, quantity: Math.max(0, nextQty) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const subtotalMnt = cart.reduce((acc, item) => acc + item.priceMnt * item.quantity, 0);
  const paidAmountNumber = parseFloat(paidAmountText) || 0;
  const splitCardNumber = parseFloat(splitCardText) || 0;
  const remainingCashMnt = Math.max(0, subtotalMnt - splitCardNumber);
  const changeMnt = paymentMethod === 'SPLIT' 
    ? Math.max(0, paidAmountNumber - remainingCashMnt)
    : Math.max(0, paidAmountNumber - subtotalMnt);

  // Execute POS Sale Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'CASH' && paidAmountText && paidAmountNumber < subtotalMnt) {
      setErrorMsg('Төлсөн бэлэн мөнгөний дүн захиалгын нийт дүнгээс бага байна!');
      return;
    }

    if (paymentMethod === 'SPLIT') {
      if (splitCardNumber <= 0 || splitCardNumber >= subtotalMnt) {
        setErrorMsg('Картаар төлөх дүнг зөв оруулна уу!');
        return;
      }
    }

    if (paymentMethod === 'CREDIT') {
      if (!customerName.trim() && !customerPhone.trim()) {
        setErrorMsg('Зээлээр олгохын тулд Зээлдэгчийн нэр эсвэл утасны дугаарыг заавал оруулна уу!');
        return;
      }
    }

    setLoadingCheckout(true);
    setErrorMsg(null);

    try {
      let notesText = 'Кассын борлуулалт (POS)';
      if (paymentMethod === 'SPLIT') {
        notesText = `Кассын 2 Хуваасан борлуулалт: Картаар ${formatMNT(splitCardNumber)}, Бэлнээр ${formatMNT(remainingCashMnt)}`;
      } else if (paymentMethod === 'CREDIT') {
        notesText = `⏳ ЗЭЭЛЭЭР (Дараа төлбөрт) | Тэмдэглэл: ${creditNote.trim() || 'Тэмдэглэлгүй'}`;
      }

      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          paymentMethod: paymentMethod === 'SPLIT' ? 'CARD' : paymentMethod,
          paidAmountMnt: paymentMethod === 'CASH' ? paidAmountNumber || subtotalMnt : (paymentMethod === 'CREDIT' ? 0 : subtotalMnt),
          notes: notesText,
          customerName: customerName.trim() || (paymentMethod === 'CREDIT' ? 'Зээлдэгч Үйлчлүүлэгч' : undefined),
          customerPhone: customerPhone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Борлуулалт хийхэд алдаа гарлаа');

      playCashSound();
      setCompletedOrder({ ...data.order, changeMnt, paidAmountMnt: paidAmountNumber || subtotalMnt });
      setCart([]);
      setPaidAmountText('');
      setSplitCardText('');
      setCustomerName('');
      setCustomerPhone('');
      try {
        const channel = new BroadcastChannel('inky_stock_sync');
        channel.postMessage({ type: 'STOCK_CHANGED', timestamp: Date.now() });
        channel.close();
      } catch (e) {}
      localStorage.setItem('inky_last_stock_update', Date.now().toString());

      if (onProductUpdate) onProductUpdate();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingCheckout(false);
    }
  };

  // Filter products by category and search term
  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'bundles') return false;
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      (p.category?.name && p.category.name.toLowerCase().includes(q));

    return matchesCat && matchesQuery;
  });

  // Filter bundles by search term and selected category
  const filteredBundles = (bundles || []).filter((b) => {
    if (selectedCategory !== 'all' && selectedCategory !== 'bundles') return false;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || b.name.toLowerCase().includes(q) || `bdl-${b.id.slice(-4)}`.includes(q);
    return matchesQuery;
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Hardware Barcode Scanner Listener */}
      <BarcodeListener onScan={handleBarcodeScanned} />

      {/* POS Top Header Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-mono font-bold text-xs uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>USB Бар код уншигч &amp; Касс бэлэн</span>
          </div>
        </div>

        {/* Barcode Search / Scan Manual Input */}
        <form onSubmit={handleManualBarcodeSubmit} className="w-full md:w-auto flex items-center gap-2">
          <div className="relative flex-1 md:w-80">
            <Barcode className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Бар код уншуулах эсвэл гараар бичих..."
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono font-bold"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all shrink-0"
          >
            Нэмэх
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Dual Grid: Left Catalog, Right Cashier Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Product Catalog Grid & Search (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Controls: Search & Categories */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Барааны нэр, бар код эсвэл ангилалаар хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-600 transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Бүх Бараа ({products.length})
              </button>

              {bundles.length > 0 && (
                <button
                  onClick={() => setSelectedCategory('bundles')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 border flex items-center gap-1 ${
                    selectedCategory === 'bundles'
                      ? 'bg-cherry-600 text-white border-cherry-500 shadow-xs'
                      : 'bg-cherry-50 text-cherry-700 border-cherry-200 hover:bg-cherry-100'
                  }`}
                >
                  <span>🎁 Иж Бүрэн Багц ({bundles.length})</span>
                </button>
              )}

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product & Bundle Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {/* Render Bundles first if available */}
            {filteredBundles.map((bundle) => {
              const bundleProductId = `bundle-${bundle.id}`;
              const cartItem = cart.find((i) => i.productId === bundleProductId);
              const inCartQty = cartItem ? cartItem.quantity : 0;

              return (
                <div
                  key={bundle.id}
                  onClick={() => handleAddBundleToCart(bundle)}
                  className={`relative p-3 bg-white border border-cherry-200 rounded-2xl shadow-xs transition-all flex flex-col justify-between cursor-pointer select-none group hover:border-cherry-500 hover:shadow-md ${
                    inCartQty > 0 ? 'border-cherry-600 ring-2 ring-cherry-500/20 bg-cherry-50/20' : ''
                  }`}
                >
                  <div>
                    {/* Badge if in cart */}
                    {inCartQty > 0 && (
                      <span className="absolute top-2 right-2 bg-cherry-600 text-white font-mono font-extrabold text-[10px] w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10">
                        {inCartQty}
                      </span>
                    )}

                    <div className="aspect-square w-full bg-cherry-50 rounded-xl overflow-hidden mb-2 relative">
                      <img
                        src={getFirstImageUrl(bundle.imageUrl)}
                        alt={bundle.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-cherry-600 text-white text-[9px] font-black rounded-full font-mono shadow-xs">
                        -{bundle.discountPercent}% ХЯМДРАЛ
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-xs line-clamp-2 leading-snug group-hover:text-cherry-700 transition-colors">
                      🎁 {bundle.name}
                    </h4>

                    <span className="font-mono text-[10px] text-cherry-600 font-bold block mt-0.5">
                      Иж бүрэн багц ({bundle.items?.length || 0} бараа)
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cherry-100 text-cherry-800">
                      ИЖ БҮРДЭЛ
                    </span>

                    <span className="font-black text-cherry-600 text-xs font-sans">
                      {formatMNT(bundle.bundlePriceMnt)}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const cartItem = cart.find((i) => i.productId === product.id);
              const inCartQty = cartItem ? cartItem.quantity : 0;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && handleAddToCart(product)}
                  className={`relative p-3 bg-white border rounded-2xl shadow-xs transition-all flex flex-col justify-between cursor-pointer select-none group ${
                    isOutOfStock
                      ? 'opacity-50 bg-gray-50 border-gray-200 cursor-not-allowed'
                      : inCartQty > 0
                      ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/20'
                      : 'border-gray-200 hover:border-teal-500 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Badge if in cart */}
                    {inCartQty > 0 && (
                      <span className="absolute top-2 right-2 bg-teal-700 text-white font-mono font-extrabold text-[10px] w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10">
                        {inCartQty}
                      </span>
                    )}

                    <div className="aspect-square w-full bg-gray-50 rounded-xl overflow-hidden mb-2 relative">
                      <img
                        src={getFirstImageUrl(product.imageUrl)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <h4 className="font-bold text-gray-900 text-xs line-clamp-2 leading-snug group-hover:text-teal-700 transition-colors">
                      {product.name}
                    </h4>

                    <span className="font-mono text-[10px] text-gray-400 block mt-0.5">
                      #{product.barcode}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isOutOfStock
                          ? 'bg-red-100 text-red-700'
                          : product.stock <= 20
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isOutOfStock ? 'Дууссан' : `Үлдэгдэл: ${product.stock}`}
                    </span>

                    <span className="font-black text-gray-950 text-xs font-sans">
                      {formatMNT(product.isDiscounted && product.discountPriceMnt ? product.discountPriceMnt : product.priceMnt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Cashier Cart & Tender Checkout (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 min-h-[600px]">
          
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-teal-700" />
                <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wider">
                  Кассын Сагс ({cart.reduce((a, b) => a + b.quantity, 0)} ш)
                </h3>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs font-bold text-red-600 hover:text-red-800 underline"
                >
                  Цэвэрлэх
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-[280px] overflow-y-auto divide-y divide-gray-100 my-3 pr-1">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-gray-400 space-y-2">
                  <Barcode className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-xs font-bold text-gray-500">Сагс одоогоор хоосон байна</p>
                  <p className="text-[11px] text-gray-400">
                    Бараа уншуулах эсвэл зүүн талын каталогоос сонгон дарж нэмнэ үү.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-bold text-gray-900 text-xs truncate">{item.productName}</h5>
                        {item.isBundle && (
                          <span className="text-[9px] font-black bg-cherry-100 text-cherry-700 px-1.5 py-0.5 rounded font-mono shrink-0">
                            ИЖ БҮРДЭЛ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] mt-0.5">
                        <span className="font-mono text-gray-400">#{item.barcode}</span>
                        <span className="font-extrabold text-teal-900 font-sans">
                          {formatMNT(item.priceMnt)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                      <button
                        onClick={() => handleQtyChange(item.productId, -1)}
                        className="p-1 hover:bg-white rounded-lg text-gray-700 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="font-mono font-extrabold text-xs px-2 text-gray-900 min-w-[24px] text-center">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => handleQtyChange(item.productId, 1)}
                        className="p-1 hover:bg-white rounded-lg text-gray-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete Item */}
                    <button
                      onClick={() => handleRemoveFromCart(item.productId)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Method & Total Calculation Section */}
          <div className="pt-4 border-t border-gray-200 space-y-4">
            
            {/* Total MNT Display */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-inner">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Төлөх нийт дүн:
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-sans">
                {formatMNT(subtotalMnt)}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-700 block uppercase tracking-wider">
                💳 Төлбөрийн Төрөл Сонгох
              </label>
              <div className="grid grid-cols-5 gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all border ${
                    paymentMethod === 'CASH'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-md'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  Бэлэн
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all border ${
                    paymentMethod === 'TRANSFER'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-md'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  Шилжүүлэг
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all border ${
                    paymentMethod === 'CARD'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-md'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Карт
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('SPLIT');
                    setSplitCardText('');
                  }}
                  className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all border ${
                    paymentMethod === 'SPLIT'
                      ? 'bg-purple-700 text-white border-purple-700 shadow-md'
                      : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  2 Хуваах
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('CREDIT');
                  }}
                  className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all border ${
                    paymentMethod === 'CREDIT'
                      ? 'bg-rose-700 text-white border-rose-700 shadow-md'
                      : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  Зээлээр
                </button>
              </div>
            </div>

            {/* CREDIT (ДАРАА ТӨЛБӨРТ / ЗЭЭЛЭЭР) INPUTS */}
            {paymentMethod === 'CREDIT' && (
              <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-3">
                <div className="text-xs font-extrabold text-rose-950 flex items-center justify-between">
                  <span>⏳ Зээлээр (Дараа төлбөрт) олгох:</span>
                  <span className="text-[10px] font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                    Авлагад бүртгэгдэнэ
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-rose-900 block mb-1">
                      1. Зээлдэгчийн нэр / Байгууллага *
                    </label>
                    <input
                      type="text"
                      placeholder="Жишээ: Б. Болд (Энх-Амар ХХК)..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-rose-900 block mb-1">
                      2. Холбоо барих утасны дугаар *
                    </label>
                    <input
                      type="text"
                      placeholder="Жишээ: 99112233..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-rose-900 block mb-1">
                      3. Зээлийн тэмдэглэл / Төлөх хугацаа
                    </label>
                    <input
                      type="text"
                      placeholder="Жишээ: 8 сарын 15-нд төлнө..."
                      value={creditNote}
                      onChange={(e) => setCreditNote(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SPLIT PAYMENT (CARD + CASH) INPUTS */}
            {paymentMethod === 'SPLIT' && (
              <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-3">
                <div className="text-xs font-extrabold text-purple-950 flex items-center justify-between">
                  <span>💳 Картаар + 💵 Бэлнээр хувааж төлөх:</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold text-purple-900 block mb-1">
                      1. Картаар уншуулах дүн (₮):
                    </label>
                    <input
                      type="number"
                      placeholder="Картаар уншуулсан дүн..."
                      value={splitCardText}
                      onChange={(e) => setSplitCardText(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl font-mono text-xs font-bold text-gray-900 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {splitCardNumber > 0 && (
                    <div className="p-2.5 bg-white rounded-xl border border-purple-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Үлдсэн бэлнээр төлөх дүн:</span>
                        <span className="font-extrabold font-mono text-purple-900 text-sm">
                          {formatMNT(remainingCashMnt)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-amber-900 block mb-1">
                      2. Үлдсэн бэлнээр өгсөн мөнгө (₮):
                    </label>
                    <input
                      type="number"
                      placeholder="Бэлнээр өгсөн дүн..."
                      value={paidAmountText}
                      onChange={(e) => setPaidAmountText(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-mono text-xs font-bold text-gray-900 focus:ring-2 focus:ring-amber-500"
                    />
                    {paidAmountNumber > 0 && remainingCashMnt > 0 && (
                      <span className="text-xs font-bold font-mono text-emerald-700 block mt-1">
                        Хариулт мөнгө: {formatMNT(changeMnt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CASH Payment Input & Auto Change Calculation */}
            {paymentMethod === 'CASH' && (
              <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-amber-900">
                    💵 Үйлчлүүлэгчийн өгсөн мөнгө (₮):
                  </label>
                  {paidAmountNumber > 0 && (
                    <span className="text-xs font-bold font-mono text-amber-800">
                      Хариулт: <span className="font-extrabold text-emerald-700 text-sm">{formatMNT(changeMnt)}</span>
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  placeholder="Мөнгөн дүн оруулна уу (Жишээ: 50000)..."
                  value={paidAmountText}
                  onChange={(e) => setPaidAmountText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl font-mono text-sm font-extrabold text-gray-900 focus:ring-2 focus:ring-amber-500"
                />

                {/* Quick Cash Presets */}
                <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                  {[subtotalMnt, 5000, 10000, 20000, 50000, 100000].map((amt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPaidAmountText(amt.toString())}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg font-bold shadow-2xs"
                    >
                      {amt === subtotalMnt ? 'Яг таг' : formatMNT(amt)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bank Transfer QR Code Display */}
            {paymentMethod === 'TRANSFER' && banksList.length > 0 && (
              <div className="p-3.5 bg-teal-50/60 rounded-2xl border border-teal-200 text-xs space-y-2">
                <span className="font-extrabold text-teal-950 block">📱 Дэлгүүрийн Банкны QR:</span>
                <div className="flex items-center gap-3">
                  <img
                    src={banksList[0].qrImageUrl}
                    alt="Bank QR"
                    className="w-20 h-20 object-contain rounded-xl border border-teal-300 bg-white p-1"
                  />
                  <div className="text-teal-900 font-sans space-y-0.5">
                    <span className="font-extrabold block text-sm">{banksList[0].bankName}</span>
                    <span className="font-mono block text-xs font-bold text-teal-800">Данс: {banksList[0].accountNumber}</span>
                    <span className="block text-[11px] text-gray-600">Нэр: {banksList[0].accountName}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Checkout Button */}
            <button
              type="button"
              disabled={cart.length === 0 || loadingCheckout}
              onClick={handleCheckout}
              className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {loadingCheckout ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Төлбөр Ботсож байна...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  <span>Борлуулалт Баталгаажуулах ({formatMNT(subtotalMnt)})</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* POS Receipt Modal (Completed Order) */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-mono text-xs">
          <div className="relative w-full max-w-md bg-white border border-gray-300 rounded-3xl p-6 shadow-2xl text-gray-900 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
              <span className="text-base font-black text-slate-900 block font-sans">INKY SISTERS SHOP</span>
              <span className="text-[11px] text-gray-500 block">КАССЫН ТӨЛБӨРИЙН БАРИМТ</span>
              <span className="text-xs font-bold text-teal-800 block">№ {completedOrder.orderNumber}</span>
              <span className="text-[10px] text-gray-400 block">{new Date(completedOrder.createdAt || Date.now()).toLocaleString('mn-MN')}</span>
            </div>

            <div className="space-y-1 divide-y divide-gray-100">
              {completedOrder.items?.map((item: any) => (
                <div key={item.id} className="pt-1.5 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-bold text-gray-900 block font-sans">{item.productName}</span>
                    <span className="text-gray-400 text-[10px]">{item.quantity} ш × {formatMNT(item.priceMnt)}</span>
                  </div>
                  <span className="font-extrabold text-gray-950">{formatMNT(item.quantity * item.priceMnt)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-dashed border-gray-300 space-y-1">
              <div className="flex items-center justify-between text-sm font-extrabold text-gray-950 font-sans">
                <span>НИЙТ ДҮН:</span>
                <span>{formatMNT(completedOrder.totalMnt)}</span>
              </div>
              
              <div className="flex items-center justify-between text-[11px] text-gray-600">
                <span>Төлбөрийн хэлбэр:</span>
                <span className="font-bold text-teal-800">
                  {completedOrder.paymentMethod === 'CASH'
                    ? 'Бэлэн мөнгө'
                    : completedOrder.paymentMethod === 'CARD'
                    ? 'Карт (POS)'
                    : 'Дансны Шилжүүлэг'}
                </span>
              </div>

              {completedOrder.paymentMethod === 'CASH' && (
                <>
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>Өгсөн мөнгө:</span>
                    <span className="font-bold">{formatMNT(completedOrder.paidAmountMnt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-extrabold text-emerald-700">
                    <span>Хариулт мөнгө:</span>
                    <span>{formatMNT(completedOrder.changeMnt)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 text-center text-[10px] text-gray-400 border-t border-gray-100 space-y-1 font-sans">
              <p>Манайхаар үйлчлүүлсэнд баярлалаа! 🙏</p>
              <p>Дахин үйлчлүүлэхийг урьж байна.</p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 font-sans"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Баримт Хэвлэх</span>
              </button>

              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl font-sans"
              >
                Хаах
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

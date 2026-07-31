'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatMNT } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { X, CheckCircle2, QrCode, CreditCard, ShieldCheck, MapPin, Phone, User, Mail, FileText, ArrowRight, Loader2 } from 'lucide-react';

export default function CheckoutModal() {
  const { isCheckoutOpen, setIsCheckoutOpen, cart, totalAmountMnt, originalTotalAmountMnt, clearCart } = useCart();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState<string>('KHAN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [activeBankQR, setActiveBankQR] = useState<any | null>(null);

  useEffect(() => {
    if (isCheckoutOpen) {
      fetch('/api/banks')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setBanks(data);
            setSelectedBankCode(data[0].bankCode || 'KHAN');
            setActiveBankQR(data[0]);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isCheckoutOpen]);

  const handleBankSelect = (bankCode: string) => {
    setSelectedBankCode(bankCode);
    const found = banks.find((b) => b.bankCode === bankCode);
    if (found) setActiveBankQR(found);
  };

  const handleStep1Next = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !deliveryAddress) {
      setError('Овог нэр, Утасны дугаар болон Хүргэлтийн хаягаа гүйцэд оруулна уу.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 8) {
      setError('Утасны дугаар заавал 8 оронтой тоо байх ёстой (жишээ нь: 99112233).');
      return;
    }

    setStep(2);
    setError(null);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          deliveryAddress,
          notes,
          selectedBank: selectedBankCode,
          items: cart,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Захиалга үүсгэхэд алдаа гарлаа');

      setPlacedOrder(data.order);
      if (data.bank) setActiveBankQR(data.bank);
      clearCart();
      setStep(3);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isCheckoutOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-2xl text-gray-900 my-8 overflow-hidden transform transition-all animate-scaleUp">

        <button
          onClick={() => {
            setIsCheckoutOpen(false);
            setStep(1);
          }}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5 border-b border-gray-100 pb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 text-xs font-bold uppercase mb-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Бүртгэлгүй Шууд Захиалга
          </div>
          <h3 className="text-xl font-bold text-gray-900 font-sans">
            {step === 3 ? '🎉 Захиалга Баталгаажлаа!' : 'Захиалга Хүргүүлэх & Банкны QR Төлбөр'}
          </h3>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* STEP 1: Customer Details */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Овог Нэр *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Бат-Эрдэнэ"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Утасны дугаар *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={8}
                  placeholder="99112233"
                  value={customerPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setCustomerPhone(val);
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500 font-mono tracking-wider"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Имэйл хаяг (Мэдэгдэл хүлээн авах)
              </label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Хүргэлтийн Гэрийн/Ажлын Хаяг *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Нэмэлт тэмдэглэл (Сонголттой)
              </label>
              <input
                type="text"
                placeholder="Хүргэлтийн нэмэлт заавар..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 block font-semibold">Захиалгын нийт дүн:</span>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-xl font-extrabold text-red-600">
                    {formatMNT(totalAmountMnt)}
                  </span>
                  {originalTotalAmountMnt > totalAmountMnt && (
                    <span className="text-xs font-bold text-gray-400 line-through">
                      {formatMNT(originalTotalAmountMnt)}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center gap-2"
              >
                <span>Дараах: Банк & QR сонгох</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Bank Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-teal-700" />
              Төлбөр төлөх банк сонгоно уу (2-3 Банкны сонголт)
            </h4>

            <div className="grid grid-cols-3 gap-2">
              {banks.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => handleBankSelect(bank.bankCode)}
                  className={`p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${selectedBankCode === bank.bankCode
                      ? 'bg-teal-50 border-teal-600 text-teal-900 shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <QrCode className="w-5 h-5 text-teal-700" />
                  <span>{bank.bankName}</span>
                </button>
              ))}
            </div>

            {activeBankQR && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row items-center gap-5">
                <div className="w-36 h-36 bg-white p-2 rounded-xl border border-gray-300 shadow-md flex-shrink-0">
                  <img
                    src={activeBankQR.qrImageUrl}
                    alt={activeBankQR.bankName}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 space-y-2 text-xs w-full">
                  <div>
                    <span className="text-[11px] text-gray-500 block">Банкны Нэр:</span>
                    <span className="font-bold text-gray-900 text-sm">{activeBankQR.bankName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-gray-500 block">Дансны Дугаар:</span>
                      <span className="font-mono font-bold text-teal-800 text-sm">
                        {activeBankQR.accountNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 block">Хүлээн Авагч:</span>
                      <span className="font-bold text-gray-800">
                        {activeBankQR.accountName}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs">
                    <span className="text-gray-600 block font-semibold mb-0.5">Гүйлгээний Утга:</span>
                    <span className="font-mono font-extrabold text-amber-900 text-sm block">
                      {customerPhone} {customerName}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 font-sans">
                    <span className="text-xs text-gray-500 font-bold">Шилжүүлэх Нийт Дүн:</span>
                    <div className="text-right font-mono">
                      <span className="text-lg font-black text-red-600 block">
                        {formatMNT(totalAmountMnt)}
                      </span>
                      {originalTotalAmountMnt > totalAmountMnt && (
                        <span className="text-xs font-bold text-gray-400 line-through block">
                          {formatMNT(originalTotalAmountMnt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                Буцах
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handlePlaceOrder}
                className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Илгээж байна...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Захиалга Илгээх ба Баталгаажуулах</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Order Placed Success */}
        {step === 3 && placedOrder && (
          <div className="py-4 space-y-5 text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto text-teal-700 shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-900 text-xs font-extrabold uppercase mb-2">
                ✓ Төлбөрийн Захиалга Үүсгэгдлээ
              </span>
              <h4 className="text-2xl font-extrabold text-gray-900 font-sans">
                Таны Захиалга Амжилттай Баталгаажлаа!
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Таны захиалга системд амжилттай бүртгэгдсэн бөгөөд төлбөрийн мэдээллийг доороос харна уу.
              </p>
            </div>

            {/* Payment Memo & Order Code Highlight Box */}
            <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl text-left space-y-3.5 text-xs text-gray-800 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-teal-200/80">
                <span className="font-extrabold text-teal-950 text-xs flex items-center gap-1.5">
                  <span>📌 Захиалга & Төлбөрийн баримтын мэдээлэл:</span>
                </span>
                <span className="px-2.5 py-0.5 bg-teal-200 text-teal-950 font-extrabold text-[10px] rounded uppercase">
                  Шалгагдаж байна
                </span>
              </div>

              {/* Order Verification Code Display */}
              <div className="bg-white p-3.5 rounded-xl border border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-500 block font-bold uppercase">Захиалга баталгаажуулах код:</span>
                  <span className="font-mono font-extrabold text-teal-900 text-lg block">
                    {placedOrder.orderNumber}
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    (Системд захиалгаа тодруулах баталгаажуулах код)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(placedOrder.orderNumber)}
                  className="px-3 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-900 text-xs font-bold rounded-lg border border-teal-300 transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>📋 Код хуулах</span>
                </button>
              </div>

              {/* Bank Payment Details */}
              <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-teal-200">
                <div>
                  <span className="text-[11px] text-gray-500 block font-bold uppercase">Гүйлгээний утга:</span>
                  <span className="font-mono font-bold text-gray-900 text-xs block mt-0.5">
                    {placedOrder.customerPhone} {placedOrder.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block font-bold uppercase">Шилжүүлсэн Нийт Дүн:</span>
                  <div className="font-mono">
                    <span className="font-black text-red-600 text-sm block">
                      {formatMNT(placedOrder.totalMnt)}
                    </span>
                    {originalTotalAmountMnt > placedOrder.totalMnt && (
                      <span className="text-[11px] font-extrabold text-gray-400 line-through block">
                        {formatMNT(originalTotalAmountMnt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Simple Instructions */}
              <ul className="space-y-1.5 text-xs text-gray-700 leading-relaxed pt-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-teal-700 font-bold">•</span>
                  <span>
                    Захиалгын код: <b className="text-teal-900 font-mono">{placedOrder.orderNumber}</b>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-teal-700 font-bold">•</span>
                  <span>
                    Гүйлгээний утга: <b>{placedOrder.customerPhone} {placedOrder.customerName}</b>
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-teal-700 font-bold">•</span>
                  <span>
                    Админ дансны гүйлгээг шалгаж баталгаажуулаад бэлэн болмогц хүргэлтэд олгоно.
                  </span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                setIsCheckoutOpen(false);
                setStep(1);
                window.location.href = '/';
              }}
              className="w-full py-3.5 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm shadow-md transition-all active:scale-95"
            >
              Дэлгүүрт буцах
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

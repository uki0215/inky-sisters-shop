'use client';

import React, { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import { QrCode, Plus, Trash2, Edit2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function BankManager() {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBank, setEditingBank] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // New bank form state
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('KHAN');
  const [bankLogoUrl, setBankLogoUrl] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/banks');
      const data = await res.json();
      if (Array.isArray(data)) setBanks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleResetForm = () => {
    setBankName('');
    setBankCode('KHAN');
    setBankLogoUrl('');
    setAccountName('');
    setAccountNumber('');
    setQrImageUrl('');
    setIsAdding(false);
    setEditingBank(null);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingBank
      ? editingBank
      : {
        bankName,
        bankCode,
        bankLogoUrl,
        accountName,
        accountNumber,
        qrImageUrl: qrImageUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=BankQR',
        isActive: true,
      };

    try {
      const res = await fetch('/api/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        handleResetForm();
        fetchBanks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm('Энэ банкны дансны мэдээллийг устгах уу?')) return;
    try {
      const res = await fetch(`/api/banks/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchBanks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 font-sans flex items-center gap-2">
            <QrCode className="w-5 h-5 text-teal-700" />
            Банкны Данс & QR Мэдээлэл Удирдах
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            Админ шинээр банк нэмэх, засах, устгах бөгөөд Home page болон Төлбөр хийх хэсэгт автоматаар шинэчлэгдэнэ.
          </p>
        </div>

        <button
          onClick={() => {
            handleResetForm();
            setIsAdding(true);
          }}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Шинэ Данс Нэмэх</span>
        </button>
      </div>

      {/* Add / Edit Form Modal */}
      {(isAdding || editingBank) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleSaveBank}
            className="bg-white border border-gray-200 rounded-3xl p-6 max-w-lg w-full text-gray-900 space-y-4 shadow-2xl animate-scaleUp"
          >
            <h4 className="font-extrabold text-base text-gray-900 font-sans">
              {editingBank ? `${editingBank.bankName} Дансны Мэдээлэл Засах` : '➕ Шинэ Банкны Данс Нэмэх'}
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-gray-700 font-bold block mb-1">Банкны Нэр *</label>
                <input
                  type="text"
                  required
                  value={editingBank ? editingBank.bankName : bankName}
                  onChange={(e) =>
                    editingBank
                      ? setEditingBank({ ...editingBank, bankName: e.target.value })
                      : setBankName(e.target.value)
                  }
                  placeholder="e.g. Хаан Банк, Голомт Банк"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans"
                />
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">Банкны Код (Код)</label>
                <input
                  type="text"
                  required
                  value={editingBank ? editingBank.bankCode : bankCode}
                  onChange={(e) =>
                    editingBank
                      ? setEditingBank({ ...editingBank, bankCode: e.target.value })
                      : setBankCode(e.target.value)
                  }
                  placeholder="KHAN, GOLOMT, TDB"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-gray-700 font-bold block mb-1">Дансны Нэр (Эзэмшигч) *</label>
                <input
                  type="text"
                  required
                  value={editingBank ? editingBank.accountName : accountName}
                  onChange={(e) =>
                    editingBank
                      ? setEditingBank({ ...editingBank, accountName: e.target.value })
                      : setAccountName(e.target.value)
                  }
                  placeholder="Инкий Систерс ХХК"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans"
                />
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">Дансны Дугаар *</label>
                <input
                  type="text"
                  required
                  value={editingBank ? editingBank.accountNumber : accountNumber}
                  onChange={(e) =>
                    editingBank
                      ? setEditingBank({ ...editingBank, accountNumber: e.target.value })
                      : setAccountNumber(e.target.value)
                  }
                  placeholder="5091234567"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Банкны Лого Зураг</label>
                <ImageUploader
                  value={editingBank ? editingBank.bankLogoUrl : bankLogoUrl}
                  onChange={(url) =>
                    editingBank
                      ? setEditingBank({ ...editingBank, bankLogoUrl: url })
                      : setBankLogoUrl(url)
                  }
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">QR Зураг (Заавал биш)</label>
                <ImageUploader
                  value={editingBank ? editingBank.qrImageUrl : qrImageUrl}
                  onChange={(url) =>
                    editingBank
                      ? setEditingBank({ ...editingBank, qrImageUrl: url })
                      : setQrImageUrl(url)
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Цуцлах
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
              >
                Хадгалах
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of Bank Accounts */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-xs font-bold">Дансны мэдээлэл уншиж байна...</div>
      ) : banks.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-xs text-gray-400">
          Одоогоор банкны данс бүртгэгдээгүй байна. Дээрх "Шинэ Данс Нэмэх" товч дээр даран бүртгэнэ үү.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {banks.map((bank) => (
            <div
              key={bank.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="font-extrabold text-teal-950 text-sm font-sans">{bank.bankName}</span>
                  <span className="text-[10px] font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded-lg border border-teal-200 font-bold">
                    {bank.bankCode}
                  </span>
                </div>

                <div className="w-36 h-36 bg-white p-2 rounded-2xl mx-auto shadow-md border border-gray-200 flex items-center justify-center overflow-hidden">
                  <img src={bank.qrImageUrl} alt={bank.bankName} className="w-full h-full object-contain" />
                </div>

                <div className="space-y-1.5 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-gray-400 text-[11px] block">Дансны Дугаар:</span>
                    <span className="font-mono font-extrabold text-gray-900 text-sm block tracking-wider">{bank.accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[11px] block">Эзэмшигч:</span>
                    <span className="font-bold text-gray-800 block">{bank.accountName}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setEditingBank(bank)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 border border-gray-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Засах
                </button>
                <button
                  onClick={() => handleDeleteBank(bank.id)}
                  className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 border border-red-200"
                  title="Устгах"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

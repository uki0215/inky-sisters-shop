'use client';

import React, { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import {
  User,
  Lock,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  MapPin,
  Phone,
  Mail,
  Clock,
  Store,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function ProfileManager() {
  const [username, setUsername] = useState('inkysisters');
  const [currentPassword, setCurrentPassword] = useState('');
  
  // Login Password Change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // DB Reset Password Change
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Store Contact Details
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.username) setUsername(data.username);
      })
      .catch(console.error);

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setAddress(data.address || 'Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо, Энхтайваны өргөн чөлөө');
          setPhone(data.phone || '88112233, 99112233');
          setEmail(data.email || 'info@inkysisters.mn');
          setWorkingHours(data.workingHours || 'Даваа - Ням: 10:00 - 20:00');
          setLogoUrl(data.logoUrl || '');
        }
      })
      .catch(console.error);
  }, []);

  const handleStoreSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess(null);
    setSettingsError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          phone,
          email,
          workingHours,
          logoUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Дэлгүүрийн мэдээлэл хадгалахад алдаа гарлаа');
      }

      setSettingsSuccess('✓ Дэлгүүрийн хаяг болон холбоо барих мэдээлэл амжилттай шинэчлэгдлээ!');
    } catch (err: any) {
      setSettingsError(err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError('Одоогийн нууц үгээ оруулна уу.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('Шинэ нэвтрэх нууц үг болон баталгаажуулах нууц үг хоорондоо таарахгүй байна.');
      return;
    }

    if (newResetPassword && newResetPassword !== confirmResetPassword) {
      setError('Өгөгдөл арилгах тусгай нууц үг хоорондоо таарахгүй байна.');
      return;
    }

    if (!newPassword && !newResetPassword && username === 'inkysisters') {
      setError('Солих шинэ нэвтрэх нууц үг эсвэл өгөгдөл арилгах тусгай нууц үгээ оруулна уу.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newUsername: username,
          newPassword: newPassword || undefined,
          newResetPassword: newResetPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Нууц үг солиход алдаа гарлаа');

      setSuccess('✓ Админы тохиргоо болон нууц үг амжилттай шинэчлэгдлээ!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNewResetPassword('');
      setConfirmResetPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      
      {/* 1. STORE CONTACT & ADDRESS SETTINGS */}
      <form onSubmit={handleStoreSettingsSave} className="bg-white border border-gray-200 p-6 rounded-3xl space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 font-sans flex items-center gap-2">
              <Store className="w-5 h-5 text-teal-700" />
              Дэлгүүрийн Хаяг & Холбоо Барих Мэдээлэл
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-sans">
              Энд оруулсан хаяг, утас болон лого нь Footer болон Нүүр хуудсан дээр шууд харагдана.
            </p>
          </div>
        </div>

        {settingsError && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{settingsError}</span>
          </div>
        )}

        {settingsSuccess && (
          <div className="p-3.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>{settingsSuccess}</span>
          </div>
        )}

        {/* Logo Upload */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Дэлгүүрийн Лого (Logo Image)</label>
          <ImageUploader
            value={logoUrl}
            onChange={(url) => setLogoUrl(url)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500" /> Дэлгүүрийн Байршил / Хаяг
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-sans focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-600" /> Холбоо Барих Дугаар
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-sans focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-blue-600" /> И-мэйл Хаяг
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-sans focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" /> Цагийн Хуваарь
            </label>
            <input
              type="text"
              required
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-sans focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={settingsLoading}
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{settingsLoading ? 'Хадгалж байна...' : 'Хаяг & Холбоо Барих Мэдээлэл Хадгалах'}</span>
          </button>
        </div>
      </form>

      {/* 2. ADMIN PROFILE & PASSWORDS CHANGE */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-5">
        <h3 className="text-base font-extrabold text-gray-900 font-sans flex items-center gap-2 border-b border-gray-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-teal-700" />
          Админы Нууц Үг Солих
        </h3>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-5 font-sans">
          
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-700" /> Админы Нэвтрэх Нэр (Username)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-600" /> Одоогийн Нууц Үг (Current Password) *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">Тохиргоо болон нууц үг шинэчлэхийн тулд одоогийн нууц үгээ заавал оруулна уу.</p>
          </div>

          {/* CHANGE LOGIN PASSWORD SECTION */}
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-teal-700" />
                1. Нэвтрэх Нууц Үг Солих
              </h4>
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-bold"
              >
                {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showLoginPassword ? 'Нуух' : 'Харуулах'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Шинэ Нэвтрэх Нууц Үг:</label>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Шинэ Нууц Үг Давтах:</label>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* CHANGE DB RESET PASSWORD SECTION */}
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-rose-700" />
                2. 🔒 Өгөгдөл Арилгах Тусгай Нууц Үг Солих (DB Reset Password)
              </h4>
              <button
                type="button"
                onClick={() => setShowResetPassword(!showResetPassword)}
                className="text-xs text-rose-700 hover:text-rose-900 flex items-center gap-1 font-bold"
              >
                {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showResetPassword ? 'Нуух' : 'Харуулах'}</span>
              </button>
            </div>

            <p className="text-[11px] text-rose-700 leading-relaxed">
              Системийн бүх өгөгдөл, бараа, захиалга, санхүүг 0 болгож цэвэрлэх үед асуугдах аюулгүй байдлын тусгай нууц үг. (Оруулсны дараа textbox-д хадгалагдахгүй ил харагдахгүй).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Шинэ Өгөгдөл Арилгах Нууц Үг:</label>
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-rose-300 rounded-xl text-sm font-mono font-bold text-rose-950 focus:ring-2 focus:ring-rose-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Тусгай Нууц Үг Давтах:</label>
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmResetPassword}
                  onChange={(e) => setConfirmResetPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-rose-300 rounded-xl text-sm font-mono font-bold text-rose-950 focus:ring-2 focus:ring-rose-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Хадгалж байна...' : 'Нууц Үг & Тохиргоо Хадгалах'}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

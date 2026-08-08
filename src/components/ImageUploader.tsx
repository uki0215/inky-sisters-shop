'use client';

import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Loader2, Check, X, AlertTriangle } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUploader({ value, onChange, label = 'Барааны Зураг' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'file' | 'url'>('file');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        onChange(data.url);
      } else {
        setError(data.error || 'Зураг хуулахад алдаа гарлаа.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Зургаа хуулахад холболтын алдаа гарлаа.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700">{label}</label>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() => { setMode('file'); setError(null); }}
            className={`px-2 py-0.5 rounded-md transition-all ${mode === 'file' ? 'bg-white text-teal-800 shadow-xs font-bold' : 'hover:text-gray-900'}`}
          >
            📁 Файл сонгох
          </button>
          <button
            type="button"
            onClick={() => { setMode('url'); setError(null); }}
            className={`px-2 py-0.5 rounded-md transition-all ${mode === 'url' ? 'bg-white text-teal-800 shadow-xs font-bold' : 'hover:text-gray-900'}`}
          >
            🔗 Линк оруулах
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            {error}
          </span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {mode === 'file' ? (
        <div className="relative border-2 border-dashed border-gray-300 hover:border-teal-500 rounded-2xl p-4 text-center bg-gray-50/50 hover:bg-teal-50/20 transition-all cursor-pointer group">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
          />

          <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-gray-400 group-hover:text-teal-600 transition-colors" />
            )}
            <span className="text-xs font-bold text-gray-700 group-hover:text-teal-700">
              {uploading ? 'Зураг хуулж байна...' : 'Компьютерээс зураг сонгож хуулах'}
            </span>
            <span className="text-[10px] text-gray-400">
              PNG, JPG, WEBP (Дээд хэмжээ 10MB)
            </span>
          </div>
        </div>
      ) : (
        <div className="relative flex items-center">
          <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="url"
            placeholder="https://images.unsplash.com/... эсвэл зургийн URL линк"
            value={value}
            onChange={(e) => { onChange(e.target.value); setError(null); }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-teal-500"
          />
        </div>
      )}

      {/* Image Preview */}
      {value && (
        <div className="relative aspect-[16/9] max-h-36 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200 mt-2 group shadow-xs">
          <img
            src={value}
            alt="Preview"
            onError={() => setError('Зургийн линк буруу эсвэл зураг ачаалагдах боломжгүй байна.')}
            className="w-full h-full object-contain bg-slate-900/5"
          />
          <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
            <Check className="w-3 h-3" /> Зураг сонгогдсон
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold p-1 rounded-full flex items-center justify-center shadow-md transition-all"
            title="Зураг устгах"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

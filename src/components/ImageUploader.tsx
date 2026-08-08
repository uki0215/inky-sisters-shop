'use client';

import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Loader2, X, AlertTriangle, Plus } from 'lucide-react';

interface ImageUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  values?: string[];
  onChangeMultiple?: (urls: string[]) => void;
  multiple?: boolean;
  label?: string;
}

const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const srcData = e.target?.result as string;
      if (!srcData) {
        resolve('');
        return;
      }
      const img = document.createElement('img');
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800;
          let w = img.width || 800;
          let h = img.height || 800;
          if (w > h) {
            if (w > MAX_SIZE) {
              h = Math.round(h * (MAX_SIZE / w));
              w = MAX_SIZE;
            }
          } else {
            if (h > MAX_SIZE) {
              w = Math.round(w * (MAX_SIZE / h));
              h = MAX_SIZE;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const webp = canvas.toDataURL('image/webp', 0.85);
            if (webp && webp.length > 50) {
              resolve(webp);
              return;
            }
          }
          resolve(srcData);
        } catch (err) {
          resolve(srcData);
        }
      };
      img.onerror = () => resolve(srcData);
      img.src = srcData;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export default function ImageUploader({
  value = '',
  onChange,
  values,
  onChangeMultiple,
  multiple = false,
  label = 'Барааны Зураг',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');

  // Clean image list extraction
  const getImagesList = (): string[] => {
    let raw: string[] = [];
    if (multiple && values && Array.isArray(values) && values.length > 0) {
      raw = values;
    } else if (typeof value === 'string' && value.trim()) {
      raw = value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return Array.from(new Set(raw)).filter((url) => url && url.length > 5);
  };

  const currentImages = getImagesList();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    e.target.value = '';
    setUploading(true);
    setError(null);

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        if (onChange) onChange(data.url);
      } else {
        const fallbackUrl = await compressImageFile(file);
        if (onChange) onChange(fallbackUrl);
      }
    } catch (err: any) {
      console.error(err);
      setError('Зургаа оруулахад алдаа гарлаа.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    if (multiple && onChangeMultiple) {
      const combined = Array.from(new Set([...currentImages, url])).filter(Boolean);
      onChangeMultiple(combined);
    } else if (onChange) {
      onChange(url);
    }
    setUrlInput('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = currentImages.filter((_, idx) => idx !== indexToRemove);
    if (multiple && onChangeMultiple) {
      onChangeMultiple(updated);
    } else if (onChange) {
      onChange('');
    }
  };

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700">
          {label}
        </label>
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
            multiple={multiple}
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
              {uploading ? 'Зургийг оруулан уншиж байна...' : 'Компьютерээс зураг сонгож хуулах'}
            </span>
            <span className="text-[10px] text-gray-400">
              PNG, JPG, WEBP (Дээд хэмжээ 10MB)
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="url"
              placeholder="https://... Зургийн URL линк"
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setError(null); }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-2xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Нэмэх</span>
          </button>
        </div>
      )}

      {/* Uploaded Single Image Preview or Gallery */}
      {currentImages.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-gray-600 block">
            Сонгогдсон зураг:
          </span>
          <div className="flex flex-wrap gap-2.5">
            {currentImages.map((imgUrl, idx) => (
              <div
                key={`${imgUrl.slice(0, 30)}_${idx}`}
                className="relative w-28 h-28 rounded-xl overflow-hidden bg-gray-100 border-2 border-teal-500 ring-2 ring-teal-500/20 group shadow-xs"
              >
                <img
                  src={imgUrl}
                  alt="Product Image"
                  className="w-full h-full object-cover"
                />

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition-all"
                  title="Зураг устгах"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

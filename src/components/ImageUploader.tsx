'use client';

import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Loader2, Check, X, AlertTriangle, Star, Plus } from 'lucide-react';

interface ImageUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  values?: string[];
  onChangeMultiple?: (urls: string[]) => void;
  multiple?: boolean;
  label?: string;
}

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

  // Extract clean, unique list of image URLs
  const getImagesList = (): string[] => {
    let raw: string[] = [];
    if (values && Array.isArray(values) && values.length > 0) {
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

    // Reset input immediately to allow re-selecting and prevent duplicate events
    e.target.value = '';

    setUploading(true);
    setError(null);

    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.url && data.url.length > 10) {
          uploadedUrls.push(data.url);
        }
      }

      if (uploadedUrls.length > 0) {
        if (multiple && onChangeMultiple) {
          const combined = Array.from(new Set([...currentImages, ...uploadedUrls])).filter(Boolean);
          onChangeMultiple(combined);
        } else if (onChange) {
          onChange(uploadedUrls[0]);
        }
      } else {
        setError('Зураг уншихад алдаа гарлаа.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Зургаа уншихад холболтын алдаа гарлаа.');
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
      onChange(updated[0] || '');
    }
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (!multiple || indexToPrimary === 0) return;
    const item = currentImages[indexToPrimary];
    const rest = currentImages.filter((_, idx) => idx !== indexToPrimary);
    const updated = Array.from(new Set([item, ...rest])).filter(Boolean);
    if (onChangeMultiple) {
      onChangeMultiple(updated);
    }
  };

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700">
          {label} {multiple && !label.includes('Олон') && <span className="text-[11px] text-gray-500 font-normal">(Олон зураг оруулж болно)</span>}
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
              {uploading ? 'Зургуудыг уншиж байна...' : (multiple ? 'Нэг болон олон зураг сонгож хуулах' : 'Компьютерээс зураг сонгож хуулах')}
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

      {/* Uploaded Gallery Grid */}
      {currentImages.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-gray-600 block">
            Сонгогдсон зургууд ({currentImages.length}):
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {currentImages.map((imgUrl, idx) => (
              <div
                key={`${imgUrl.slice(0, 30)}_${idx}`}
                className={`relative aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 group shadow-xs ${
                  idx === 0 ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-gray-200'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Product Image ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Primary Thumbnail Badge */}
                {idx === 0 ? (
                  <span className="absolute top-1 left-1 bg-teal-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" /> Үндсэн
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="absolute top-1 left-1 bg-black/60 hover:bg-teal-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    title="Үндсэн зураг болгох"
                  >
                    Үндсэн болгох
                  </button>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition-all"
                  title="Зураг устгах"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Loader2, X, AlertTriangle, Plus, GripVertical } from 'lucide-react';

interface ImageUploaderProps {
  // Single image (backwards compat)
  value?: string;
  onChange?: (url: string) => void;
  // Multi image
  values?: string[];
  onChangeMultiple?: (urls: string[]) => void;
  label?: string;
  multiple?: boolean;
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=600&auto=format&fit=crop&q=80';

const isValidUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (t.length < 8) return false;
  return (
    t.startsWith('http://') ||
    t.startsWith('https://') ||
    t.startsWith('/') ||
    t.startsWith('data:image/')
  );
};

const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const srcData = e.target?.result as string;
      if (!srcData) { resolve(''); return; }
      const img = document.createElement('img');
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1000;
          let w = img.width || 1000;
          let h = img.height || 1000;
          if (w > h) {
            if (w > MAX_SIZE) { h = Math.round(h * (MAX_SIZE / w)); w = MAX_SIZE; }
          } else {
            if (h > MAX_SIZE) { w = Math.round(w * (MAX_SIZE / h)); h = MAX_SIZE; }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const webp = canvas.toDataURL('image/webp', 0.88);
            if (webp && webp.length > 50) { resolve(webp); return; }
          }
          resolve(srcData);
        } catch { resolve(srcData); }
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
  label = 'Барааны Зураг',
  multiple = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMulti = multiple || !!onChangeMultiple;

  // Normalise current images array
  const currentImages: string[] = isMulti
    ? (values ?? (value ? value.split(',').map(s => s.trim()).filter(isValidUrl) : []))
    : (value && isValidUrl(value) ? [value] : []);

  const pushImages = (newUrls: string[]) => {
    if (isMulti) {
      const merged = [...currentImages, ...newUrls];
      onChangeMultiple?.(merged);
      // also keep single onChange in sync with first image
      onChange?.(merged[0] ?? '');
    } else {
      const url = newUrls[newUrls.length - 1] ?? '';
      onChange?.(url);
    }
  };

  const removeImage = (idx: number) => {
    const next = currentImages.filter((_, i) => i !== idx);
    if (isMulti) {
      onChangeMultiple?.(next);
      onChange?.(next[0] ?? '');
    } else {
      onChange?.('');
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setError(null);
    const limit = isMulti ? files.length : 1;
    const slice = files.slice(0, limit);
    setUploadingCount(slice.length);
    const results: string[] = [];
    for (const file of slice) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data.url) {
          results.push(data.url);
        } else {
          const fallback = await compressImageFile(file);
          if (fallback) results.push(fallback);
        }
      } catch {
        const fallback = await compressImageFile(file);
        if (fallback) results.push(fallback);
      }
    }
    setUploading(false);
    setUploadingCount(0);
    if (results.length) pushImages(results);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await uploadFiles(files);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    await uploadFiles(files);
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url || !isValidUrl(url)) {
      setError('Зургийн зөв URL оруулна уу (https://... эсвэл http://...)');
      return;
    }
    setError(null);
    pushImages([url]);
    setUrlInput('');
  };

  // Drag reorder
  const handleDragStart = (idx: number) => setDraggingIdx(idx);
  const handleDragEnter = (idx: number) => {
    if (draggingIdx === null || draggingIdx === idx) return;
    const next = [...currentImages];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(idx, 0, moved);
    setDraggingIdx(idx);
    if (isMulti) {
      onChangeMultiple?.(next);
      onChange?.(next[0] ?? '');
    } else {
      onChange?.(next[0] ?? '');
    }
  };
  const handleDragEnd = () => setDraggingIdx(null);

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700">
          {label}
          {isMulti && (
            <span className="ml-1.5 text-[10px] text-teal-600 font-medium bg-teal-50 px-1.5 py-0.5 rounded-md">
              Олон зураг
            </span>
          )}
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
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer group
            ${dragOver ? 'border-teal-500 bg-teal-50/40 scale-[1.01]' : 'border-gray-300 hover:border-teal-500 bg-gray-50/50 hover:bg-teal-50/20'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={isMulti}
            onChange={handleFileChange}
            disabled={uploading}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
            {uploading ? (
              <>
                <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
                <span className="text-xs font-bold text-teal-700">
                  {uploadingCount > 1 ? `${uploadingCount} зураг хуулж байна...` : 'Зургийг уншиж байна...'}
                </span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-200 group-hover:bg-teal-100 transition-colors">
                  <Upload className="w-5 h-5 text-teal-600" />
                </div>
                <span className="text-xs font-bold text-gray-700 group-hover:text-teal-700">
                  {dragOver ? 'Зургийг энд оруулна уу' : isMulti ? 'Зурагнуудыг чирж оруулах эсвэл сонгох' : 'Компьютерээс зураг сонгох'}
                </span>
                <span className="text-[10px] text-gray-400">
                  PNG, JPG, WEBP {isMulti ? '• Хэд хэдэн зураг зэрэг сонгож болно' : '• Дээд хэмжээ 10MB'}
                </span>
              </>
            )}
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
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Нэмэх</span>
          </button>
        </div>
      )}

      {/* Image grid preview */}
      {currentImages.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-600">
              Нийт {currentImages.length} зураг
              {isMulti && <span className="text-gray-400 font-normal ml-1">(чирж дараалал өөрчлөх боломжтой)</span>}
            </span>
            {currentImages.length > 1 && isMulti && (
              <button
                type="button"
                onClick={() => { onChangeMultiple?.([]); onChange?.(''); }}
                className="text-[10px] text-red-500 hover:text-red-700 font-medium"
              >
                Бүгдийг устгах
              </button>
            )}
          </div>

          <div className={`grid gap-2 ${currentImages.length === 1 ? 'grid-cols-1' : 'grid-cols-3 sm:grid-cols-4'}`}>
            {currentImages.map((img, idx) => (
              <div
                key={idx}
                draggable={isMulti}
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all
                  ${idx === 0 ? 'border-teal-500 ring-2 ring-teal-400/30' : 'border-gray-200 hover:border-gray-300'}
                  ${draggingIdx === idx ? 'opacity-50 scale-95' : ''}
                  ${currentImages.length === 1 ? 'aspect-video max-h-48' : 'aspect-square'}`}
              >
                <img
                  src={img}
                  alt={`Зураг ${idx + 1}`}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                  className="w-full h-full object-cover"
                />

                {idx === 0 && currentImages.length > 1 && (
                  <span className="absolute top-1 left-1 bg-teal-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                    ҮНДСЭН
                  </span>
                )}

                {isMulti && currentImages.length > 1 && (
                  <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"
                  title="Зураг устгах"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add more button when multi */}
            {isMulti && currentImages.length > 0 && mode === 'file' && (
              <div
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-500 hover:bg-teal-50/20 flex flex-col items-center justify-center cursor-pointer transition-all relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-teal-600" />
                <span className="text-[10px] text-gray-400 mt-1 group-hover:text-teal-600">Нэмэх</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

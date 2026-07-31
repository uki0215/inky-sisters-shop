'use client';

import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Link as LinkIcon, Loader2, Check } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUploader({ value, onChange, label = 'Барааны Зураг' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        onChange(data.url);
      } else {
        alert('Зураг хуулахад алдаа гарлаа.');
      }
    } catch (err) {
      console.error(err);
      alert('Зургаа хуулахад алдаа гарлаа.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-700">{label}</label>

      <div className="relative border-2 border-dashed border-gray-300 hover:border-teal-500 rounded-2xl p-4 text-center bg-gray-50/50 transition-all cursor-pointer group">
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
            {uploading ? 'Зураг хуулж байна...' : 'Зураг сонгож хуулах'}
          </span>
          <span className="text-[10px] text-gray-400">
            PNG, JPG, WEBP файлууд дэмжигдэнэ
          </span>
        </div>
      </div>

      {/* Image Preview */}
      {value && (
        <div className="relative aspect-[16/9] max-h-32 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200 mt-2">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
            <Check className="w-3 h-3" /> Зураг бэлэн
          </div>
        </div>
      )}
    </div>
  );
}

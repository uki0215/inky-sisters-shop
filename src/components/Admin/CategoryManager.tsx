'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Tag, ChevronRight, Layers, FolderPlus, Image as ImageIcon, Upload, Loader2, Check } from 'lucide-react';

export default function CategoryManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [newCatImageUrl, setNewCatImageUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleFileUpload = async (file: File, catId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploadingImage(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        if (catId) {
          // Update existing category image directly via PATCH API
          await fetch(`/api/categories/${catId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: data.url }),
          });
          fetchCategories();
        } else {
          setNewCatImageUrl(data.url);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Зураг хуулахад алдаа гарлаа.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName,
          parentId: selectedParentId || null,
          imageUrl: newCatImageUrl || null,
        }),
      });

      if (res.ok) {
        setNewCatName('');
        setSelectedParentId('');
        setNewCatImageUrl('');
        fetchCategories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Энэ ангиллыг (болон түүний дэд ангилуудыг) устгах уу?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCategories();
    } catch (e) {
      console.error(e);
    }
  };

  // Separate parent categories (where parentId is null or missing)
  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      {/* Category Creation Form */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 font-sans flex items-center gap-2">
            🏷️ Дэлгүүрийн Үндсэн ба Дэд Ангилал (Sub-Categories)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            Үндсэн ангилал эсвэл түүний доторх Дэд ангилуудыг нэмж удирдах. Зураг хуулж болно.
          </p>
        </div>

        <form onSubmit={handleAddCategory} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Ангиллын Төрөл / Эцэг Ангилал:
              </label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white"
              >
                <option value="">📁 Үндсэн Ангилал үүсгэх</option>
                {parentCategories.map((p) => (
                  <option key={p.id} value={p.id}>
                    ↳ Дэд ангилал нэмэх: {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Ангиллын Нэр *
              </label>
              <input
                type="text"
                placeholder={selectedParentId ? "Дэд ангиллын нэр..." : "Үндсэн ангиллын нэр..."}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Ангиллын Зураг (Upload):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-teal-700" />
                  )}
                  <span>{uploadingImage ? 'Хуулж байна...' : 'Зураг оруулж сонгох'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* New Category Image Preview */}
          {newCatImageUrl && (
            <div className="flex items-center gap-3 p-2 bg-teal-50 border border-teal-200 rounded-xl w-max">
              <img src={newCatImageUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-teal-300" />
              <div className="text-xs">
                <span className="font-bold text-teal-900 block">Зураг оруулагдсан</span>
                <button
                  type="button"
                  onClick={() => setNewCatImageUrl('')}
                  className="text-[10px] text-red-600 underline font-semibold"
                >
                  Зураг арилгах
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 shrink-0"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{selectedParentId ? "Дэд ангилал нэмэх" : "Үндсэн ангилал нэмэх"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Nested Category Tree View */}
      {loading ? (
        <div className="text-center py-10 text-xs text-gray-500 font-bold">Ангилалуудыг уншиж байна...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parentCategories.map((parentCat) => {
            const children = categories.filter((c) => c.parentId === parentCat.id);

            return (
              <div
                key={parentCat.id}
                className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs space-y-3 relative group"
              >
                {/* Parent Header */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-3 gap-3">
                  <div className="flex items-center gap-3">
                    {/* Category Thumbnail Image */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                      {parentCat.imageUrl ? (
                        <img src={parentCat.imageUrl} alt={parentCat.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-teal-50 text-teal-800">
                          <Layers className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-black text-gray-900 text-sm font-sans">{parentCat.name}</h4>
                      <span className="text-[11px] font-mono text-gray-500 block">
                        {children.length} Дэд ангилалтай ({parentCat._count?.products || 0} Бараатай)
                      </span>

                      {/* Upload / Edit Image for existing Category */}
                      <label className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline cursor-pointer mt-1">
                        <Upload className="w-3 h-3" />
                        <span>Зураг солих / Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, parentCat.id);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteCategory(parentCat.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                    title="Ангилал устгах"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Subcategories List */}
                <div className="space-y-1.5 pl-2">
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                    Дэд Ангилууд:
                  </span>
                  {children.length === 0 ? (
                    <div className="text-xs text-gray-400 italic py-1">Дэд ангилал нэмэгдээгүй байна.</div>
                  ) : (
                    children.map((subCat) => (
                      <div
                        key={subCat.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-teal-50/50 border border-gray-200/70 text-xs transition-all"
                      >
                        <div className="flex items-center gap-2">
                          {subCat.imageUrl && (
                            <img src={subCat.imageUrl} alt={subCat.name} className="w-6 h-6 object-cover rounded-md border" />
                          )}
                          <span className="font-bold text-gray-800">{subCat.name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-teal-700 font-bold hover:underline cursor-pointer">
                            Зураг
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, subCat.id);
                              }}
                            />
                          </label>
                          <button
                            onClick={() => handleDeleteCategory(subCat.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Дэд ангилал устгах"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

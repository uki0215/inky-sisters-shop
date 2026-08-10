'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Tag,
  ChevronRight,
  Layers,
  FolderPlus,
  Image as ImageIcon,
  Upload,
  Loader2,
  Check,
  Edit,
  X,
} from 'lucide-react';
import { notifyDataSync } from '@/lib/utils';

interface CategoryManagerProps {
  onCategoryUpdate?: () => void;
}

export default function CategoryManager({ onCategoryUpdate }: CategoryManagerProps) {
  const [categories, setCategories] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('inky_admin_cached_categories');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });
  const [newCatName, setNewCatName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [newCatImageUrl, setNewCatImageUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('inky_admin_cached_categories');
        if (cached && JSON.parse(cached).length > 0) return false;
      } catch (e) {}
    }
    return true;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Category Modal State
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editParentId, setEditParentId] = useState<string>('');
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchCategories = async (silent = false) => {
    if (!silent && categories.length === 0) setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
        try {
          localStorage.setItem('inky_cached_categories', JSON.stringify(data));
          localStorage.setItem('inky_admin_cached_categories', JSON.stringify(data));
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setEditCatName(cat.name || '');
    setEditParentId(cat.parentId || '');
    setEditImageUrl(cat.imageUrl || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;

    const updatedName = editCatName.trim();
    const updatedParentId = editParentId || null;
    const updatedImageUrl = editImageUrl || null;

    setSavingEdit(true);

    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: updatedName,
              parentId: updatedParentId,
              imageUrl: updatedImageUrl,
            }
          : c
      )
    );
    setEditingCategory(null);

    try {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedName,
          parentId: updatedParentId,
          imageUrl: updatedImageUrl,
        }),
      });

      if (res.ok) {
        notifyDataSync();
        if (onCategoryUpdate) onCategoryUpdate();
        fetchCategories(true);
      } else {
        fetchCategories(true);
      }
    } catch (err: any) {
      console.error(err);
      fetchCategories(true);
    } finally {
      setSavingEdit(false);
    }
  };

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
          // Optimistic image update
          setCategories((prev) =>
            prev.map((c) => (c.id === catId ? { ...c, imageUrl: data.url } : c))
          );
          // Update existing category image directly via PATCH API
          await fetch(`/api/categories/${catId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: data.url }),
          });
          notifyDataSync();
          if (onCategoryUpdate) onCategoryUpdate();
          fetchCategories(true);
        } else if (editingCategory) {
          setEditImageUrl(data.url);
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

    const tempId = `temp-${Date.now()}`;
    const newCatObj = {
      id: tempId,
      name: newCatName.trim(),
      parentId: selectedParentId || null,
      imageUrl: newCatImageUrl || null,
      slug: newCatName.toLowerCase().replace(/\s+/g, '-'),
      _count: { products: 0 },
      children: [],
    };

    // Optimistic UI update
    setCategories((prev) => [...prev, newCatObj]);
    setNewCatName('');
    setSelectedParentId('');
    setNewCatImageUrl('');

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatObj.name,
          parentId: newCatObj.parentId,
          imageUrl: newCatObj.imageUrl,
        }),
      });

      if (res.ok) {
        notifyDataSync();
        if (onCategoryUpdate) onCategoryUpdate();
        fetchCategories(true);
      } else {
        fetchCategories(true);
      }
    } catch (e) {
      console.error(e);
      fetchCategories(true);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Энэ ангиллыг (болон түүний дэд ангилуудыг) устгах уу?')) return;

    // Optimistic UI update
    setCategories((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        notifyDataSync();
        if (onCategoryUpdate) onCategoryUpdate();
        fetchCategories(true);
      } else {
        fetchCategories(true);
      }
    } catch (e) {
      console.error(e);
      fetchCategories(true);
    }
  };

  // Separate parent categories (where parentId is null or missing)
  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      {/* Category Creation Form */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4 font-sans">
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 font-sans flex items-center gap-2">
            Дэлгүүрийн Үндсэн ба Дэд Ангилал (Sub-Categories)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            Үндсэн ангилал эсвэл түүний доторх Дэд ангилуудыг нэмж, нэрийг засах, зураг солин удирдах.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
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
                      <h4 className="font-black text-gray-900 text-sm font-sans flex items-center gap-1.5">
                        <span>{parentCat.name}</span>
                      </h4>
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

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(parentCat)}
                      className="p-1.5 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors rounded-lg flex items-center gap-1 text-xs font-bold"
                      title="Ангиллын нэр / төрөл засах"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Засах</span>
                    </button>

                    <button
                      onClick={() => handleDeleteCategory(parentCat.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                      title="Ангилал устгах"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
                          <button
                            onClick={() => openEditModal(subCat)}
                            className="px-2 py-1 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md font-bold text-[11px] flex items-center gap-1 transition-all"
                            title="Дэд ангилал засах"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Засах</span>
                          </button>
                          
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

      {/* Category Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-5 relative">
            <button
              onClick={() => setEditingCategory(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 border border-amber-200">
                <Edit className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Ангилал Засах</h3>
                <p className="text-xs text-gray-500 font-medium">Ангиллын нэр, харьяалал ба зургийг шинэчлэх</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Ангиллын Нэр *
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Эцэг Ангилал (Төрөл):
                </label>
                <select
                  value={editParentId}
                  onChange={(e) => setEditParentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">📁 Үндсэн Ангилал болгох</option>
                  {categories
                    .filter((c) => !c.parentId && c.id !== editingCategory.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        ↳ Дэд ангилал болгох: {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Ангиллын Зураг:
                </label>
                <div className="space-y-2">
                  {editImageUrl && (
                    <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                      <img src={editImageUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-gray-300" />
                      <button
                        type="button"
                        onClick={() => setEditImageUrl('')}
                        className="text-xs text-red-600 hover:underline font-bold"
                      >
                        Зураг арилгах
                      </button>
                    </div>
                  )}

                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl text-xs font-extrabold text-gray-700 cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-teal-700" />
                    <span>{uploadingImage ? 'Хуулж байна...' : 'Шинэ Зураг Хуулж Сонгох'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('file', file);
                          setUploadingImage(true);
                          try {
                            const res = await fetch('/api/upload', { method: 'POST', body: formData });
                            const data = await res.json();
                            if (data.url) setEditImageUrl(data.url);
                          } catch (err) {
                            alert('Зураг хуулахад алдаа гарлаа');
                          } finally {
                            setUploadingImage(false);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
                >
                  Цуцлах
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingEdit ? 'Хадгалж байна...' : 'Шинэчлэн Хадгалах'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

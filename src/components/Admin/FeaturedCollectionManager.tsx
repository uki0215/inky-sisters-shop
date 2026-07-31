'use client';

import React, { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import { Plus, Trash2, Edit2, Sparkles, RefreshCw, CheckCircle2, X } from 'lucide-react';

interface FeaturedCollectionManagerProps {
  categories: any[];
  products: any[];
}

export default function FeaturedCollectionManager({
  categories,
  products,
}: FeaturedCollectionManagerProps) {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkCategory, setLinkCategory] = useState('');
  const [productId, setProductId] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/featured-collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setLinkCategory('');
    setProductId('');
    setOrderIndex(0);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title);
    setSubtitle(item.subtitle || '');
    setImageUrl(item.imageUrl);
    setLinkCategory(item.linkCategory || '');
    setProductId(item.productId || '');
    setOrderIndex(item.orderIndex || 0);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Энэ онцлох цуглуулгыг устгах уу?')) return;
    try {
      const res = await fetch(`/api/featured-collections/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCollections();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      alert('Гарчиг болон зургийн URL шаардлагатай!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        subtitle,
        imageUrl,
        linkCategory: linkCategory || null,
        productId: productId || null,
        orderIndex: Number(orderIndex),
        active: true,
      };

      const url = editingId ? `/api/featured-collections/${editingId}` : '/api/featured-collections';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Хадгалахад алдаа гарлаа');

      fetchCollections();
      handleResetForm();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 font-sans flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            "Онцлох Цуглуулга" Удирдах
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            Нүүр хуудсан дээр харагдах онцлох цуглуулгын кардуудыг нэмэх, засах, устгах
          </p>
        </div>
      </div>

      {/* Add / Edit Form */}
      <form onSubmit={handleSubmit} className="p-5 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-gray-900 font-sans">
          {editingId ? '✏️ Цуглуулга Засах' : '➕ Шинэ Онцлох Цуглуулга Нэмэх'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Цуглуулгын Нэр / Гарчиг *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Эстэтик Пастел Үзэгнүүд"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-sans focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Дэд Гарчиг / Тайлбар</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Солонгосын хамгийн сүүлийн үеийн пастел цуглуулга"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-sans focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Image Uploader */}
        <div>
          <label className="font-bold text-gray-700 block mb-1 text-xs">Цуглуулгын Зураг *</label>
          <ImageUploader
            value={imageUrl}
            onChange={(url) => setImageUrl(url)}
          />
        </div>

        {/* Category & Product Link Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Холбох Ангилал (Category Filter)</label>
            <select
              value={linkCategory}
              onChange={(e) => {
                setLinkCategory(e.target.value);
                setProductId(''); // Reset product when category changes
              }}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-sans focus:ring-2 focus:ring-teal-500 font-bold text-teal-900"
            >
              <option value="">-- Холбохгүй / Бүх ангилал --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name} ({cat.slug})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">
              Холбох Тодорхой Бараа {linkCategory ? '(Сонгосон ангиллаар шүүгдсэн)' : '(Сонголттой)'}
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-sans focus:ring-2 focus:ring-teal-500 font-bold text-gray-900"
            >
              <option value="">-- Сонгохгүй --</option>
              {(() => {
                const selectedCatObj = categories.find((c) => c.slug === linkCategory || c.id === linkCategory);
                const filteredProds = linkCategory
                  ? products.filter((p) => {
                      if (!selectedCatObj) {
                        return p.category?.slug === linkCategory || p.categoryId === linkCategory;
                      }
                      const childIds = categories.filter((sub) => sub.parentId === selectedCatObj.id).map((sub) => sub.id);
                      return (
                        p.categoryId === selectedCatObj.id ||
                        p.category?.id === selectedCatObj.id ||
                        childIds.includes(p.categoryId) ||
                        childIds.includes(p.category?.id)
                      );
                    })
                  : products;

                return filteredProds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.barcode}) - {p.priceMnt.toLocaleString()}₮
                  </option>
                ));
              })()}
            </select>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Дараалал (Order Index)</label>
            <input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(Number(e.target.value))}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-sans focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {editingId && (
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl"
            >
              Цуцлах
            </button>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>{editingId ? 'Шинэчлэх' : 'Нэмэх'}</span>
          </button>
        </div>
      </form>

      {/* List of Existing Featured Collections */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-gray-900 font-sans">
          Нийт Үүсгэсэн Онцлох Цуглуулгууд ({collections.length})
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400">Ачаалж байна...</div>
        ) : collections.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-xs text-gray-400">
            Одоогоор онцлох цуглуулга бүртгэгдээгүй байна. Дээрх маягтаар шинээр үүсгэнэ үү.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-[10px] font-mono rounded-lg backdrop-blur-xs">
                    #Order {item.orderIndex}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm font-sans">{item.title}</h4>
                    {item.subtitle && <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>}
                    {item.linkCategory && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold rounded-md">
                        Category: {item.linkCategory}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 text-xs font-bold flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Засах
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Устгах
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

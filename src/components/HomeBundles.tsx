'use client';

import React, { useState, useEffect } from 'react';
import { Gift, ShoppingBag, Eye, ArrowRight, Layers, Sparkles, Check } from 'lucide-react';
import { formatMNT } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import BundleModal from '@/components/BundleModal';

interface HomeBundlesProps {
  onViewAll?: () => void;
}

export default function HomeBundles({ onViewAll }: HomeBundlesProps) {
  const [bundles, setBundles] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBundle, setSelectedBundle] = useState<any | null>(null);
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);
  const { addBundleToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resBundles, resSettings] = await Promise.all([
          fetch('/api/bundles?activeOnly=true'),
          fetch('/api/settings'),
        ]);
        if (resBundles.ok) {
          const data = await resBundles.json();
          if (Array.isArray(data)) setBundles(data);
        }
        if (resSettings.ok) {
          const dataSet = await resSettings.json();
          setSettings(dataSet);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddBundle = (bundle: any, e: React.MouseEvent) => {
    e.stopPropagation();
    addBundleToCart(bundle, 1);
    setAddedBundleId(bundle.id);
    setTimeout(() => setAddedBundleId(null), 2500);
  };

  if (loading || bundles.length === 0) return null;

  const sectionBadgeText = settings?.bundleSectionBadge || 'Хямдралтай Багц Сетүүд';
  const sectionTitleText = (settings?.bundleSectionTitle || 'ОНЦЛОХ ИЖ БҮРЭН БАГЦУУД').replace(/^🎁\s*/, '');

  return (
    <>
      <section className="w-full bg-gradient-to-r from-teal-50/90 via-slate-50/80 to-rose-50/90 py-12 my-8 border-y border-teal-100 relative overflow-hidden shadow-xs">
      {/* Background glowing soft ambient highlights */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-rose-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-rose-600 uppercase tracking-wider mb-1">
              <span>{sectionBadgeText}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase tracking-tight font-sans">
              {sectionTitleText}
            </h2>
          </div>

          {onViewAll ? (
            <button
              onClick={onViewAll}
              className="text-xs font-extrabold text-teal-800 hover:text-white bg-teal-100/90 hover:bg-teal-700 border border-teal-200/80 px-4 py-2 rounded-full self-start sm:self-auto font-sans shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>Бүгдийг үзэх</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-xs font-extrabold text-teal-800 bg-teal-100/90 border border-teal-200/80 px-4 py-2 rounded-full self-start sm:self-auto font-mono shadow-2xs">
              Бүгдийг үзэх
            </span>
          )}
        </div>

        {/* Bundles Grid (Only 3 bundles displayed on homepage) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.slice(0, 3).map((bundle) => {
            const isAdded = addedBundleId === bundle.id;

            return (
              <div
                key={bundle.id}
                onClick={() => setSelectedBundle(bundle)}
                className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer hover:border-teal-300 relative"
              >
                {/* Image & Discount Badge */}
                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                  <img
                    src={bundle.imageUrl || 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=600&auto=format&fit=crop&q=80'}
                    alt={bundle.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-3 py-1 bg-cherry-600 text-white text-xs font-black rounded-full font-mono shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                      -{bundle.discountPercent}% ХЯМДРАЛ
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-teal-400" />
                    <span>{bundle.items?.length || 0} Барааны Иж бүрдэл</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base group-hover:text-teal-800 transition-colors font-sans line-clamp-1">
                      {bundle.name}
                    </h3>

                    {bundle.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{bundle.description}</p>
                    )}
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-gray-500 font-bold block mb-0.5 font-sans">Нийт дүн:</span>
                      <div className="flex items-baseline gap-2 font-mono">
                        <span className="text-lg font-black text-red-600 leading-none">
                          {formatMNT(bundle.bundlePriceMnt)}
                        </span>
                        {bundle.originalPriceMnt > bundle.bundlePriceMnt && (
                          <span className="text-xs font-bold text-gray-400 line-through">
                            {formatMNT(bundle.originalPriceMnt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBundle(bundle);
                        }}
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-bold text-xs flex items-center gap-1"
                        title="Багцын бараануудыг дэлгэрэнгүй харах"
                      >
                        <Eye className="w-4 h-4 text-teal-700" />
                      </button>

                      <button
                        onClick={(e) => handleAddBundle(bundle, e)}
                        disabled={isAdded}
                        className={`px-4 py-2.5 rounded-xl font-extrabold text-xs text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${isAdded ? 'bg-emerald-600' : 'bg-teal-700 hover:bg-teal-800'
                          }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Нэмэгдлээ</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            <span>Сагслах</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {/* Bundle Modal rendered OUTSIDE the overflow-hidden section */}
    {selectedBundle && (
      <BundleModal
        bundle={selectedBundle}
        onClose={() => setSelectedBundle(null)}
      />
    )}
  </>
  );
}

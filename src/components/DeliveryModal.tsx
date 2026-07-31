'use client';

import React from 'react';
import { X, MapPin, Truck, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeliveryModal({ isOpen, onClose }: DeliveryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Хүргэлтийн Нөхцөл &amp; Бүс</span>
                <span className="text-[10px] font-mono bg-cherry-500/30 text-cherry-300 border border-cherry-400/40 px-2 py-0.5 rounded-full font-bold">
                  2026 он
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Улаанбаатар хот доторх хүргэлтийн бүсчлэл ба захиалгын мөрдөх журам
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* 1. VISUAL RED MAP GRAPHIC (Matching the user's uploaded image exact layout) */}
          <div className="bg-[#d2042d] text-white rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 relative overflow-hidden">
            
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <h4 className="text-xl sm:text-2xl font-black tracking-tight uppercase font-sans flex items-center gap-2">
                <span>ХҮРГЭЛТИЙН БҮС:</span>
              </h4>
              <span className="text-[11px] font-mono bg-black/20 text-white px-3 py-1 rounded-full border border-white/20 uppercase tracking-widest font-extrabold">
                Ulaanbaatar Delivery Map
              </span>
            </div>

            {/* Stylized UB Map Graphic Representation */}
            <div className="relative bg-[#e4ecf0] rounded-2xl p-4 sm:p-6 border-4 border-white/20 shadow-inner text-slate-900 overflow-hidden min-h-[320px] flex flex-col justify-between">
              
              {/* Map Canvas Visual Outlines & River */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="absolute inset-x-0 top-1/2 h-8 bg-sky-400/30 -rotate-2 transform blur-xs pointer-events-none" />

              {/* Map Pin Locations Overlay Grid */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                
                {/* North Pins */}
                <div className="space-y-2 bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-gray-200 shadow-xs">
                  <span className="text-[10px] font-black font-mono uppercase text-red-600 block border-b border-gray-200 pb-1">
                    ▲ ХОЙД БҮС
                  </span>
                  <ul className="space-y-1.5 font-extrabold text-[11px] text-gray-900">
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> ХАЙЛААСТЫН УУЛЗВАР</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> ХОРООЛЛЫН ЭЦЭС</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> ӨНӨР ХОРООЛОЛ</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> ДАРЬ-ЭХ, ГАНЦ ХУДАГ</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> 100 АЙЛ, ГАНДАН</li>
                  </ul>
                </div>

                {/* West Pins */}
                <div className="space-y-2 bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-gray-200 shadow-xs">
                  <span className="text-[10px] font-black font-mono uppercase text-red-600 block border-b border-gray-200 pb-1">
                    ◄ БАРУУН БҮС
                  </span>
                  <ul className="space-y-1.5 font-extrabold text-[11px] text-gray-900">
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> ШИНЭ ДРАГОН</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> БУЯНТ-УХАА 1</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> БУЯНТ-УХАА 2</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> ЯАРМАГ</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> ДРАГОН ТӨВ</li>
                  </ul>
                </div>

                {/* East Pins */}
                <div className="space-y-2 bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-gray-200 shadow-xs">
                  <span className="text-[10px] font-black font-mono uppercase text-red-600 block border-b border-gray-200 pb-1">
                    ► ЗҮҮН БҮС
                  </span>
                  <ul className="space-y-1.5 font-extrabold text-[11px] text-gray-900">
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> 16-Р ХОРООЛОЛ</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> УЛААНХУАРАН</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> АМГАЛАН ӨРТӨӨ</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> САНСАРЫН ТОЙРОГ</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> ДҮНЖИНГАРАВ ТӨВ</li>
                  </ul>
                </div>

                {/* South Pins */}
                <div className="space-y-2 bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-gray-200 shadow-xs">
                  <span className="text-[10px] font-black font-mono uppercase text-red-600 block border-b border-gray-200 pb-1">
                    ▼ УРД БҮС
                  </span>
                  <ul className="space-y-1.5 font-extrabold text-[11px] text-gray-900">
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> МАРШАЛЫН ГҮҮР</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> БАГА ТЭНГЭР</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> ЗАЙСАН</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> БОГД ХАН АМРАЛТ</li>
                    <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" /> МИШЭЭЛ ЭКСПО</li>
                  </ul>
                </div>

              </div>
            </div>

            {/* 4-Directional Summary Bottom Grid (Matching the image exact text layout) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-sans border-t border-white/20 pt-4">
              
              <div className="space-y-1">
                <span className="text-xs font-black uppercase text-amber-300 block">БАРУУН</span>
                <p className="text-xs font-extrabold leading-tight text-white">
                  ШИНЭ ДРАГОН<br />
                  БУЯНТ–УХАА 1<br />
                  БУЯНТ–УХАА 2
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black uppercase text-amber-300 block">ХОЙД</span>
                <p className="text-xs font-extrabold leading-tight text-white">
                  ӨНӨР ХОРООЛОЛ<br />
                  ХОРООЛЛЫН ЭЦЭС<br />
                  ХАЙЛААСТЫН УУЛЗВАР<br />
                  ДАРЬ–ЭХ, ГАНЦ ХУДАГ
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black uppercase text-amber-300 block">ЗҮҮН</span>
                <p className="text-xs font-extrabold leading-tight text-white">
                  16–Р ХОРООЛОЛ<br />
                  УЛААНХУАРАН<br />
                  АМГАЛАН ӨРТӨӨ
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black uppercase text-amber-300 block">УРД</span>
                <p className="text-xs font-extrabold leading-tight text-white">
                  МАРШАЛЫН ГҮҮР<br />
                  БАГА ТЭНГЭР<br />
                  ЗАЙСАН<br />
                  БОГД ХАН АМРАЛТ
                </p>
              </div>

            </div>

          </div>

          {/* 2. DELIVERY PRICING & TIME RULES CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Free Delivery Card */}
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-emerald-900 font-extrabold text-xs uppercase font-mono">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Захиалгын Дүн ба Үнэ
                </span>
                <span className="bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full text-[10px]">
                  Үнэгүй хүргэлт
                </span>
              </div>
              <div className="text-xl font-black text-emerald-950 font-sans">
                50.000₮-өөс дээш ➔ ХҮРГЭЛТ ҮНЭГҮЙ
              </div>
              <p className="text-xs text-emerald-800">
                50,000 төгрөгөөс дээш дүнтэй бүх захиалга дээрх бүсчлэл дотор хүргэлтийн төлбөргүй шууд хүргэгдэнэ.
              </p>
            </div>

            {/* Delivery Time & Rules Card */}
            <div className="p-5 bg-teal-50 border border-teal-200 rounded-3xl space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-teal-900 font-extrabold text-xs uppercase font-mono">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-700" />
                  Хүргэлтийн Цагийн Хуваарь
                </span>
                <span className="bg-teal-200 text-teal-950 px-2 py-0.5 rounded-full text-[10px]">
                  16:00 Цаг
                </span>
              </div>
              <div className="text-xs font-bold text-teal-950 space-y-1.5 font-sans">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                  <p>
                    Тухайн өдрийн <span className="font-extrabold text-teal-900">16:00 цагаас өмнө</span> орж ирсэн захиалга 24 цагт багтан хүргэгдэнэ.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                  <p>
                    <span className="font-extrabold text-teal-900">16:00 цагаас хойш</span> баталгаажсан захиалга дараагийн өдрийн хүргэлтэд шилжинэ.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* 3. ADDITIONAL RULES BULLETINS */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-sans space-y-2">
            <h5 className="font-extrabold text-gray-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              Хүргэлтийн Нэмэлт Тэмдэглэл
            </h5>
            <ul className="space-y-1 text-gray-600 font-semibold">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                Нэг захиалгад харгалзах нэг л хүргэлтийн хаягийг хүлээн авна.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                Хүргэлт очих үед хаягтаа байх болон утасныхаа холбогдох боломжийг хангана уу.
              </li>
            </ul>
          </div>

        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500 font-sans">
            Inky Sisters Online Shop — Хүргэлтийн алба
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
          >
            Ойлголоо, Хаах
          </button>
        </div>

      </div>
    </div>
  );
}

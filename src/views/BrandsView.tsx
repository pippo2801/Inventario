import React from 'react';
import { db } from '../services/db';
import { Building2, Package, Sparkles, ArrowRight } from 'lucide-react';

interface BrandsViewProps {
  onSelectBrand: (brandName: string) => void;
  onNavigate: (view: string) => void;
}

export const BrandsView: React.FC<BrandsViewProps> = ({
  onSelectBrand,
  onNavigate,
}) => {
  const eyeglasses = db.getEyeglasses(false).filter((e) => e.status === 'Disponibile');

  // Aggregate by brand
  const brandMap = new Map<string, { count: number; totalVal: number; showcaseCount: number; sampleImage: string }>();

  eyeglasses.forEach((e) => {
    const current = brandMap.get(e.brand) || { count: 0, totalVal: 0, showcaseCount: 0, sampleImage: e.imageUrl };
    current.count += 1;
    current.totalVal += (e.isPromo && e.promoPrice ? e.promoPrice : e.salePrice);
    if (e.isShowcase) current.showcaseCount += 1;
    brandMap.set(e.brand, current);
  });

  const brands = Array.from(brandMap.entries()).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-teal-900/40 border border-teal-800/40 shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Brand & Marchi Trattati
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-teal-300/80">
            Catalogo suddiviso per marchi con conteggio pezzi e consistenza economica dello stock
          </p>
        </div>

        <div className="text-xs bg-slate-950/60 px-4 py-2 rounded-xl border border-teal-700/40">
          <span className="text-[10px] text-slate-400 block">Marchi Attivi:</span>
          <span className="text-lg font-extrabold text-teal-300">{brands.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {brands.map(([brandName, stats]) => (
          <div
            key={brandName}
            onClick={() => onSelectBrand(brandName)}
            className="p-4 rounded-2xl bg-slate-900/90 border border-teal-900/60 hover:border-teal-500/60 transition-all cursor-pointer shadow-md flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <img
                src={stats.sampleImage}
                alt=""
                className="w-14 h-14 object-cover rounded-xl bg-slate-950 border border-slate-800 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider group-hover:text-teal-300 transition-colors">
                  {brandName}
                </h3>
                <p className="text-xs text-slate-300 font-medium">{stats.count} {stats.count === 1 ? 'Modello' : 'Modelli'} disponibili</p>
                <div className="flex items-center gap-2 text-[11px] text-teal-400 mt-1">
                  <span>Valore: €{stats.totalVal.toFixed(2)}</span>
                  {stats.showcaseCount > 0 && (
                    <span className="text-amber-400 flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3" /> {stats.showcaseCount} vetrina
                    </span>
                  )}
                </div>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
          </div>
        ))}
      </div>
    </div>
  );
};

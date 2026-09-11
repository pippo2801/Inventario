import React from 'react';
import { db } from '../services/db';
import { Eyeglass } from '../types';
import { Tag, Sparkles, Clock, ShoppingBag, CheckCircle2, ArrowRight } from 'lucide-react';

interface PromotionsViewProps {
  onSelectEyeglass: (eyeglass: Eyeglass) => void;
  onOpenFastSale: (eyeglass: Eyeglass) => void;
  onNavigate: (view: string) => void;
}

export const PromotionsView: React.FC<PromotionsViewProps> = ({
  onSelectEyeglass,
  onOpenFastSale,
  onNavigate,
}) => {
  const promoItems = db.getEyeglasses(false).filter((e) => e.isPromo && e.status === 'Disponibile');
  const stagnantItems = db.getStagnantStock(6).filter((e) => !e.isPromo && e.status === 'Disponibile');

  const handleActivateSuggestedPromo = (item: Eyeglass, discountPercent: number) => {
    const discounted = Math.round(item.salePrice * (1 - discountPercent / 100));
    db.updateEyeglass(item.id, {
      isPromo: true,
      promoPrice: discounted,
    });
  };

  const handleRemovePromo = (item: Eyeglass) => {
    db.updateEyeglass(item.id, {
      isPromo: false,
      promoPrice: undefined,
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-teal-950/40 border border-rose-800/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-rose-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              🏷️ Promozioni & Offerte Attive
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-rose-200/80">
            Monitoraggio sconti in corso e suggerimenti IA su stock a bassa rotazione (Sezione 21)
          </p>
        </div>

        <div className="text-xs bg-slate-950/60 px-4 py-2 rounded-xl border border-rose-700/40 self-start sm:self-auto">
          <span className="text-[10px] text-slate-400 block">Articoli in Sconto:</span>
          <span className="text-lg font-extrabold text-rose-300">{promoItems.length} Modelli</span>
        </div>
      </div>

      {/* Section: Stagnant Stock AI Recommendations (Section 21) */}
      {stagnantItems.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-800/50 space-y-3">
          <div className="flex items-center gap-2 text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold">
              Suggerimenti IA per Stock Fermo ({stagnantItems.length} occhiali da &gt; 6 mesi)
            </h3>
          </div>
          <p className="text-xs text-amber-200/80">
            Questi articoli sono in magazzino da tempo e presentano bassa rotazione. L'IA consiglia l'attivazione di uno sconto per favorirne il deflusso rapido.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {stagnantItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-amber-900/50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-12 h-12 object-cover rounded-lg bg-slate-950"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="font-bold text-white uppercase">{item.brand} {item.model}</p>
                    <p className="text-[10px] text-slate-400">Prezzo attuale: €{item.salePrice.toFixed(2)} - Stock dal {new Date(item.stockDate).toLocaleDateString()}</p>
                    <p className="text-[10px] text-amber-300 mt-0.5">Sconto suggerito: -20% (€{(item.salePrice * 0.8).toFixed(2)})</p>
                  </div>
                </div>

                <button
                  onClick={() => handleActivateSuggestedPromo(item, 20)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex-shrink-0 transition-colors"
                >
                  Attiva Sconto -20%
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Promos List */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">Offerte attualmente visibili ai clienti:</h3>
        {promoItems.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
            Nessuna promozione attualmente attiva.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {promoItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectEyeglass(item)}
                className="rounded-2xl bg-slate-900/90 border border-rose-900/50 hover:border-rose-500/60 transition-all p-4 flex flex-col justify-between cursor-pointer shadow-md"
              >
                <div>
                  <div className="relative mb-3 aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img
                      src={item.imageUrl}
                      alt={item.model}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow">
                      🏷️ PROMO
                    </span>
                  </div>

                  <span className="text-xs font-extrabold text-teal-400 uppercase tracking-wider">
                    {item.brand}
                  </span>
                  <h3 className="text-sm font-bold text-white">{item.model}</h3>
                  <p className="text-xs text-slate-300">{item.color}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-base font-extrabold text-rose-400">
                      €{item.promoPrice?.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 line-through ml-1.5">
                      €{item.salePrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePromo(item);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                    >
                      Termina Promo
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFastSale(item);
                      }}
                      className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1"
                    >
                      <ShoppingBag className="w-3 h-3" /> Vendi
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
};

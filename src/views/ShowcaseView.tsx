import React from 'react';
import { db } from '../services/db';
import { Eyeglass } from '../types';
import { Sparkles, MapPin, ShoppingBag, Plus, X } from 'lucide-react';

interface ShowcaseViewProps {
  onSelectEyeglass: (eyeglass: Eyeglass) => void;
  onOpenFastSale: (eyeglass: Eyeglass) => void;
  onNavigate: (view: string) => void;
}

export const ShowcaseView: React.FC<ShowcaseViewProps> = ({
  onSelectEyeglass,
  onOpenFastSale,
  onNavigate,
}) => {
  const showcaseItems = db.getEyeglasses(false).filter((e) => e.isShowcase && e.status === 'Disponibile');

  const totalRetail = showcaseItems.reduce(
    (acc, e) => acc + (e.isPromo && e.promoPrice ? e.promoPrice : e.salePrice),
    0
  );

  const handleRemoveFromShowcase = (e: React.MouseEvent, item: Eyeglass) => {
    e.stopPropagation();
    db.updateEyeglass(item.id, { isShowcase: false, showcasePosition: undefined });
  };

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-teal-950/40 border border-amber-800/40 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              ✨ Gestione Vetrina Negozio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-amber-200/80">
            Controllo degli occhiali attualmente esposti nella vetrina principale e secondaria dello studio
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs bg-slate-950/60 px-4 py-2.5 rounded-xl border border-amber-700/40 self-start sm:self-auto">
          <div>
            <span className="text-[10px] text-slate-400 block">Occhiali Esposti:</span>
            <span className="text-lg font-extrabold text-amber-300">{showcaseItems.length} Pezzi</span>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-[10px] text-slate-400 block">Valore Esposto Totale:</span>
            <span className="text-lg font-extrabold text-emerald-400">€{totalRetail.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {showcaseItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-teal-900/40 text-slate-400 space-y-3">
          <p className="text-base font-semibold text-slate-200">Nessun occhiale attualmente contrassegnato in vetrina.</p>
          <p className="text-xs">Vai all'inventario per selezionare gli occhiali da posizionare in vetrina.</p>
          <button
            onClick={() => onNavigate('inventory')}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold"
          >
            Apri Inventario
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {showcaseItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectEyeglass(item)}
              className="rounded-2xl bg-slate-900/90 border border-amber-900/50 hover:border-amber-500/60 transition-all p-4 flex flex-col justify-between cursor-pointer shadow-md group"
            >
              <div>
                <div className="relative mb-3 aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img
                    src={item.imageUrl}
                    alt={item.model}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow">
                    ✨ IN VETRINA
                  </span>
                  <button
                    title="Rimuovi dalla vetrina"
                    onClick={(e) => handleRemoveFromShowcase(e, item)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-xs font-extrabold text-teal-400 uppercase tracking-wider">
                  {item.brand}
                </span>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
                  {item.model}
                </h3>
                <p className="text-xs text-slate-300">{item.color}</p>

                <div className="flex items-center gap-1 text-xs text-amber-300 pt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="truncate font-medium">{item.showcasePosition || item.location}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-base font-extrabold text-emerald-400">
                  €{(item.isPromo && item.promoPrice ? item.promoPrice : item.salePrice).toFixed(2)}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFastSale(item);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1 transition-all active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Vendi Subito</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

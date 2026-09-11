import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { StudioLogo } from '../components/StudioLogo';
import { Eyeglass } from '../types';
import {
  Search,
  Sparkles,
  Package,
  Tag,
  ShoppingBag,
  Users,
  FolderArchive,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  PlusCircle,
  Eye,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface HomeViewProps {
  onOpenSearch: () => void;
  onNavigate: (view: string, id?: string) => void;
  onSelectEyeglass: (eyeglass: Eyeglass) => void;
  onOpenFastSale: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenSearch,
  onNavigate,
  onSelectEyeglass,
  onOpenFastSale,
}) => {
  const currentUser = db.getCurrentUser();
  const eyeglasses = db.getEyeglasses(false);
  const sales = db.getSales(false);
  const prescriptions = db.getPrescriptions(false);
  const clients = db.getClients(false);
  const stagnantItems = db.getStagnantStock(6);
  const auditLogs = db.getAuditLogs().slice(0, 5);

  const availableCount = eyeglasses.filter((e) => e.status === 'Disponibile').length;
  const showcaseItems = eyeglasses.filter((e) => e.isShowcase && e.status === 'Disponibile');
  const promoItems = eyeglasses.filter((e) => e.isPromo && e.status === 'Disponibile');
  const pendingCount = prescriptions.filter((p) => p.status === 'DA_VERIFICARE').length +
    clients.filter((c) => !c.isComplete).length;

  const totalRetailValue = eyeglasses
    .filter((e) => e.status === 'Disponibile')
    .reduce((acc, e) => acc + (e.isPromo && e.promoPrice ? e.promoPrice : e.salePrice), 0);

  const showcaseRetailValue = showcaseItems.reduce(
    (acc, e) => acc + (e.isPromo && e.promoPrice ? e.promoPrice : e.salePrice),
    0
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner / Identity Section (Section 8 & 9) */}
      <div className="relative rounded-2xl bg-gradient-to-br from-teal-950 via-teal-900/90 to-slate-950 p-5 sm:p-7 border border-teal-700/40 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <StudioLogo size="lg" light={true} />
            <p className="text-xs sm:text-sm text-teal-200/90 max-w-xl leading-relaxed pt-1">
              Benvenuto, <b>{currentUser.name}</b> ({currentUser.role}). Terminale attivo:{' '}
              <span className="font-mono text-teal-300">{currentUser.deviceName}</span>.
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-home-fast-sale"
              onClick={onOpenFastSale}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-teal-950/50 flex items-center gap-2 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>🛒 Vendita Rapida</span>
            </button>
            <button
              id="btn-home-add-product"
              onClick={() => onNavigate('add-product')}
              className="px-3.5 py-2.5 rounded-xl bg-teal-800/80 hover:bg-teal-700 border border-teal-600/50 text-teal-100 font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-teal-300" />
              <span>+ Nuovo Occhiale</span>
            </button>
          </div>
        </div>

        {/* Big Search Bar Trigger (Section 10: "Cosa stai cercando?") */}
        <div className="mt-6">
          <button
            id="btn-home-universal-search"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-teal-600/50 text-left shadow-xl group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-800/60 text-teal-300 group-hover:bg-teal-700/70 transition-colors">
                <Search className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <span className="text-sm sm:text-base font-semibold text-white group-hover:text-teal-200 transition-colors block">
                  Cosa stai cercando?
                </span>
                <span className="text-xs text-teal-400/80 hidden sm:block">
                  Cerca con linguaggio naturale, fotocamera, video o barcode
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-950 text-[11px] font-semibold text-teal-300 border border-teal-800">
                <Sparkles className="w-3 h-3 text-teal-400" /> IA Attiva
              </span>
              <div className="p-2 rounded-lg bg-teal-900/60 text-teal-300 group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Stagnant Stock / Alert Notification Banner (Section 21 & 35) */}
      {stagnantItems.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">
                Segnalazione Stock Fermo ({stagnantItems.length} occhiali presenti da oltre 6 o 12 mesi)
              </p>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                L'IA ha individuato modelli a bassa rotazione (es. <b>{stagnantItems[0].brand} {stagnantItems[0].model}</b>). Puoi valutare una promozione.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('promotions')}
            className="px-3 py-1.5 rounded-lg bg-amber-800/60 hover:bg-amber-700/80 text-white font-medium text-xs flex-shrink-0 transition-colors"
          >
            Vedi Suggerimenti
          </button>
        </div>
      )}

      {/* Customizable KPI Widgets Grid (Section 35) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Widget 1: Inventario */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-teal-900/60 hover:border-teal-600/60 cursor-pointer shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Disponibili</span>
            <Package className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {availableCount}
            </p>
            <p className="text-[11px] text-teal-400/90 mt-0.5 font-medium">
              Valore listino: €{totalRetailValue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Widget 2: Vetrina */}
        <div
          onClick={() => onNavigate('showcase')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-teal-900/60 hover:border-amber-500/60 cursor-pointer shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>In Vetrina</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {showcaseItems.length}
            </p>
            <p className="text-[11px] text-amber-400/90 mt-0.5 font-medium">
              Valore esposto: €{showcaseRetailValue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Widget 3: Promo */}
        <div
          onClick={() => onNavigate('promotions')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-teal-900/60 hover:border-rose-500/60 cursor-pointer shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>In Promozione</span>
            <Tag className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {promoItems.length}
            </p>
            <p className="text-[11px] text-rose-400/90 mt-0.5 font-medium">
              Offerte e sconti attivi
            </p>
          </div>
        </div>

        {/* Widget 4: Da verificare */}
        <div
          onClick={() => onNavigate('pending')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-teal-900/60 hover:border-orange-500/60 cursor-pointer shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Da Verificare</span>
            <AlertCircle className={`w-4 h-4 ${pendingCount > 0 ? 'text-orange-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {pendingCount}
            </p>
            <p className="text-[11px] text-orange-400/90 mt-0.5 font-medium">
              {pendingCount === 0 ? 'Tutti i dati completi' : 'Prescrizioni / profili in attesa'}
            </p>
          </div>
        </div>
      </div>

      {/* Featured Showcase Preview & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: In Vetrina Highlights */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/70 border border-teal-800/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                ✨ Esposti in Vetrina ({showcaseItems.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('showcase')}
              className="text-xs text-teal-400 hover:underline flex items-center gap-1"
            >
              Gestisci Vetrina <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {showcaseItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectEyeglass(item)}
                className="p-3 rounded-xl bg-slate-950/60 border border-teal-900/50 hover:border-teal-500/50 cursor-pointer transition-all flex gap-3 group"
              >
                <img
                  src={item.imageUrl}
                  alt={item.model}
                  className="w-16 h-16 object-cover rounded-lg bg-slate-900 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">{item.brand}</span>
                    <p className="text-xs font-semibold text-white truncate">{item.model}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.showcasePosition || item.location}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-emerald-400">€{item.salePrice.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-teal-300 transition-colors">Dettagli →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Real-time Multi-Device Activity Log (Section 32) */}
        <div className="rounded-2xl bg-slate-900/70 border border-teal-800/40 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Attività Recenti</h3>
              </div>
              <span className="text-[10px] text-teal-400 font-mono">Sync Attivo</span>
            </div>

            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-teal-600/60 pl-2.5 py-0.5">
                  <p className="font-semibold text-slate-200 line-clamp-1">{log.details}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>{log.operator}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => onNavigate('statistics')}
              className="w-full py-2 rounded-xl bg-teal-900/40 hover:bg-teal-800/50 text-teal-300 text-xs font-semibold text-center transition-colors"
            >
              Visualizza Tutte le Statistiche e Totali →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

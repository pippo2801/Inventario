import React from 'react';
import { db } from '../services/db';
import { StudioLogo } from '../components/StudioLogo';
import { SyncStatusBar } from '../components/SyncStatusBar';
import { Eyeglass } from '../types';
import {
  Search,
  Sparkles,
  Package,
  Tag,
  ShoppingBag,
  AlertCircle,
  Clock,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';

interface HomeViewProps {
  onOpenSearch: () => void;
  onNavigate: (view: string, id?: string) => void;
  onSelectEyeglass: (eyeglass: Eyeglass) => void;
  onOpenFastSale: () => void;
}

const formatEuro = (value: number) =>
  value.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenSearch,
  onNavigate,
  onSelectEyeglass,
  onOpenFastSale,
}) => {
  const currentUser = db.getCurrentUser();
  const eyeglasses = db.getEyeglasses(false);
  const prescriptions = db.getPrescriptions(false);
  const clients = db.getClients(false);
  const stagnantItems = db.getStagnantStock(6);
  const auditLogs = db.getAuditLogs().slice(0, 5);

  const availableCount = eyeglasses.filter(
    (e) => e.status === 'Disponibile'
  ).length;

  const showcaseItems = eyeglasses.filter(
    (e) => e.isShowcase && e.status === 'Disponibile'
  );

  const promoItems = eyeglasses.filter(
    (e) => e.isPromo && e.status === 'Disponibile'
  );

  const pendingCount =
    prescriptions.filter((p) => p.status === 'DA_VERIFICARE').length +
    clients.filter((c) => !c.isComplete).length;

  const totalRetailValue = eyeglasses
    .filter((e) => e.status === 'Disponibile')
    .reduce(
      (acc, e) =>
        acc + (e.isPromo && e.promoPrice ? e.promoPrice : e.salePrice),
      0
    );

  const showcaseRetailValue = showcaseItems.reduce(
    (acc, e) =>
      acc + (e.isPromo && e.promoPrice ? e.promoPrice : e.salePrice),
    0
  );

  return (
    <div className="min-h-full pb-12 space-y-5 sm:space-y-6 animate-in fade-in duration-300">

      {/* ───────────────── HERO ───────────────── */}
      <section className="relative overflow-hidden rounded-[26px] border border-emerald-900/70 bg-[#082c2b] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">

        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/[0.06] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-rose-900/[0.08] blur-3xl pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-7 lg:p-8">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div className="min-w-0">
              <StudioLogo size="lg" light />

              <div className="mt-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-400/80">
                  Studio Ottico Di Pietro
                </p>

                <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[#f5f1e8]">
                  Buongiorno, {currentUser.name}
                </h1>

                <p className="mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-emerald-100/60">
                  Il tuo spazio di lavoro è pronto.
                  <span className="hidden sm:inline">
                    {' '}Gestisci inventario, clienti, prescrizioni e vendite da un unico posto.
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
              <SyncStatusBar />

              <div className="flex gap-2">
                <button
                  id="btn-home-fast-sale"
                  onClick={onOpenFastSale}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5f1e8] px-4 py-2.5 text-xs font-bold text-[#123b38] shadow-lg shadow-black/20 transition-all hover:bg-white active:scale-[0.98]"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Vendita rapida
                </button>

                <button
                  id="btn-home-add-product"
                  onClick={() => onNavigate('add-product')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-700/60 bg-emerald-950/50 px-4 py-2.5 text-xs font-semibold text-emerald-100 transition-all hover:bg-emerald-900/70 active:scale-[0.98]"
                >
                  <PlusCircle className="h-4 w-4 text-emerald-400" />
                  <span className="hidden sm:inline">Nuovo occhiale</span>
                  <span className="sm:hidden">Nuovo</span>
                </button>
              </div>
            </div>
          </div>

          {/* SEARCH */}
          <button
            id="btn-home-universal-search"
            onClick={onOpenSearch}
            className="group mt-7 flex w-full items-center justify-between gap-4 rounded-2xl border border-emerald-800/70 bg-[#041f1f]/80 px-4 py-3.5 text-left shadow-inner transition-all hover:border-emerald-600/70 hover:bg-[#052524]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900/70 text-emerald-300">
                <Search className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#f5f1e8] sm:text-base">
                  Cosa stai cercando?
                </p>
                <p className="mt-0.5 hidden truncate text-[11px] text-emerald-200/45 sm:block">
                  Modello, cliente, prescrizione, barcode o ricerca intelligente
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden rounded-full border border-emerald-700/50 bg-emerald-950/70 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 sm:inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                IA
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-900/60 text-emerald-300 transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* ───────────────── KPI ───────────────── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        <button
          onClick={() => onNavigate('inventory')}
          className="group rounded-2xl border border-emerald-950/80 bg-[#0a2424] p-4 text-left shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-emerald-700/70"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Disponibili
            </span>
            <Package className="h-4 w-4 text-emerald-500/80" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#f5f1e8]">
            {availableCount}
          </p>

          <p className="mt-1 text-[10px] text-emerald-400/70">
            €{formatEuro(totalRetailValue)} a listino
          </p>
        </button>

        <button
          onClick={() => onNavigate('showcase')}
          className="group rounded-2xl border border-emerald-950/80 bg-[#0a2424] p-4 text-left shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-amber-700/60"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Vetrina
            </span>
            <Sparkles className="h-4 w-4 text-amber-500/80" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#f5f1e8]">
            {showcaseItems.length}
          </p>

          <p className="mt-1 text-[10px] text-amber-400/70">
            €{formatEuro(showcaseRetailValue)} esposti
          </p>
        </button>

        <button
          onClick={() => onNavigate('promotions')}
          className="group rounded-2xl border border-emerald-950/80 bg-[#0a2424] p-4 text-left shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-rose-800/70"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Promozioni
            </span>
            <Tag className="h-4 w-4 text-rose-400/80" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#f5f1e8]">
            {promoItems.length}
          </p>

          <p className="mt-1 text-[10px] text-rose-300/70">
            Offerte attive
          </p>
        </button>

        <button
          onClick={() => onNavigate('pending')}
          className="group rounded-2xl border border-emerald-950/80 bg-[#0a2424] p-4 text-left shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-orange-700/60"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Da verificare
            </span>
            <AlertCircle
              className={`h-4 w-4 ${
                pendingCount > 0
                  ? 'text-orange-400'
                  : 'text-slate-600'
              }`}
            />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#f5f1e8]">
            {pendingCount}
          </p>

          <p className="mt-1 text-[10px] text-orange-300/70">
            {pendingCount === 0
              ? 'Tutto completato'
              : 'Elementi da controllare'}
          </p>
        </button>
      </section>

      {/* ───────────────── MAIN CONTENT ───────────────── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">

        {/* VETRINA */}
        <section className="overflow-hidden rounded-2xl border border-emerald-950/80 bg-[#0a2424] shadow-lg shadow-black/10">

          <div className="flex items-center justify-between border-b border-emerald-950/80 px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-[#f5f1e8]">
                  In vetrina
                </h2>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Selezione attualmente esposta
              </p>
            </div>

            <button
              onClick={() => onNavigate('showcase')}
              className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Gestisci
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-px bg-emerald-950/60 sm:grid-cols-2">
            {showcaseItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectEyeglass(item)}
                className="group flex gap-3 bg-[#0a2424] p-4 text-left transition-colors hover:bg-[#0d2d2c]"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-emerald-900/70 bg-[#061c1c]">
                  <img
                    src={item.imageUrl}
                    alt={item.model}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                  <div>
                    <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-500">
                      {item.brand}
                    </p>

                    <p className="mt-1 truncate text-xs font-semibold text-[#f5f1e8]">
                      {item.model}
                    </p>

                    <p className="mt-1 truncate text-[10px] text-slate-500">
                      {item.showcasePosition || item.location}
                    </p>
                  </div>

                  <div className="mt-2 flex items-end justify-between gap-2">
                    <span className="text-sm font-semibold text-emerald-400">
                      €{formatEuro(
                        item.isPromo && item.promoPrice
                          ? item.promoPrice
                          : item.salePrice
                      )}
                    </span>

                    <span className="text-[9px] text-slate-600 transition-colors group-hover:text-emerald-500">
                      Dettagli →
                    </span>
                  </div>
                </div>
              </button>
            ))}

            {showcaseItems.length === 0 && (
              <div className="col-span-full px-5 py-10 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-slate-700" />
                <p className="mt-2 text-xs text-slate-500">
                  Nessun occhiale attualmente in vetrina.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ATTIVITÀ */}
        <section className="rounded-2xl border border-emerald-950/80 bg-[#0a2424] shadow-lg shadow-black/10">

          <div className="flex items-center justify-between border-b border-emerald-950/80 px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-semibold text-[#f5f1e8]">
                  Attività recenti
                </h2>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Ultime operazioni registrate
              </p>
            </div>

            <span className="rounded-full border border-emerald-900/70 bg-emerald-950/50 px-2 py-1 text-[9px] font-medium text-emerald-500">
              SYNC
            </span>
          </div>

          <div className="p-5">
            {auditLogs.length > 0 ? (
              <div className="space-y-4">
                {auditLogs.map((log, index) => (
                  <div key={log.id} className="relative flex gap-3">
                    {index < auditLogs.length - 1 && (
                      <div className="absolute left-[5px] top-4 h-full w-px bg-emerald-950" />
                    )}

                    <div className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#0a2424] bg-emerald-600" />

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-300">
                        {log.details}
                      </p>

                      <div className="mt-1 flex items-center justify-between gap-2 text-[9px] text-slate-600">
                        <span>{log.operator}</span>
                        <span>
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-slate-600">
                Nessuna attività recente.
              </p>
            )}

            <button
              onClick={() => onNavigate('statistics')}
              className="mt-5 w-full rounded-xl border border-emerald-900/70 bg-emerald-950/40 py-2.5 text-[10px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-900/50 hover:text-emerald-300"
            >
              Visualizza statistiche e totali →
            </button>
          </div>
        </section>
      </div>

      {/* ───────────────── STOCK FERMO ───────────────── */}
      {stagnantItems.length > 0 && (
        <section className="flex flex-col gap-4 rounded-2xl border border-amber-900/40 bg-[#211b12] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-950/70 text-amber-400">
              <AlertCircle className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-200">
                Stock a bassa rotazione
              </p>

              <p className="mt-1 text-[10px] leading-relaxed text-amber-200/50">
                {stagnantItems.length} occhiali presenti da oltre 6 mesi.
                {' '}
                <span className="text-amber-200/70">
                  {stagnantItems[0].brand} {stagnantItems[0].model}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('promotions')}
            className="shrink-0 rounded-xl border border-amber-800/50 bg-amber-950/50 px-3.5 py-2 text-[10px] font-semibold text-amber-300 transition-colors hover:bg-amber-900/60"
          >
            Analizza suggerimenti
          </button>
        </section>
      )}

    </div>
  );
};

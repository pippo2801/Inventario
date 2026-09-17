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

const euro = (value: number) =>
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
      (sum, e) =>
        sum + (e.isPromo && e.promoPrice ? e.promoPrice : e.salePrice),
      0
    );

  const showcaseRetailValue = showcaseItems.reduce(
    (sum, e) =>
      sum + (e.isPromo && e.promoPrice ? e.promoPrice : e.salePrice),
    0
  );

  return (
    <div className="min-h-full bg-[#f3efe7] pb-14 text-[#292725] animate-in fade-in duration-300">

      {/* ═══════════════════════════════════════
          HERO — IVORY PREMIUM
      ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-[#ddd6cb] bg-[#f8f5ef]">

        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#d8c4a5]/20 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#8b5360]/10 blur-[100px]" />

        <div className="relative z-10 px-5 py-7 sm:px-8 sm:py-9 lg:px-10">

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <StudioLogo size="lg" />

              <div className="mt-7">
                <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-[#8b5360]">
                  Studio Ottico Di Pietro
                </p>

                <h1 className="mt-2 text-3xl font-light tracking-[-0.03em] text-[#262422] sm:text-4xl">
                  Buongiorno, {currentUser.name}
                </h1>

                <p className="mt-3 max-w-xl text-xs leading-relaxed text-[#77716a] sm:text-sm">
                  Il tuo spazio per clienti, occhiali,
                  prescrizioni e vendite.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4 lg:items-end">

              <SyncStatusBar />

              <div className="flex flex-wrap gap-2">
                <button
                  id="btn-home-fast-sale"
                  onClick={onOpenFastSale}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#292725] px-4 py-2.5 text-xs font-semibold text-[#f8f5ef] shadow-sm transition-all hover:bg-[#3b3835] active:scale-[0.98]"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Vendita rapida
                </button>

                <button
                  id="btn-home-add-product"
                  onClick={() => onNavigate('add-product')}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#cfc6b9] bg-white/60 px-4 py-2.5 text-xs font-semibold text-[#4c4843] transition-all hover:border-[#a89478] hover:bg-white active:scale-[0.98]"
                >
                  <PlusCircle className="h-4 w-4 text-[#8b5360]" />
                  Nuovo occhiale
                </button>
              </div>
            </div>
          </div>

          {/* SEARCH */}
          <button
            id="btn-home-universal-search"
            onClick={onOpenSearch}
            className="group mt-9 flex w-full items-center justify-between gap-4 rounded-2xl border border-[#d9d1c6] bg-white px-4 py-4 text-left shadow-[0_8px_30px_rgba(45,39,32,0.05)] transition-all hover:border-[#b6a38a] hover:shadow-[0_10px_35px_rgba(45,39,32,0.08)] sm:px-5"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1e9e3] text-[#8b5360]">
                <Search className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-[#292725] sm:text-base">
                  Cosa stai cercando?
                </p>

                <p className="mt-1 hidden truncate text-[10px] uppercase tracking-[0.13em] text-[#9a938b] sm:block">
                  Cliente · Modello · Prescrizione · Barcode · IA
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8b5360] sm:flex">
                <Sparkles className="h-3 w-3" />
                IA attiva
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3efe7] text-[#77716a] transition-all group-hover:bg-[#292725] group-hover:text-white">
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          KPI
      ═══════════════════════════════════════ */}
      <section className="grid grid-cols-2 border-b border-[#ddd6cb] bg-[#f8f5ef] lg:grid-cols-4">

        <button
          onClick={() => onNavigate('inventory')}
          className="group border-b border-r border-[#ddd6cb] p-5 text-left transition-colors hover:bg-white lg:border-b-0"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#989087]">
              Disponibili
            </span>
            <Package className="h-4 w-4 text-[#9b9287]" />
          </div>

          <p className="mt-4 text-3xl font-light tracking-tight text-[#292725]">
            {availableCount}
          </p>

          <p className="mt-1 text-[10px] text-[#91887e]">
            €{euro(totalRetailValue)} a listino
          </p>
        </button>

        <button
          onClick={() => onNavigate('showcase')}
          className="group border-b border-[#ddd6cb] p-5 text-left transition-colors hover:bg-white lg:border-b-0 lg:border-r"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#989087]">
              Vetrina
            </span>
            <Sparkles className="h-4 w-4 text-[#b39a75]" />
          </div>

          <p className="mt-4 text-3xl font-light tracking-tight text-[#292725]">
            {showcaseItems.length}
          </p>

          <p className="mt-1 text-[10px] text-[#91887e]">
            €{euro(showcaseRetailValue)} esposti
          </p>
        </button>

        <button
          onClick={() => onNavigate('promotions')}
          className="border-r border-[#ddd6cb] p-5 text-left transition-colors hover:bg-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#989087]">
              Promozioni
            </span>
            <Tag className="h-4 w-4 text-[#8b5360]" />
          </div>

          <p className="mt-4 text-3xl font-light tracking-tight text-[#292725]">
            {promoItems.length}
          </p>

          <p className="mt-1 text-[10px] text-[#8b5360]">
            Offerte attive
          </p>
        </button>

        <button
          onClick={() => onNavigate('pending')}
          className="p-5 text-left transition-colors hover:bg-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#989087]">
              Da verificare
            </span>

            <AlertCircle
              className={`h-4 w-4 ${
                pendingCount > 0
                  ? 'text-[#ae7654]'
                  : 'text-[#aaa39b]'
              }`}
            />
          </div>

          <p className="mt-4 text-3xl font-light tracking-tight text-[#292725]">
            {pendingCount}
          </p>

          <p className="mt-1 text-[10px] text-[#91887e]">
            {pendingCount === 0
              ? 'Tutto completato'
              : 'Elementi da controllare'}
          </p>
        </button>
      </section>

      {/* ═══════════════════════════════════════
          CONTENT
      ═══════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-5 px-0 pt-5 xl:grid-cols-[1.7fr_1fr]">

        {/* VETRINA */}
        <section className="overflow-hidden border border-[#ddd6cb] bg-[#f8f5ef]">

          <div className="flex items-end justify-between px-5 py-5 sm:px-7">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#8b5360]">
                Selezione
              </p>

              <h2 className="mt-1 text-xl font-light tracking-tight text-[#292725]">
                In vetrina
              </h2>
            </div>

            <button
              onClick={() => onNavigate('showcase')}
              className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-[#827a72] transition-colors hover:text-[#8b5360]"
            >
              Vedi tutto
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 border-t border-[#ddd6cb] sm:grid-cols-2">
            {showcaseItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectEyeglass(item)}
                className="group flex gap-4 border-b border-r border-[#ddd6cb] bg-[#f8f5ef] p-4 text-left transition-colors hover:bg-white"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#e8e2d9] sm:h-28 sm:w-28">
                  <img
                    src={item.imageUrl}
                    alt={item.model}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8b5360]">
                      {item.brand}
                    </p>

                    <p className="mt-1 truncate text-xs font-semibold text-[#393531]">
                      {item.model}
                    </p>

                    <p className="mt-1 truncate text-[9px] text-[#999188]">
                      {item.showcasePosition || item.location}
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <span className="text-sm font-medium text-[#4a4641]">
                      €{euro(
                        item.isPromo && item.promoPrice
                          ? item.promoPrice
                          : item.salePrice
                      )}
                    </span>

                    <span className="text-[9px] text-[#aaa29a] transition-colors group-hover:text-[#8b5360]">
                      Dettagli
                    </span>
                  </div>
                </div>
              </button>
            ))}

            {showcaseItems.length === 0 && (
              <div className="col-span-full px-5 py-12 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-[#c2baaf]" />
                <p className="mt-3 text-xs text-[#958d84]">
                  Nessun occhiale attualmente in vetrina.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ATTIVITÀ */}
        <section className="border border-[#ddd6cb] bg-[#f8f5ef]">

          <div className="border-b border-[#ddd6cb] px-5 py-5 sm:px-7">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#8b5360]">
              Registro
            </p>

            <div className="mt-1 flex items-center justify-between">
              <h2 className="text-xl font-light tracking-tight text-[#292725]">
                Attività recenti
              </h2>

              <Clock className="h-4 w-4 text-[#aaa198]" />
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {auditLogs.length > 0 ? (
              <div className="space-y-5">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="grid grid-cols-[8px_1fr_auto] items-start gap-3"
                  >
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#9a6370]" />

                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-[#68615a]">
                        {log.details}
                      </p>

                      <p className="mt-1 text-[9px] text-[#aaa198]">
                        {log.operator}
                      </p>
                    </div>

                    <span className="text-[9px] text-[#aaa198]">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-[#aaa198]">
                Nessuna attività recente.
              </p>
            )}

            <button
              onClick={() => onNavigate('statistics')}
              className="mt-7 flex w-full items-center justify-center gap-2 border-t border-[#ddd6cb] pt-4 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#817971] transition-colors hover:text-[#8b5360]"
            >
              Statistiche e totali
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════
          STOCK FERMO
      ═══════════════════════════════════════ */}
      {stagnantItems.length > 0 && (
        <section className="flex flex-col gap-4 border border-[#dfd0c6] bg-[#f4e9e4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#a56c57]" />

            <div>
              <p className="text-xs font-semibold text-[#604941]">
                Stock a bassa rotazione
              </p>

              <p className="mt-1 text-[10px] text-[#967c71]">
                {stagnantItems.length} occhiali presenti da oltre 6 mesi.
                {' '}
                <span className="text-[#795e55]">
                  {stagnantItems[0].brand} {stagnantItems[0].model}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('promotions')}
            className="self-start rounded-xl border border-[#cdb1a5] bg-white/50 px-3.5 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#805d53] transition-colors hover:bg-white sm:self-auto"
          >
            Analizza
          </button>
        </section>
      )}
    </div>
  );
};

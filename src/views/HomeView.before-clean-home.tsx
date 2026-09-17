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
  ArrowUpRight,
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
    <div className="min-h-full bg-[#f7f4ee] pb-16 text-[#242321] animate-in fade-in duration-500">

      {/* EDITORIAL HEADER */}
      <section className="relative overflow-hidden border-b border-[#ded9d0] bg-[#f7f4ee]">

        <div className="pointer-events-none absolute -right-24 top-[-120px] h-[420px] w-[420px] rounded-full border border-[#8b5360]/10" />
        <div className="pointer-events-none absolute -right-12 top-[-60px] h-[300px] w-[300px] rounded-full border border-[#8b5360]/10" />

        <div className="relative z-10 px-5 pb-10 pt-7 sm:px-8 lg:px-12 lg:pb-14 lg:pt-9">

          <div className="flex items-start justify-between gap-6">
            <StudioLogo size="lg" />

            <div className="hidden items-center gap-3 sm:flex">
              <SyncStatusBar />
            </div>
          </div>

          <div className="mt-12 max-w-5xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.42em] text-[#8b5360]">
              Studio Ottico Di Pietro
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-light leading-[0.98] tracking-[-0.045em] text-[#252422] sm:text-5xl lg:text-7xl">
              Buongiorno,
              <br />
              <span className="text-[#8b5360]">{currentUser.name}</span>
            </h1>

            <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <p className="max-w-md text-xs leading-[1.8] text-[#77716a] sm:text-sm">
                Tutto il tuo studio, in un unico spazio.
                <br />
                Clienti, collezioni, prescrizioni e vendite.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  id="btn-home-fast-sale"
                  onClick={onOpenFastSale}
                  className="inline-flex items-center gap-2 bg-[#292725] px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.15em] text-white transition-all hover:bg-[#8b5360] active:scale-[0.98]"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Vendita rapida
                </button>

                <button
                  id="btn-home-add-product"
                  onClick={() => onNavigate('add-product')}
                  className="inline-flex items-center gap-2 border border-[#cfc8be] bg-transparent px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#514d48] transition-all hover:border-[#8b5360] hover:text-[#8b5360] active:scale-[0.98]"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Nuovo occhiale
                </button>
              </div>
            </div>
          </div>

          {/* SEARCH EDITORIAL */}
          <button
            id="btn-home-universal-search"
            onClick={onOpenSearch}
            className="group mt-12 flex w-full items-center justify-between border-y border-[#d8d2c9] py-5 text-left transition-all hover:border-[#8b5360]"
          >
            <div className="flex min-w-0 items-center gap-4">
              <Search className="h-5 w-5 shrink-0 text-[#8b5360]" />

              <div className="min-w-0">
                <p className="text-sm font-medium text-[#302e2b] sm:text-base">
                  Cerca nel tuo studio
                </p>

                <p className="mt-1 truncate text-[9px] uppercase tracking-[0.18em] text-[#9b958d]">
                  Cliente · Modello · Prescrizione · Barcode · IA
                </p>
              </div>
            </div>

            <div className="ml-4 flex shrink-0 items-center gap-3">
              <span className="hidden text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8b5360] sm:block">
                IA attiva
              </span>
              <ArrowUpRight className="h-4 w-4 text-[#8b5360] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </button>

          <div className="mt-5 sm:hidden">
            <SyncStatusBar />
          </div>
        </div>
      </section>

      {/* NUMERI DELLO STUDIO */}
      <section className="border-b border-[#ded9d0] bg-[#242321] text-[#f5f1e9]">
        <div className="grid grid-cols-2 lg:grid-cols-4">

          <button
            onClick={() => onNavigate('inventory')}
            className="group border-b border-r border-white/10 p-5 text-left transition-colors hover:bg-white/[0.04] lg:border-b-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-semibold uppercase tracking-[0.25em] text-white/45">
                Disponibili
              </span>
              <Package className="h-3.5 w-3.5 text-[#c5a989]" />
            </div>

            <p className="mt-5 text-4xl font-light tracking-[-0.04em]">
              {availableCount}
            </p>

            <p className="mt-1 text-[9px] text-white/40">
              €{euro(totalRetailValue)} a listino
            </p>
          </button>

          <button
            onClick={() => onNavigate('showcase')}
            className="group border-b border-white/10 p-5 text-left transition-colors hover:bg-white/[0.04] lg:border-b-0 lg:border-r"
          >
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-semibold uppercase tracking-[0.25em] text-white/45">
                Vetrina
              </span>
              <Sparkles className="h-3.5 w-3.5 text-[#c5a989]" />
            </div>

            <p className="mt-5 text-4xl font-light tracking-[-0.04em]">
              {showcaseItems.length}
            </p>

            <p className="mt-1 text-[9px] text-white/40">
              €{euro(showcaseRetailValue)} esposti
            </p>
          </button>

          <button
            onClick={() => onNavigate('promotions')}
            className="group border-b border-r border-white/10 p-5 text-left transition-colors hover:bg-white/[0.04] lg:border-b-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-semibold uppercase tracking-[0.25em] text-white/45">
                Promozioni
              </span>
              <Tag className="h-3.5 w-3.5 text-[#a96b76]" />
            </div>

            <p className="mt-5 text-4xl font-light tracking-[-0.04em]">
              {promoItems.length}
            </p>

            <p className="mt-1 text-[9px] text-[#c28a95]">
              Offerte attive
            </p>
          </button>

          <button
            onClick={() => onNavigate('pending')}
            className="group p-5 text-left transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-semibold uppercase tracking-[0.25em] text-white/45">
                Da verificare
              </span>

              <AlertCircle
                className={`h-3.5 w-3.5 ${
                  pendingCount > 0
                    ? 'text-[#c28a72]'
                    : 'text-white/30'
                }`}
              />
            </div>

            <p className="mt-5 text-4xl font-light tracking-[-0.04em]">
              {pendingCount}
            </p>

            <p className="mt-1 text-[9px] text-white/40">
              {pendingCount === 0
                ? 'Tutto completato'
                : 'Elementi da controllare'}
            </p>
          </button>
        </div>
      </section>

      {/* VETRINA EDITORIALE */}
      <section className="px-5 py-10 sm:px-8 lg:px-12 lg:py-14">

        <div className="flex flex-col gap-4 border-b border-[#d9d3ca] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#8b5360]">
              La collezione
            </p>

            <h2 className="mt-2 text-3xl font-light tracking-[-0.035em] text-[#282624] sm:text-4xl">
              In vetrina
            </h2>
          </div>

          <button
            onClick={() => onNavigate('showcase')}
            className="flex items-center gap-2 self-start text-[9px] font-semibold uppercase tracking-[0.18em] text-[#77716a] transition-colors hover:text-[#8b5360] sm:self-auto"
          >
            Esplora collezione
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-px bg-[#d9d3ca] sm:grid-cols-2 xl:grid-cols-4">
          {showcaseItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectEyeglass(item)}
              className="group bg-[#f7f4ee] p-3 text-left transition-colors hover:bg-white"
            >
              <div className="relative aspect-[1.08/1] overflow-hidden bg-[#e9e4dc]">
                <img
                  src={item.imageUrl}
                  alt={item.model}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center bg-white/90 text-[#292725] opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="px-1 pb-2 pt-4">
                <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-[#8b5360]">
                  {item.brand}
                </p>

                <div className="mt-1 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#302e2b]">
                      {item.model}
                    </p>

                    <p className="mt-1 truncate text-[9px] text-[#9a938b]">
                      {item.showcasePosition || item.location}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs font-medium text-[#514d48]">
                    €{euro(
                      item.isPromo && item.promoPrice
                        ? item.promoPrice
                        : item.salePrice
                    )}
                  </span>
                </div>
              </div>
            </button>
          ))}

          {showcaseItems.length === 0 && (
            <div className="col-span-full bg-[#f7f4ee] px-5 py-16 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-[#b6aea4]" />
              <p className="mt-3 text-xs text-[#918a82]">
                Nessun occhiale attualmente in vetrina.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ATTIVITÀ + STOCK */}
      <section className="grid grid-cols-1 border-t border-[#ded9d0] lg:grid-cols-[1.35fr_0.65fr]">

        <div className="border-b border-[#ded9d0] px-5 py-10 sm:px-8 lg:border-b-0 lg:border-r lg:px-12">
          <div className="flex items-end justify-between border-b border-[#d9d3ca] pb-5">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#8b5360]">
                Diario
              </p>

              <h2 className="mt-2 text-2xl font-light tracking-[-0.03em] text-[#292725]">
                Attività recenti
              </h2>
            </div>

            <Clock className="h-4 w-4 text-[#a39b92]" />
          </div>

          <div className="mt-6">
            {auditLogs.length > 0 ? (
              <div className="divide-y divide-[#e0dbd3]">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="grid grid-cols-[6px_1fr_auto] items-start gap-4 py-4"
                  >
                    <div className="mt-2 h-1.5 w-1.5 rounded-full bg-[#9a6370]" />

                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-[#625d57]">
                        {log.details}
                      </p>

                      <p className="mt-1.5 text-[9px] uppercase tracking-[0.1em] text-[#aaa39b]">
                        {log.operator}
                      </p>
                    </div>

                    <span className="text-[9px] text-[#aaa39b]">
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
              className="mt-4 flex items-center gap-2 border-t border-[#d9d3ca] pt-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#77716a] transition-colors hover:text-[#8b5360]"
            >
              Statistiche e totali
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="bg-[#eee8df] px-5 py-10 sm:px-8 lg:px-10">
          <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#8b5360]">
            Attenzione
          </p>

          <h2 className="mt-2 text-2xl font-light tracking-[-0.03em] text-[#292725]">
            Stock a bassa rotazione
          </h2>

          {stagnantItems.length > 0 ? (
            <>
              <div className="mt-8 border-t border-[#d4cbc0] pt-6">
                <p className="text-5xl font-light tracking-[-0.05em] text-[#292725]">
                  {stagnantItems.length}
                </p>

                <p className="mt-2 text-[10px] leading-relaxed text-[#81786f]">
                  occhiali presenti da oltre 6 mesi.
                </p>
              </div>

              <div className="mt-8">
                <p className="text-[9px] uppercase tracking-[0.18em] text-[#9a8e83]">
                  Primo articolo da analizzare
                </p>

                <p className="mt-2 text-sm font-medium text-[#4a443e]">
                  {stagnantItems[0].brand}
                </p>

                <p className="text-xs text-[#81786f]">
                  {stagnantItems[0].model}
                </p>
              </div>

              <button
                onClick={() => onNavigate('promotions')}
                className="mt-8 inline-flex items-center gap-2 border border-[#b9a99a] bg-transparent px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#665b53] transition-colors hover:border-[#8b5360] hover:text-[#8b5360]"
              >
                Analizza stock
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="mt-8 border-t border-[#d4cbc0] pt-6">
              <p className="text-sm text-[#81786f]">
                Nessun articolo fermo oltre 6 mesi.
              </p>

              <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-[#a3988d]">
                Tutto sotto controllo
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

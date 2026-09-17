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
    <div className="min-h-full bg-[#111111] pb-14 text-[#eee9df] animate-in fade-in duration-300">

      {/* ═══════════════════════════════════════
          HERO — LUXURY BOUTIQUE
      ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden border border-[#332e2b] bg-[#171616]">

        <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-[#641f2c]/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-[#8a6670]/10 blur-[110px]" />

        <div className="relative z-10 px-5 py-7 sm:px-8 sm:py-9 lg:px-10">

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <StudioLogo size="lg" light />

              <div className="mt-7">
                <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#a98a90]">
                  Studio Ottico Di Pietro
                </p>

                <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-[#f4efe6] sm:text-4xl">
                  Buongiorno, {currentUser.name}
                </h1>

                <p className="mt-3 max-w-xl text-xs leading-relaxed text-[#918b84] sm:text-sm">
                  Tutto ciò che serve per gestire lo studio,
                  in un unico spazio.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4 lg:items-end">

              <SyncStatusBar />

              <div className="flex flex-wrap gap-2">
                <button
                  id="btn-home-fast-sale"
                  onClick={onOpenFastSale}
                  className="inline-flex items-center gap-2 bg-[#f1ece2] px-4 py-2.5 text-xs font-bold text-[#171616] transition-all hover:bg-white active:scale-[0.98]"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Vendita rapida
                </button>

                <button
                  id="btn-home-add-product"
                  onClick={() => onNavigate('add-product')}
                  className="inline-flex items-center gap-2 border border-[#4a4140] bg-transparent px-4 py-2.5 text-xs font-semibold text-[#d5cdc2] transition-all hover:border-[#80525b] hover:bg-[#241c1e] active:scale-[0.98]"
                >
                  <PlusCircle className="h-4 w-4 text-[#a96b76]" />
                  Nuovo occhiale
                </button>
              </div>
            </div>
          </div>

          {/* SEARCH */}
          <button
            id="btn-home-universal-search"
            onClick={onOpenSearch}
            className="group mt-9 flex w-full items-center justify-between border border-[#3a3532] bg-[#101010] px-4 py-4 text-left transition-all hover:border-[#75505a] sm:px-5"
          >
            <div className="flex min-w-0 items-center gap-4">
              <Search className="h-5 w-5 shrink-0 text-[#a96b76]" />

              <div className="min-w-0">
                <p className="text-sm font-medium text-[#eee9df] sm:text-base">
                  Cosa stai cercando?
                </p>

                <p className="mt-1 hidden truncate text-[10px] uppercase tracking-[0.14em] text-[#66615d] sm:block">
                  Cliente · Modello · Prescrizione · Barcode · IA
                </p>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-[#665f5a] transition-transform group-hover:translate-x-1 group-hover:text-[#a96b76]" />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          NUMERI DELLO STUDIO
      ═══════════════════════════════════════ */}
      <section className="grid grid-cols-2 border-x border-b border-[#302c29] bg-[#171616] lg:grid-cols-4">

        <button
          onClick={() => onNavigate('inventory')}
          className="group border-b border-r border-[#302c29] p-5 text-left transition-colors hover:bg-[#1d1b1a] lg:border-b-0"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#716c66]">
              Disponibili
            </span>
            <Package className="h-4 w-4 text-[#766e68]" />
          </div>

          <p className="mt-4 text-3xl font-light tracking-tight text-[#f0ebe2]">
            {availableCount}
          </p>

          <p className="mt-1 text-[10px] text-[#887f78]">
            €{euro(totalRetailValue)} a listino
          </p>
        </button>

        <button
          onClick={() => onNavigate('showcase')}
          className="group border-b border-[#302c29] p-5 text-left transition-colors hover:bg-[#1d1b1a] lg:border-b-0 lg:border-r"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#716c66]">
              Vetrina
            </span>
            <Sparkles className="h-4 w-4 text-[#9b8170]" />
          </div>

          <p className="mt-4 text-3xl font-light tracking-tight text-[#f0ebe2]">
            {showcaseItems.length}
          </p>

          <p className="mt-1 text-[10px] text-[#887f78]">
            €{euro(showcaseRetailValue)} esposti
          </p>
        </button>

        <button
          onClick={() => onNavigate('promotions')}
          className="border-r border-[#302c29] p-5 text-left transition-colors hover:bg-[#1d1b1a]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#716c66]">
              Promozioni
            </span>
            <Tag className="h-4 w-4 text-[#a96b76]" />
          </div>

          <p className="mt-4 text-3xl font-light tracking-tight text-[#f0ebe2]">
            {promoItems.length}
          </p>

          <p className="mt-1 text-[10px] text-[#a96b76]">
            Offerte attive
          </p>
        </button>

        <button
          onClick={() => onNavigate('pending')}
          className="p-5 text-left transition-colors hover:bg-[#1d1b1a]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#716c66]">
              Da verificare
            </span>
            <AlertCircle
              className={`h-4 w-4 ${
                pendingCount > 0 ? 'text-[#b77954]' : 'text-[#55514d]'
              }`}
            />
          </div>

          <p className="mt-4 text-3xl font-light tracking-tight text-[#f0ebe2]">
            {pendingCount}
          </p>

          <p className="mt-1 text-[10px] text-[#887f78]">
            {pendingCount === 0
              ? 'Tutto completato'
              : 'Elementi da controllare'}
          </p>
        </button>
      </section>

      {/* ═══════════════════════════════════════
          VETRINA + ATTIVITÀ
      ═══════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-px border border-[#302c29] bg-[#302c29] xl:grid-cols-[1.65fr_1fr]">

        {/* VETRINA */}
        <section className="bg-[#171616]">

          <div className="flex items-end justify-between px-5 py-5 sm:px-7">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#a96b76]">
                Selezione
              </p>

              <h2 className="mt-1 font-serif text-xl text-[#eee9df]">
                In vetrina
              </h2>
            </div>

            <button
              onClick={() => onNavigate('showcase')}
              className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-[#77716b] transition-colors hover:text-[#c18b94]"
            >
              Vedi tutto
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 border-t border-[#302c29] sm:grid-cols-2">
            {showcaseItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectEyeglass(item)}
                className="group flex gap-4 border-b border-r border-[#302c29] bg-[#171616] p-4 text-left transition-colors hover:bg-[#1e1c1b]"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden bg-[#0e0e0e] sm:h-28 sm:w-28">
                  <img
                    src={item.imageUrl}
                    alt={item.model}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a96b76]">
                      {item.brand}
                    </p>

                    <p className="mt-1 truncate text-xs font-medium text-[#e8e1d7]">
                      {item.model}
                    </p>

                    <p className="mt-1 truncate text-[9px] text-[#69635e]">
                      {item.showcasePosition || item.location}
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <span className="text-sm font-medium text-[#ddd5ca]">
                      €{euro(
                        item.isPromo && item.promoPrice
                          ? item.promoPrice
                          : item.salePrice
                      )}
                    </span>

                    <span className="text-[9px] text-[#57524d] group-hover:text-[#a96b76]">
                      Dettagli
                    </span>
                  </div>
                </div>
              </button>
            ))}

            {showcaseItems.length === 0 && (
              <div className="col-span-full px-5 py-12 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-[#45413e]" />
                <p className="mt-3 text-xs text-[#66615c]">
                  Nessun occhiale attualmente in vetrina.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ATTIVITÀ */}
        <section className="bg-[#171616]">

          <div className="border-b border-[#302c29] px-5 py-5 sm:px-7">
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#a96b76]">
              Registro
            </p>

            <div className="mt-1 flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#eee9df]">
                Attività recenti
              </h2>

              <Clock className="h-4 w-4 text-[#665f5a]" />
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
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8e5963]" />

                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-[#bdb5ab]">
                        {log.details}
                      </p>

                      <p className="mt-1 text-[9px] text-[#5f5954]">
                        {log.operator}
                      </p>
                    </div>

                    <span className="text-[9px] text-[#5f5954]">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-[#5f5954]">
                Nessuna attività recente.
              </p>
            )}

            <button
              onClick={() => onNavigate('statistics')}
              className="mt-7 flex w-full items-center justify-center gap-2 border-t border-[#302c29] pt-4 text-[9px] uppercase tracking-[0.15em] text-[#756e68] transition-colors hover:text-[#b9858e]"
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
        <section className="flex flex-col gap-4 border border-[#4a302f] bg-[#21191a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#b77954]" />

            <div>
              <p className="text-xs font-medium text-[#d8c2b5]">
                Stock a bassa rotazione
              </p>

              <p className="mt-1 text-[10px] text-[#806d65]">
                {stagnantItems.length} occhiali presenti da oltre 6 mesi.
                {' '}
                <span className="text-[#a58b81]">
                  {stagnantItems[0].brand} {stagnantItems[0].model}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('promotions')}
            className="self-start border border-[#62413f] px-3.5 py-2 text-[9px] uppercase tracking-[0.12em] text-[#bd8e87] transition-colors hover:bg-[#302022] sm:self-auto"
          >
            Analizza
          </button>
        </section>
      )}
    </div>
  );
};

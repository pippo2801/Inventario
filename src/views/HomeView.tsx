import React from 'react';
import { Search } from 'lucide-react';

interface HomeViewProps {
  onOpenSearch: () => void;
  onNavigate: (view: string, id?: string) => void;
  onSelectEyeglass: (eyeglass: any) => void;
  onOpenFastSale: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onOpenSearch }) => {
  return (
    <main className="relative flex min-h-[calc(100vh-72px)] flex-col items-center justify-between overflow-hidden bg-[#f7f4ee] px-5 py-8 text-[#292725]">
      
      {/* Spazio superiore vuoto per bilanciare */}
      <div className="w-full"></div>

      {/* Logo centrale reale con trasparenza */}
      <div className="flex flex-1 items-center justify-center py-6">
        <img
          src="/logo.png"
          alt="Studio Ottico Di Pietro"
          className="h-auto w-[min(72vw,420px)] max-w-full object-contain"
        />
      </div>

      {/* Barra di ricerca discreta in basso */}
      <div className="w-full max-w-2xl pb-6">
        <button
          type="button"
          onClick={onOpenSearch}
          className="group flex h-12 w-full items-center gap-3 rounded-full border border-[#d8d1c7] bg-white/75 px-5 text-left shadow-[0_2px_10px_rgba(41,39,37,0.04)] transition-all hover:border-[#b99aa1] hover:bg-white"
          aria-label="Cosa stai cercando?"
        >
          <Search className="h-4 w-4 shrink-0 text-[#8b5360]" />

          <span className="flex-1 truncate text-sm text-[#77716a]">
            Cosa stai cercando?
          </span>

          <span className="hidden text-[9px] uppercase tracking-[0.16em] text-[#aaa39a] sm:block">
            Cerca nel tuo studio
          </span>
        </button>
      </div>

      {/* Firma discreta in basso */}
      <div className="pb-2">
        <span className="text-[8px] font-semibold uppercase tracking-[0.28em] text-[#aaa39a]">
          Studio Ottico Di Pietro
        </span>
      </div>

    </main>
  );
};

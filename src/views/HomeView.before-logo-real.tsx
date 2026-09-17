import React from 'react';
import { StudioLogo } from '../components/StudioLogo';

interface HomeViewProps {
  onOpenSearch: () => void;
  onNavigate: (view: string, id?: string) => void;
  onSelectEyeglass: (eyeglass: any) => void;
  onOpenFastSale: () => void;
}

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Buongiorno';
  }

  if (hour >= 12 && hour < 18) {
    return 'Buon pomeriggio';
  }

  return 'Buonasera';
};

export const HomeView: React.FC<HomeViewProps> = (_props) => {
  const greeting = getGreeting();

  return (
    <main className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden bg-[#f7f4ee] px-5 pb-16 text-[#292725] sm:px-8">

      {/* Logo principale — watermark centrale */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[47%] select-none opacity-[0.12] blur-[0.2px]"
      >
        <StudioLogo
          size="xl"
          showText
          light={false}
          className="scale-[2.4] origin-center sm:scale-[3.2] lg:scale-[4]"
        />
      </div>

      {/* Contenuto centrale */}
      <section className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">

        <div className="mb-9 h-px w-16 bg-[#8b5360]/35" />

        <h1 className="font-light text-4xl tracking-[-0.045em] text-[#292725] sm:text-5xl lg:text-6xl">
          {greeting}
        </h1>

        <p className="mt-5 max-w-md text-xs leading-7 text-[#817a72] sm:text-sm">
          Il tuo studio, tutto in un unico spazio.
        </p>

        <div className="mt-10 h-px w-24 bg-[#d8d1c7]" />

      </section>

      {/* Firma discreta */}
      <div className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 text-center">
        <p className="text-[8px] font-semibold uppercase tracking-[0.32em] text-[#aaa39a]">
          Studio Ottico Di Pietro
        </p>
      </div>

    </main>
  );
};

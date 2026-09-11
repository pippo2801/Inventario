import React from 'react';

/**
 * WatermarkBackground - Studio Ottico Di Pietro
 * Requisito Sezione 8:
 * "Sul fondo delle schermate deve essere presente una versione molto trasparente,
 * sfocata, discreta, tipo watermark del logo dello Studio Ottico Di Pietro,
 * con l'immagine circolare delle lenti e la grafica burgundy/bianca.
 * Il watermark non deve rendere difficile la lettura."
 */
export const WatermarkBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center select-none"
    >
      {/* Deep petrol ambient gradient */}
      <div className="absolute inset-0 bg-radial from-teal-950/20 via-slate-950/40 to-slate-950/80" />

      {/* Subtle Optical Lenses Watermark Symbol */}
      <div className="relative opacity-[0.035] transform scale-110 md:scale-150 rotate-[-8deg] filter blur-[1.5px]">
        <svg
          width="750"
          height="450"
          viewBox="0 0 750 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          {/* Left Lens ring */}
          <circle
            cx="230"
            cy="225"
            r="160"
            stroke="currentColor"
            strokeWidth="14"
          />
          <circle
            cx="230"
            cy="225"
            r="140"
            stroke="#881337"
            strokeWidth="6"
            strokeDasharray="16 12"
          />
          <circle
            cx="230"
            cy="225"
            r="110"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.6"
          />

          {/* Right Lens ring */}
          <circle
            cx="520"
            cy="225"
            r="160"
            stroke="currentColor"
            strokeWidth="14"
          />
          <circle
            cx="520"
            cy="225"
            r="140"
            stroke="#881337"
            strokeWidth="6"
            strokeDasharray="16 12"
          />
          <circle
            cx="520"
            cy="225"
            r="110"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.6"
          />

          {/* Bridge (Ponte ottico) */}
          <path
            d="M380 200 C395 160, 425 160, 440 200"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M375 220 C395 190, 425 190, 445 220"
            stroke="#881337"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Left temple hinge */}
          <path
            d="M75 210 L15 195"
            stroke="currentColor"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Right temple hinge */}
          <path
            d="M675 210 L735 195"
            stroke="currentColor"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Subtle optical refraction grid */}
          <line x1="230" y1="90" x2="230" y2="360" stroke="#ffffff" strokeWidth="2" opacity="0.3" />
          <line x1="95" y1="225" x2="365" y2="225" stroke="#ffffff" strokeWidth="2" opacity="0.3" />
          <line x1="520" y1="90" x2="520" y2="360" stroke="#ffffff" strokeWidth="2" opacity="0.3" />
          <line x1="385" y1="225" x2="655" y2="225" stroke="#ffffff" strokeWidth="2" opacity="0.3" />
        </svg>
      </div>
    </div>
  );
};

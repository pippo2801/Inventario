import React from 'react';

interface StudioLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  light?: boolean;
}

export const StudioLogo: React.FC<StudioLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  light = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Insignia: Circular Optical Lenses with Burgundy & White Geometry */}
      <div
        className={`${iconSizes[size]} relative flex-shrink-0 rounded-xl bg-gradient-to-br from-teal-800 via-teal-900 to-slate-950 p-1.5 shadow-md border border-teal-600/40 flex items-center justify-center overflow-hidden group`}
      >
        {/* Subtle internal glow */}
        <div className="absolute inset-0 bg-radial from-teal-400/20 to-transparent pointer-events-none" />

        <svg
          viewBox="0 0 100 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white filter drop-shadow-sm"
        >
          {/* Left Lens */}
          <circle cx="30" cy="30" r="22" stroke="currentColor" strokeWidth="4.5" />
          <circle cx="30" cy="30" r="17" stroke="#9f1239" strokeWidth="2.5" strokeDasharray="3 2" />
          <circle cx="30" cy="30" r="4" fill="#ffffff" opacity="0.9" />

          {/* Right Lens */}
          <circle cx="70" cy="30" r="22" stroke="currentColor" strokeWidth="4.5" />
          <circle cx="70" cy="30" r="17" stroke="#9f1239" strokeWidth="2.5" strokeDasharray="3 2" />
          <circle cx="70" cy="30" r="4" fill="#ffffff" opacity="0.9" />

          {/* Bridge */}
          <path
            d="M50 25 C52 20, 58 20, 60 25"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Left / Right hinge hints */}
          <path d="M8 29 L2 29" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M92 29 L98 29" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-serif tracking-tight font-bold ${
                light ? 'text-white' : 'text-slate-900'
              } ${size === 'lg' || size === 'xl' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg'}`}
            >
              STUDIO OTTICO
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
          </div>
          <span
            className={`font-sans tracking-wider uppercase font-semibold text-teal-300 ${
              size === 'lg' || size === 'xl' ? 'text-sm' : 'text-xs'
            }`}
          >
            Di Pietro
          </span>
        </div>
      )}
    </div>
  );
};

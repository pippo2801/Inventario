import React from 'react';
import { Smartphone } from 'lucide-react';

export const SyncStatusBar: React.FC = () => (
  <div
    className="flex items-center gap-3 bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs text-slate-200 shadow-md"
    role="status"
    aria-label="Dati conservati su questo dispositivo"
  >
    <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
    <span className="font-medium">Archivio locale su questo dispositivo</span>
  </div>
);

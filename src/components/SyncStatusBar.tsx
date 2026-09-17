import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { syncWithCloud } from '../services/db';

export const SyncStatusBar: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>(
    localStorage.getItem('lastSyncTime') || 'Mai'
  );

  const handleManualSync = async () => {
    setSyncing(true);
    const result = await syncWithCloud();
    if (result.success && result.time) {
      setLastSync(result.time);
    }
    setSyncing(false);
  };

  useEffect(() => {
    const checkTimer = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 20 && now.getMinutes() === 0) {
        handleManualSync();
      }
    }, 60000);
    return () => clearInterval(checkTimer);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs text-slate-200 shadow-md">
      {/* Indicatore LED verde */}
      <div className="relative flex items-center justify-center">
        {syncing ? (
          <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping absolute" />
        ) : (
          <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
        )}
        <span className={`w-2 h-2 rounded-full ${syncing ? 'bg-amber-400' : 'bg-emerald-500'}`} />
      </div>

      <button
        onClick={handleManualSync}
        disabled={syncing}
        className="flex items-center gap-2 hover:text-teal-400 transition-colors disabled:opacity-50 cursor-pointer"
        title="Tocca per sincronizzare con il cloud"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-teal-400' : 'text-slate-400'}`} />
        <span className="font-medium">
          {syncing ? 'Sincronizzazione...' : `Sync: ${lastSync}`}
        </span>
      </button>
    </div>
  );
};

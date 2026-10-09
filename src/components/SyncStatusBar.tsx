import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { syncWithCloud } from '../services/db';

export const SyncStatusBar: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string>(
    localStorage.getItem('lastSyncTime') || 'Mai'
  );

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const result = await syncWithCloud();
      if (result.success && result.time) {
        setLastSync(result.time);
      } else {
        const reason = result.error instanceof Error
          ? result.error.message
          : 'Controlla la connessione e la configurazione cloud.';
        setSyncError(reason);
      }
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Sincronizzazione non riuscita.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    let lastAutomaticSyncDate = '';
    const checkTimer = setInterval(() => {
      const now = new Date();
      const today = now.toDateString();
      if (
        now.getHours() === 20 &&
        now.getMinutes() === 0 &&
        lastAutomaticSyncDate !== today
      ) {
        lastAutomaticSyncDate = today;
        void handleManualSync();
      }
    }, 60000);
    return () => clearInterval(checkTimer);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs text-slate-200 shadow-md">
      {/* Indicatore LED verde */}
      <div className="relative flex items-center justify-center">
        {syncing && (
          <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping absolute" />
        )}
        <span className={`w-2 h-2 rounded-full ${syncing ? 'bg-amber-400' : syncError ? 'bg-red-500' : 'bg-emerald-500'}`} />
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
      {syncError && (
        <span role="status" className="max-w-64 text-amber-300" title={syncError}>
          Sync non disponibile: {syncError}
        </span>
      )}
    </div>
  );
};

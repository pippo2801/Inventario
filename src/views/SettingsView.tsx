import React, { useState } from 'react';
import { db } from '../services/db';
import {
  Settings,
  Users,
  Smartphone,
  RefreshCw,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Database,
  Sliders,
  History,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const users = db.getUsers();
  const currentUser = db.getCurrentUser();
  const syncStatus = db.getSyncStatus();
  const auditLogs = db.getAuditLogs();

  const [activeTab, setActiveTab] = useState<'users' | 'sync' | 'backup' | 'audit'>('users');
  const [backupSuccessMessage, setBackupSuccessMessage] = useState('');

  const handleExportBackup = () => {
    const backupJson = db.exportBackupData();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studio_ottico_dipietro_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupSuccessMessage('Backup esportato con successo.');
    setTimeout(() => setBackupSuccessMessage(''), 4000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const success = db.importBackupData(json);
        if (success) {
          alert('Dati ripristinati con successo dal file di backup.');
        } else {
          alert('Errore nel formato del file di backup.');
        }
      } catch (err) {
        alert('File di backup non valido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-teal-900/40 border border-teal-800/40 shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Impostazioni & Amministrazione Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-teal-300/80">
            Controllo multi-dispositivo, ruoli Filippo & Mariangela, audit trail e salvataggi
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'border-teal-400 text-teal-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Utenti & Terminali (Sezione 6 & 7)</span>
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'sync'
              ? 'border-teal-400 text-teal-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sincronizzazione (Sezione 40)</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'backup'
              ? 'border-teal-400 text-teal-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Backup & Ripristino (Sezione 41 & 42)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-teal-400 text-teal-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Log / Registro Modifiche (Sezione 32)</span>
        </button>
      </div>

      {/* Tab 1: Utenti & Terminali (Sections 6 & 7) */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-800/60 text-xs text-slate-300">
            <h3 className="font-bold text-white mb-1">Architettura Multi-Dispositivo dello Studio</h3>
            <p>
              Il sistema è configurato per supportare nativamente l'utilizzo contemporaneo da parte di Filippo e Mariangela sui rispettivi smartphone. Le operazioni sono firmate con l'identità dell'operatore e il nome del terminale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((u) => (
              <div
                key={u.id}
                className={`p-4 rounded-2xl bg-slate-900/90 border transition-all ${
                  u.id === currentUser.id
                    ? 'border-teal-500 shadow-lg'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow"
                      style={{ backgroundColor: u.avatarColor }}
                    >
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{u.name}</h4>
                      <p className="text-[11px] text-teal-400 font-medium">{u.role}</p>
                    </div>
                  </div>

                  {u.id === currentUser.id && (
                    <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 font-bold text-[10px] border border-teal-800">
                      Terminale Attivo
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs border-t border-slate-800 pt-2 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Dispositivo associato:</span>
                    <span className="font-mono text-white">{u.deviceName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Permessi di amministrazione:</span>
                    <span className="text-emerald-400 font-semibold">{u.role === 'Amministratore' ? 'Completi' : 'Operatore'}</span>
                  </div>
                </div>

                {u.id !== currentUser.id && (
                  <button
                    onClick={() => db.setCurrentUser(u.id)}
                    className="w-full mt-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold transition-colors"
                  >
                    Passa a questa postazione
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Sincronizzazione (Section 40) */}
      {activeTab === 'sync' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-900/60 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Stato del Canale di Sincronizzazione</h3>
                <p className="text-slate-400 mt-0.5">
                  Algoritmo di risoluzione automatica basato su timestamp ISO (vince la modifica più recente)
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full font-bold text-xs border ${
                  syncStatus.state === 'synced'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : syncStatus.state === 'offline'
                    ? 'bg-rose-950 text-rose-300 border-rose-700'
                    : 'bg-amber-950 text-amber-300 border-amber-700'
                }`}
              >
                {syncStatus.state.toUpperCase()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block">Ultima sincronizzazione completata:</span>
                <span className="font-mono text-white">{new Date(syncStatus.lastSyncTime).toLocaleTimeString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Modifiche in attesa di replica:</span>
                <span className="font-mono text-teal-300">{syncStatus.pendingChanges} operazioni</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => db.triggerSyncSimulation()}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Forza Sincronizzazione Adesso</span>
              </button>

              <button
                onClick={() => db.toggleOfflineMode()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                {syncStatus.state === 'offline' ? 'Disattiva Simulazione Offline' : 'Simula Disconnessione Offline (Sezione 47)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Backup & Ripristino (Section 41 & 42) */}
      {activeTab === 'backup' && (
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-800/60 text-slate-300">
            <h3 className="font-bold text-white mb-1">Regola dei 3 Backup (Sezione 42)</h3>
            <p>
              1. Copia locale sullo smartphone • 2. Copia replicata sul secondo terminale • 3. Esportazione periodica su file JSON esterno/cloud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-900/60 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-teal-400" />
                  <span>Crea Backup Completo Adesso</span>
                </h4>
                <p className="text-slate-400 mt-1">
                  Genera ed esporta un file JSON contenente l'intero inventario, schede clienti, prescrizioni, storico vendite e log di controllo.
                </p>
              </div>

              {backupSuccessMessage && (
                <div className="p-2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                  {backupSuccessMessage}
                </div>
              )}

              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Scarica Backup (.json)</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-900/60 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-teal-400" />
                  <span>Ripristino da File di Backup</span>
                </h4>
                <p className="text-slate-400 mt-1">
                  Ripristina i dati dell'applicazione a partire da un file JSON precedentemente salvato.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-teal-300 hover:file:bg-slate-700"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Log (Section 32) */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Registro Audit Trail Completo ({auditLogs.length} Eventi)</h3>
            <span className="text-[10px] text-teal-400 font-mono">Tracciamento Inalterabile</span>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 divide-y divide-slate-800 max-h-[500px] overflow-y-auto text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-bold text-white">
                    {log.operator} <span className="font-normal text-slate-400">({log.device})</span>
                  </span>
                  <span className="font-mono">{new Date(log.timestamp).toLocaleString('it-IT')}</span>
                </div>
                <p className="text-slate-200 font-medium">{log.details}</p>
                <span className="text-[10px] text-teal-400/90 font-mono mt-0.5 inline-block">
                  Entità: {log.entityType} #{log.entityId.slice(0, 8)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

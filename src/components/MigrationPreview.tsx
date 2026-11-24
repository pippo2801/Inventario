import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardList, RefreshCw } from 'lucide-react';
import { db } from '../services/db';
import { prepareLegacyMigration, type LegacyMigrationSnapshot } from '../services/migrationAdapter';

type PreviewState = {
  counts: Record<keyof LegacyMigrationSnapshot, number>;
  issueCodes: string[];
  blockedByOrganization: boolean;
} | null;

export const MigrationPreview: React.FC = () => {
  const [preview, setPreview] = useState<PreviewState>(null);
  const [error, setError] = useState('');

  const inspectLocalData = () => {
    setError('');
    try {
      // exportBackupData is read-only: no import, persistence or network call occurs here.
      const exported = JSON.parse(db.exportBackupData()) as Partial<LegacyMigrationSnapshot>;
      const snapshot = {
        eyeglasses: exported.eyeglasses,
        clients: exported.clients,
        prescriptions: exported.prescriptions,
        sales: exported.sales,
      } as LegacyMigrationSnapshot;

      // A real organization ID must be assigned by the authenticated backend.
      // Empty ID intentionally keeps this a local integrity preview, never an import-ready plan.
      const result = prepareLegacyMigration('', snapshot);
      setPreview({
        counts: result.counts,
        issueCodes: [...new Set(result.issues.map((issue) => issue.code))],
        blockedByOrganization: true,
      });
    } catch {
      setPreview(null);
      setError('Impossibile leggere il backup locale. Nessun dato è stato modificato.');
    }
  };

  return (
    <section className="rounded-2xl border border-amber-800/50 bg-amber-950/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-amber-300" />
        <h3 className="text-sm font-bold text-white">Anteprima migrazione cloud</h3>
      </div>
      <p className="text-xs text-slate-300">
        Controlla i dati presenti su questo dispositivo. Questa verifica è soltanto locale:
        non carica dati, non attiva Firebase e non modifica il database.
      </p>
      <button
        type="button"
        onClick={inspectLocalData}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Analizza dati locali
      </button>
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      {preview && (
        <div className="space-y-3 border-t border-slate-700 pt-3">
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {([
              ['Occhiali', preview.counts.eyeglasses],
              ['Clienti', preview.counts.clients],
              ['Prescrizioni', preview.counts.prescriptions],
              ['Vendite', preview.counts.sales],
            ] as const).map(([label, count]) => (
              <div key={label} className="rounded-lg bg-slate-900/80 p-2">
                <div className="text-slate-400">{label}</div>
                <div className="mt-1 font-bold tabular-nums text-white">{count}</div>
              </div>
            ))}
          </div>
          {preview.issueCodes.length === 0 ? (
            <div className="flex items-start gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Nessuna anomalia strutturale rilevata nei collegamenti controllati.
            </div>
          ) : (
            <div className="flex items-start gap-2 text-xs text-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Controlli da risolvere: {preview.issueCodes.length}</p>
                <p className="mt-1 text-amber-100/80">{preview.issueCodes.join(', ')}</p>
              </div>
            </div>
          )}
          {preview.blockedByOrganization && (
            <p className="text-xs text-amber-200">
              Migrazione cloud non autorizzabile: manca ancora l'ID organizzazione assegnato dal backend dopo l'accesso autenticato.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

import React from 'react';
import { db } from '../services/db';
import { AlertCircle, CheckCircle2, Clock, Users, FolderArchive } from 'lucide-react';

interface PendingTasksViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const PendingTasksView: React.FC<PendingTasksViewProps> = ({ onNavigate }) => {
  const pendingPrescriptions = db.getPrescriptions(false).filter((p) => p.status === 'DA_VERIFICARE');
  const incompleteClients = db.getClients(false).filter((c) => !c.isComplete);

  const handleMarkPrescriptionComplete = (id: string) => {
    db.updatePrescription(id, { status: 'COMPLETA' });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-950/50 via-slate-900 to-teal-950/40 border border-orange-800/40 shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Da Verificare & Completare
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-orange-200/80">
            Coda attività rimaste in sospeso o posticipate dall'operatore durante il lavoro al banco (Sezione 25)
          </p>
        </div>

        <div className="text-xs bg-slate-950/60 px-4 py-2 rounded-xl border border-orange-700/40">
          <span className="text-[10px] text-slate-400 block">Attività in Attesa:</span>
          <span className="text-lg font-extrabold text-orange-300">
            {pendingPrescriptions.length + incompleteClients.length}
          </span>
        </div>
      </div>

      {/* Pending Prescriptions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-teal-300">
          <FolderArchive className="w-4 h-4" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Prescrizioni Posticipate ({pendingPrescriptions.length})
          </h2>
        </div>

        {pendingPrescriptions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 rounded-xl bg-slate-900/60 border border-slate-800">
            Nessuna prescrizione in sospeso.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingPrescriptions.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-orange-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{p.clientName}</span>
                    <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-300 font-bold text-[10px] border border-orange-800">
                      DA VERIFICARE
                    </span>
                  </div>
                  <p className="text-slate-300 mt-0.5">
                    Data: {new Date(p.date).toLocaleDateString()} • Medico: {p.doctorOrOptometrist}
                  </p>
                  <p className="text-[11px] text-orange-300 mt-1">
                    Nota: {p.notes || 'Ricetta inserita rapidamente, da verificare parametri ottici.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkPrescriptionComplete(p.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 shadow transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approva e Segna Completa</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incomplete Client Profiles */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2 text-teal-300">
          <Users className="w-4 h-4" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Schede Cliente Incomplete ({incompleteClients.length})
          </h2>
        </div>

        {incompleteClients.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 rounded-xl bg-slate-900/60 border border-slate-800">
            Tutte le schede cliente sono complete.
          </div>
        ) : (
          <div className="space-y-2">
            {incompleteClients.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-orange-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{c.firstName} {c.lastName}</span>
                    <span className="font-mono text-[11px] text-teal-300">CF: {c.fiscalCode}</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">
                    Mancano: {!c.phone ? 'Numero di telefono' : ''} {!c.birthDate ? 'Data di nascita' : ''}
                  </p>
                </div>

                <button
                  onClick={() => onNavigate('clients', c.id)}
                  className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-teal-100 font-semibold text-xs transition-colors self-start sm:self-auto"
                >
                  Completa Scheda →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

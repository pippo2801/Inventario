import React, { useState } from 'react';
import { db } from '../services/db';
import { Trash2, RotateCcw, AlertTriangle, Package, Users, FolderArchive } from 'lucide-react';

export const TrashView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'eyeglasses' | 'clients' | 'prescriptions'>('eyeglasses');

  const eyeglassesTrash = db.getEyeglasses(true).filter((e) => e.deletedAt !== null);
  const clientsTrash = db.getClients(true).filter((c) => c.deletedAt !== null);
  const prescriptionsTrash = db.getPrescriptions(true).filter((p) => p.deletedAt !== null);

  const handleRestoreEyeglass = (id: string) => {
    db.restoreEyeglass(id);
  };

  const handlePermanentDelete = (id: string, name: string) => {
    if (window.confirm(`Eliminare definitivamente "${name}"? Questa operazione non è reversibile.`)) {
      db.permanentDeleteEyeglass(id);
    }
  };

  const handleEmptyTrash = () => {
    if (window.confirm('Sei sicuro di voler svuotare definitivamente il cestino? Tutti gli elementi eliminati verranno rimossi permanentemente.')) {
      eyeglassesTrash.forEach((e) => db.permanentDeleteEyeglass(e.id));
    }
  };

  const totalTrashCount = eyeglassesTrash.length + clientsTrash.length + prescriptionsTrash.length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/30 border border-slate-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Cestino & Elementi Eliminati (Soft-Delete)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Gli elementi non vengono persi: puoi ripristinarli in qualunque momento nell'inventario attivo (Sezione 43 & 44)
          </p>
        </div>

        {totalTrashCount > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-semibold transition-colors self-start sm:self-auto flex items-center gap-1.5"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Svuota Cestino</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('eyeglasses')}
          className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'eyeglasses'
              ? 'border-teal-400 text-teal-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Occhiali ({eyeglassesTrash.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'clients'
              ? 'border-teal-400 text-teal-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Clienti ({clientsTrash.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'prescriptions'
              ? 'border-teal-400 text-teal-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderArchive className="w-3.5 h-3.5" />
          <span>Prescrizioni ({prescriptionsTrash.length})</span>
        </button>
      </div>

      {/* Content */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        {activeTab === 'eyeglasses' && (
          <div>
            {eyeglassesTrash.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                Nessun occhiale nel cestino.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {eyeglassesTrash.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-12 h-12 object-cover rounded-lg bg-slate-950 opacity-60"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="font-bold text-slate-200 uppercase">{item.brand} {item.model}</p>
                        <p className="text-[10px] text-slate-400">
                          SKU: {item.sku} • Eliminato il: {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : 'N.D.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestoreEyeglass(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-teal-100 font-semibold text-xs flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Ripristina
                      </button>

                      <button
                        onClick={() => handlePermanentDelete(item.id, `${item.brand} ${item.model}`)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors"
                        title="Elimina Definitivamente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="p-8 text-center text-xs text-slate-400">
            Nessun cliente nel cestino.
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="p-8 text-center text-xs text-slate-400">
            Nessuna prescrizione nel cestino.
          </div>
        )}
      </div>
    </div>
  );
};

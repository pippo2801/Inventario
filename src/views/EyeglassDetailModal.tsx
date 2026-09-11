import React, { useState } from 'react';
import { db } from '../services/db';
import { Eyeglass, Gender, FrameShape, FrameMaterial } from '../types';
import {
  X,
  MapPin,
  Sparkles,
  Tag,
  ShoppingBag,
  Trash2,
  Edit2,
  Check,
  Calendar,
  Barcode,
  Layers,
  DollarSign,
  Clock,
} from 'lucide-react';

interface EyeglassDetailModalProps {
  eyeglass: Eyeglass | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFastSale: (eyeglass: Eyeglass) => void;
}

export const EyeglassDetailModal: React.FC<EyeglassDetailModalProps> = ({
  eyeglass,
  isOpen,
  onClose,
  onOpenFastSale,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Eyeglass>>({});

  if (!isOpen || !eyeglass) return null;

  const handleStartEdit = () => {
    setEditForm({ ...eyeglass });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.brand || !editForm.model || editForm.salePrice === undefined) {
      alert('Inserire Marca, Modello e Prezzo di Vendita.');
      return;
    }

    db.updateEyeglass(eyeglass.id, editForm);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Spostare "${eyeglass.brand} ${eyeglass.model}" nel Cestino?`)) {
      db.softDeleteEyeglass(eyeglass.id);
      onClose();
    }
  };

  const calculateMonths = (isoDate: string) => {
    const diff = new Date().getTime() - new Date(isoDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 30.4));
  };

  const months = calculateMonths(eyeglass.stockDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
      <div
        id="eyeglass-detail-modal"
        className="relative w-full max-w-2xl bg-slate-900 border border-teal-700/60 rounded-2xl shadow-2xl overflow-hidden my-4 text-white flex flex-col max-h-[90vh]"
      >
        {/* Header Bar */}
        <div className="p-4 bg-teal-950/90 border-b border-teal-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-900 text-teal-300 border border-teal-700 uppercase">
              {eyeglass.brand}
            </span>
            <span className="text-sm font-semibold text-white truncate max-w-xs">{eyeglass.model}</span>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                className="px-2.5 py-1.5 rounded-lg bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-700 text-xs flex items-center gap-1 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> Modifica
              </button>
            ) : (
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Salva
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Top visual row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-56 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
              <img
                src={eyeglass.imageUrl}
                alt={eyeglass.model}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {eyeglass.isShowcase && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    ✨ IN VETRINA
                  </span>
                )}
                {eyeglass.isPromo && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    🏷️ IN PROMO
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-2.5">
              {!isEditing ? (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-white">{eyeglass.brand} {eyeglass.model}</h2>
                    <p className="text-xs text-slate-300">Colore: <b className="text-white">{eyeglass.color}</b></p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-teal-900/60 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-teal-300 font-semibold">
                      <MapPin className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      <span>Posizione Fisica nel Negozio:</span>
                    </div>
                    <p className="text-slate-200 font-medium pl-5">{eyeglass.location}</p>
                    {eyeglass.isShowcase && eyeglass.showcasePosition && (
                      <p className="text-amber-300 text-[11px] pl-5">Posto in vetrina: {eyeglass.showcasePosition}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                      Genere: <b>{eyeglass.gender}</b>
                    </span>
                    {eyeglass.shape && (
                      <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                        Forma: <b>{eyeglass.shape}</b>
                      </span>
                    )}
                    {eyeglass.material && (
                      <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                        Materiale: <b>{eyeglass.material}</b>
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block">Marca:</label>
                    <input
                      type="text"
                      value={editForm.brand || ''}
                      onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-teal-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block">Modello:</label>
                    <input
                      type="text"
                      value={editForm.model || ''}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-teal-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block">Colore:</label>
                    <input
                      type="text"
                      value={editForm.color || ''}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-teal-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block">Posizione Fisica:</label>
                    <input
                      type="text"
                      value={editForm.location || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-teal-700 text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Financials (Section 16 & 25) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-teal-900/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Prezzo Vendita (Listino):</span>
              {!isEditing ? (
                <span className="text-base font-extrabold text-emerald-400">€{eyeglass.salePrice.toFixed(2)}</span>
              ) : (
                <input
                  type="number"
                  step="0.5"
                  value={editForm.salePrice || 0}
                  onChange={(e) => setEditForm({ ...editForm, salePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded bg-slate-900 border border-teal-700 text-white"
                />
              )}
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Prezzo Acquisto:</span>
              {!isEditing ? (
                <span className="text-base font-bold text-slate-300">€{eyeglass.purchasePrice.toFixed(2)}</span>
              ) : (
                <input
                  type="number"
                  step="0.5"
                  value={editForm.purchasePrice || 0}
                  onChange={(e) => setEditForm({ ...editForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded bg-slate-900 border border-teal-700 text-white"
                />
              )}
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Margine Lordo Stimato:</span>
              <span className="text-base font-extrabold text-teal-300">
                €{((eyeglass.isPromo && eyeglass.promoPrice ? eyeglass.promoPrice : eyeglass.salePrice) - eyeglass.purchasePrice).toFixed(2)}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Anzianità Stock:</span>
              <span className={`text-base font-bold ${months >= 12 ? 'text-orange-400' : 'text-slate-300'}`}>
                {months} {months === 1 ? 'Mese' : 'Mesi'}
              </span>
            </div>
          </div>

          {/* Showcase & Promotion Toggles */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Esposizione e Offerte</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Esposto in Vetrina</p>
                    <p className="text-[10px] text-slate-400">Visibile nel conteggio vetrina</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isEditing ? !!editForm.isShowcase : eyeglass.isShowcase}
                  onChange={(e) => {
                    if (isEditing) {
                      setEditForm({ ...editForm, isShowcase: e.target.checked });
                    } else {
                      db.updateEyeglass(eyeglass.id, { isShowcase: e.target.checked });
                    }
                  }}
                  className="w-4 h-4 text-teal-600 rounded bg-slate-950 border-slate-700 focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-rose-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Promozione Attiva</p>
                    <p className="text-[10px] text-slate-400">
                      {eyeglass.promoPrice ? `Prezzo promo: €${eyeglass.promoPrice.toFixed(2)}` : 'Nessun prezzo scontato'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isEditing ? !!editForm.isPromo : eyeglass.isPromo}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (isEditing) {
                      setEditForm({
                        ...editForm,
                        isPromo: checked,
                        promoPrice: checked ? (editForm.promoPrice || (editForm.salePrice ? editForm.salePrice * 0.8 : 0)) : undefined,
                      });
                    } else {
                      db.updateEyeglass(eyeglass.id, {
                        isPromo: checked,
                        promoPrice: checked ? (eyeglass.promoPrice || eyeglass.salePrice * 0.8) : undefined,
                      });
                    }
                  }}
                  className="w-4 h-4 text-teal-600 rounded bg-slate-950 border-slate-700 focus:ring-teal-500"
                />
              </label>
            </div>
          </div>

          {/* Technical Data & Codes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Codice Interno / SKU:</span>
              <span className="font-mono text-teal-300 font-bold">{eyeglass.sku}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Codice Fornitore:</span>
              <span className="font-mono text-slate-300">{eyeglass.supplierCode || 'N.D.'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Data Carico:</span>
              <span className="text-slate-300">{new Date(eyeglass.stockDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-teal-950/80 border-t border-teal-800/60 flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Cestino
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Chiudi
            </button>
            {eyeglass.status === 'Disponibile' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFastSale(eyeglass);
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" /> Avvia Vendita
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

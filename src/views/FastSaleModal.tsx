import React, { useState } from 'react';
import { db } from '../services/db';
import { Eyeglass, Client, PaymentMethod } from '../types';
import {
  ShoppingBag,
  X,
  User,
  Search,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  Building,
  Tag,
  MapPin,
} from 'lucide-react';

interface FastSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedEyeglass?: Eyeglass | null;
  onSaleSuccess: () => void;
}

export const FastSaleModal: React.FC<FastSaleModalProps> = ({
  isOpen,
  onClose,
  preselectedEyeglass,
  onSaleSuccess,
}) => {
  const currentUser = db.getCurrentUser();
  const eyeglasses = db.getEyeglasses(false).filter((e) => e.status === 'Disponibile');
  const clients = db.getClients(false);

  const [selectedEyeglass, setSelectedEyeglass] = useState<Eyeglass | null>(preselectedEyeglass || null);
  const [eyeglassSearch, setEyeglassSearch] = useState('');

  const [clientType, setClientType] = useState<'banco' | 'existing'>('banco');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');

  // Pricing
  const [salePrice, setSalePrice] = useState<number>(
    preselectedEyeglass
      ? (preselectedEyeglass.isPromo && preselectedEyeglass.promoPrice ? preselectedEyeglass.promoPrice : preselectedEyeglass.salePrice)
      : 0
  );
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Carta');
  const [receiptReference, setReceiptReference] = useState('');
  const [notes, setNotes] = useState('');

  // Confirmation modal step
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (!isOpen) return null;

  const handleSelectEyeglass = (item: Eyeglass) => {
    setSelectedEyeglass(item);
    const initialPrice = item.isPromo && item.promoPrice ? item.promoPrice : item.salePrice;
    setSalePrice(initialPrice);
    setDiscountPercent(0);
  };

  const handleApplyDiscount = (percent: number) => {
    if (!selectedEyeglass) return;
    const base = selectedEyeglass.isPromo && selectedEyeglass.promoPrice ? selectedEyeglass.promoPrice : selectedEyeglass.salePrice;
    setDiscountPercent(percent);
    setSalePrice(Math.round(base * (1 - percent / 100) * 100) / 100);
  };

  const handleConfirmSale = () => {
    if (!selectedEyeglass) return;

    db.createSale({
      eyeglassId: selectedEyeglass.id,
      eyeglassBrand: selectedEyeglass.brand,
      eyeglassModel: selectedEyeglass.model,
      clientId: clientType === 'existing' && selectedClient ? selectedClient.id : undefined,
      clientName: clientType === 'existing' && selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : 'Cliente al Banco',
      salePrice: salePrice,
      purchasePrice: selectedEyeglass.purchasePrice,
      discountApplied: discountPercent > 0 ? (selectedEyeglass.salePrice - salePrice) : undefined,
      paymentMethod: paymentMethod,
      operatorName: currentUser.name,
      deviceId: currentUser.deviceName,
      receiptReference: receiptReference.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setShowConfirmDialog(false);
    onSaleSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md">
      <div
        id="fast-sale-modal"
        className="relative w-full max-w-xl bg-slate-900 border border-teal-700/60 rounded-2xl shadow-2xl overflow-hidden my-4 text-white flex flex-col max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="p-4 bg-teal-950/90 border-b border-teal-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-900/60 text-emerald-300 border border-emerald-700/40">
              <ShoppingBag className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Nuova Vendita Rapida
              </h2>
              <p className="text-xs text-teal-300/80">
                Operatore: <b>{currentUser.name}</b> ({currentUser.deviceName})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Step 1: Occhiale */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
              1. Occhiale da vendere
            </label>

            {!selectedEyeglass ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-teal-400" />
                  <input
                    type="text"
                    value={eyeglassSearch}
                    onChange={(e) => setEyeglassSearch(e.target.value)}
                    placeholder="Cerca per marca, modello, SKU..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-teal-700/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/50">
                  {eyeglasses
                    .filter((e) =>
                      `${e.brand} ${e.model} ${e.sku}`.toLowerCase().includes(eyeglassSearch.toLowerCase())
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectEyeglass(item)}
                        className="p-2.5 flex items-center justify-between hover:bg-teal-950/50 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-10 h-10 object-cover rounded bg-slate-900"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="font-bold text-white uppercase">{item.brand} {item.model}</p>
                            <p className="text-[10px] text-slate-400">{item.color} - {item.location}</p>
                          </div>
                        </div>
                        <span className="font-bold text-emerald-400">
                          €{(item.isPromo && item.promoPrice ? item.promoPrice : item.salePrice).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-teal-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedEyeglass.imageUrl}
                    alt=""
                    className="w-12 h-12 object-cover rounded-lg bg-slate-900"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white uppercase">{selectedEyeglass.brand}</span>
                      <span className="text-[10px] font-mono px-1 rounded bg-teal-950 text-teal-300">
                        {selectedEyeglass.sku}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200">{selectedEyeglass.model} - {selectedEyeglass.color}</p>
                    <p className="text-[10px] text-teal-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {selectedEyeglass.location}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedEyeglass(null)}
                  className="text-xs text-teal-400 hover:underline px-2 py-1"
                >
                  Cambia
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Cliente */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                2. Intestazione Cliente
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setClientType('banco');
                    setSelectedClient(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    clientType === 'banco'
                      ? 'bg-teal-700 text-white border-teal-600'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800'
                  }`}
                >
                  Cliente al Banco
                </button>
                <button
                  type="button"
                  onClick={() => setClientType('existing')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    clientType === 'existing'
                      ? 'bg-teal-700 text-white border-teal-600'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800'
                  }`}
                >
                  Dall'Archivio
                </button>
              </div>
            </div>

            {clientType === 'existing' && (
              <div className="space-y-2">
                {!selectedClient ? (
                  <>
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Cerca cliente per nome o CF..."
                      className="w-full px-3 py-2 bg-slate-950/80 border border-teal-700/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
                    />
                    <div className="max-h-32 overflow-y-auto divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/50">
                      {clients
                        .filter((c) =>
                          `${c.firstName} ${c.lastName} ${c.fiscalCode}`.toLowerCase().includes(clientSearch.toLowerCase())
                        )
                        .map((c) => (
                          <div
                            key={c.id}
                            onClick={() => setSelectedClient(c)}
                            className="p-2 flex items-center justify-between hover:bg-teal-950/50 cursor-pointer text-xs"
                          >
                            <span className="font-semibold text-white">{c.firstName} {c.lastName}</span>
                            <span className="font-mono text-[10px] text-slate-400">{c.fiscalCode}</span>
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-teal-700/40 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{selectedClient.firstName} {selectedClient.lastName}</p>
                      <p className="text-[10px] font-mono text-teal-300">CF: {selectedClient.fiscalCode}</p>
                    </div>
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="text-teal-400 hover:underline text-xs"
                    >
                      Cambia
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Prezzo Finale & Sconto Rapido */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
              3. Prezzo Finale di Vendita (€)
            </label>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">€</span>
                <input
                  type="number"
                  step="0.5"
                  value={salePrice}
                  onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-950/80 border border-teal-700/40 rounded-xl text-lg font-bold text-emerald-400 focus:outline-none"
                />
              </div>

              {/* Sconto rapido */}
              <div className="flex gap-1">
                {[5, 10, 15, 20].map((perc) => (
                  <button
                    key={perc}
                    type="button"
                    onClick={() => handleApplyDiscount(perc)}
                    className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-teal-800 text-teal-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    -{perc}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 4: Metodo di Pagamento */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
              4. Metodo di Pagamento
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {(['Carta', 'Contanti', 'Bonifico', 'Altro'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 font-semibold transition-all ${
                    paymentMethod === method
                      ? 'bg-teal-600 text-white border-teal-500 shadow'
                      : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {method === 'Carta' && <CreditCard className="w-4 h-4" />}
                  {method === 'Contanti' && <Banknote className="w-4 h-4" />}
                  {method === 'Bonifico' && <Building className="w-4 h-4" />}
                  {method === 'Altro' && <Tag className="w-4 h-4" />}
                  <span>{method}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 5: Scontrino / Note (Opzionali) */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Rif. Scontrino / POS:</label>
              <input
                type="text"
                value={receiptReference}
                onChange={(e) => setReceiptReference(e.target.value)}
                placeholder="Es. Scontrino #104"
                className="w-full px-2.5 py-1.5 bg-slate-950/80 border border-teal-700/40 rounded-lg text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Note vendita:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opzionali..."
                className="w-full px-2.5 py-1.5 bg-slate-950/80 border border-teal-700/40 rounded-lg text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-teal-950/80 border-t border-teal-800/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Annulla
          </button>

          <button
            id="btn-confirm-sale-step1"
            disabled={!selectedEyeglass || salePrice <= 0}
            onClick={() => setShowConfirmDialog(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Procedi alla Conferma (€{salePrice.toFixed(2)})</span>
          </button>
        </div>

        {/* Confirmation Dialog (Section 31: CONFERMA OPERAZIONE CRITICA) */}
        {showConfirmDialog && selectedEyeglass && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-emerald-600/60 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                <h3 className="text-base font-bold text-white">Confermi la Registrazione Vendita?</h3>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                <p><b>Articolo:</b> {selectedEyeglass.brand} {selectedEyeglass.model}</p>
                <p><b>Importo Incassato:</b> <span className="text-emerald-400 font-bold">€{salePrice.toFixed(2)}</span></p>
                <p><b>Pagamento:</b> {paymentMethod}</p>
                <p><b>Intestatario:</b> {clientType === 'existing' && selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : 'Cliente al Banco'}</p>
                <p><b>Operatore & Terminale:</b> {currentUser.name} ({currentUser.deviceName})</p>
              </div>

              <p className="text-[11px] text-slate-400">
                L'occhiale verrà marcato come <b>Venduto</b> e la vendita sarà immediatamente sincronizzata su tutti gli smartphone dello studio.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Modifica
                </button>
                <button
                  id="btn-final-confirm-sale"
                  onClick={handleConfirmSale}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
                >
                  Conferma e Sincronizza
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

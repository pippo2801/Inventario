import React from 'react';
import { db } from '../services/db';
import { History, Smartphone, CreditCard, Banknote, Building, Tag, ArrowUpRight } from 'lucide-react';

export const SalesHistoryView: React.FC = () => {
  const sales = db.getSales(false);

  const totalRevenue = sales.reduce((acc, s) => acc + (s.finalPrice ?? s.salePrice ?? 0), 0);
  const totalMargin = sales.reduce((acc, s) => acc + (s.estimatedGrossMargin ?? 0), 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-emerald-950/40 border border-teal-800/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Registro Vendite & Transazioni
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-teal-300/80">
            Storico completo vendite registrate in tempo reale sui terminali dello studio
          </p>
        </div>

        <div className="flex gap-3 text-xs bg-slate-950/60 px-4 py-2 rounded-xl border border-teal-700/40 self-start sm:self-auto">
          <div>
            <span className="text-[10px] text-slate-400 block">Totale Incassato:</span>
            <span className="text-lg font-extrabold text-emerald-400">€{totalRevenue.toFixed(2)}</span>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <span className="text-[10px] text-slate-400 block">Margine Lordo Totale:</span>
            <span className="text-lg font-extrabold text-teal-300">€{totalMargin.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="rounded-2xl bg-slate-900/80 border border-teal-900/60 overflow-hidden">
        {sales.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Nessuna vendita registrata finora.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {sales.map((sale) => {
              const effectivePrice = sale.finalPrice ?? sale.salePrice ?? 0;
              const margin = sale.estimatedGrossMargin ?? (effectivePrice - sale.productPurchasePrice);

              return (
                <div key={sale.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-teal-950/20 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white uppercase text-sm">
                        {sale.productDescription || `${sale.eyeglassBrand || ''} ${sale.eyeglassModel || ''}`}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 font-mono text-[10px] border border-teal-800">
                        {sale.paymentMethod}
                      </span>
                    </div>

                    <p className="text-slate-300">
                      Cliente: <b className="text-white">{sale.clientName || 'Cliente al banco'}</b>
                      {sale.receiptReference && ` • Rif: ${sale.receiptReference}`}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-teal-400" />
                        {sale.operatorName} {sale.deviceId ? `(${sale.deviceId})` : ''}
                      </span>
                      <span>•</span>
                      <span>{new Date(sale.createdAt || sale.date).toLocaleString('it-IT')}</span>
                    </div>
                  </div>

                  <div className="text-right sm:self-center">
                    <span className="text-base font-extrabold text-emerald-400 block">
                      €{effectivePrice.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-teal-300">
                      Margine: +€{margin.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

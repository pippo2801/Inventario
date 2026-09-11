import React, { useState } from 'react';
import { db } from '../services/db';
import {
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Tag,
  Clock,
  PieChart,
  Eye,
} from 'lucide-react';

export const StatisticsView: React.FC = () => {
  const stats = db.getInventoryStatistics();
  const salesStats = db.getSalesStatistics();
  const eyeglasses = db.getEyeglasses(false).filter((e) => e.status === 'Disponibile');

  // Gender Breakdown
  const menCount = eyeglasses.filter((e) => e.gender === 'Uomo').length;
  const womenCount = eyeglasses.filter((e) => e.gender === 'Donna').length;
  const unisexCount = eyeglasses.filter((e) => e.gender === 'Unisex').length;
  const totalEyeglasses = eyeglasses.length || 1;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-teal-900/40 border border-teal-800/40 shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Statistiche & Totali Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-teal-300/80">
            Valutazione economica dello stock, margine lordo realizzato e indicatori di rotazione (Sezione 33 & 34)
          </p>
        </div>
      </div>

      {/* Primary KPI Grid: Stock Valuation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-900/60 shadow space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">Totale Pezzi Disponibili</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">{stats.totalPieces}</p>
          <span className="text-[10px] text-teal-400 block">In inventario attivo</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-900/60 shadow space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">Valore Stock (Acquisto)</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-200">
            €{stats.totalPurchaseValue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400 block">Costo sostenuto a carico</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-900/60 shadow space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">Valore Stock (Listino Vendita)</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            €{stats.totalRetailValue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-300/80 block">Ricavo potenziale lordo</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-900/60 shadow space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">Margine Lordo Stimato Stock</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-teal-300">
            €{stats.estimatedGrossMarginStock.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-teal-400 block">Plusvalenza potenziale</span>
        </div>
      </div>

      {/* Sales Performance Grid */}
      <div className="rounded-2xl bg-slate-900/80 border border-teal-800/40 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Riepilogo Vendite nel Tempo</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Oggi:</span>
            <p className="text-lg font-bold text-white">{salesStats.todayPieces} Pezzi</p>
            <p className="text-xs font-semibold text-emerald-400">€{salesStats.todayRevenue.toFixed(2)}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Questa Settimana:</span>
            <p className="text-lg font-bold text-white">{salesStats.weekPieces} Pezzi</p>
            <p className="text-xs font-semibold text-emerald-400">€{salesStats.weekRevenue.toFixed(2)}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Questo Mese:</span>
            <p className="text-lg font-bold text-white">{salesStats.monthPieces} Pezzi</p>
            <p className="text-xs font-semibold text-emerald-400">€{salesStats.monthRevenue.toFixed(2)}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Quest'Anno (Totale):</span>
            <p className="text-lg font-bold text-white">{salesStats.yearPieces} Pezzi</p>
            <p className="text-xs font-semibold text-emerald-400">€{salesStats.yearRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Top brand & Top model */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-800 text-xs">
            <span className="text-[10px] text-slate-400 block">Brand Più Venduto:</span>
            <p className="text-base font-extrabold text-teal-300 uppercase">{salesStats.topBrand}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-800 text-xs">
            <span className="text-[10px] text-slate-400 block">Modello Più Venduto:</span>
            <p className="text-base font-extrabold text-white">{salesStats.topModel}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs">
            <span className="text-[10px] text-slate-400 block">Margine Lordo Totale Incassato:</span>
            <p className="text-base font-extrabold text-emerald-400">€{salesStats.totalGrossMarginRealized.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender Ratio */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-teal-800/40 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-teal-400" />
            <span>Rapporto Genere Montature in Stock</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Uomo ({menCount} pezzi)</span>
                <span className="font-mono text-teal-300">{Math.round((menCount / totalEyeglasses) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(menCount / totalEyeglasses) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Donna ({womenCount} pezzi)</span>
                <span className="font-mono text-teal-300">{Math.round((womenCount / totalEyeglasses) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${(womenCount / totalEyeglasses) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Unisex ({unisexCount} pezzi)</span>
                <span className="font-mono text-teal-300">{Math.round((unisexCount / totalEyeglasses) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${(unisexCount / totalEyeglasses) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Focus Areas & Alerts */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-teal-800/40 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Indicatori di Rotazione & Allarmi Stock</span>
          </h3>

          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center justify-between">
              <div>
                <p className="font-bold text-amber-300">Stock Fermo &gt; 12 Mesi</p>
                <p className="text-[10px] text-slate-400">Modelli a rotazione critica</p>
              </div>
              <span className="text-base font-extrabold text-amber-400">{stats.stagnant12MonthsCount} Pezzi</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Stock Fermo &gt; 6 Mesi</p>
                <p className="text-[10px] text-slate-400">Modelli da valutare per promozione</p>
              </div>
              <span className="text-base font-bold text-slate-300">{stats.stagnant6MonthsCount} Pezzi</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-amber-300">In Vetrina</p>
                <p className="text-[10px] text-slate-400">Valore esposto: €{stats.showcaseRetailValue.toFixed(2)}</p>
              </div>
              <span className="text-base font-bold text-amber-400">{stats.showcasePieces} Pezzi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

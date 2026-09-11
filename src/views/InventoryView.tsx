import React, { useState, useMemo } from 'react';
import { db } from '../services/db';
import { Eyeglass, Gender } from '../types';
import {
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Sparkles,
  Tag,
  ShoppingBag,
  Trash2,
  Edit2,
  Clock,
  ArrowUpDown,
  Check,
  ChevronDown,
} from 'lucide-react';

interface InventoryViewProps {
  onSelectEyeglass: (eyeglass: Eyeglass) => void;
  onOpenFastSale: (eyeglass: Eyeglass) => void;
  onOpenAddProduct: () => void;
  initialGenderFilter?: Gender;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onSelectEyeglass,
  onOpenFastSale,
  onOpenAddProduct,
  initialGenderFilter,
}) => {
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('Tutti');
  const [selectedGender, setSelectedGender] = useState<string>(initialGenderFilter || 'Tutti');
  const [filterShowcase, setFilterShowcase] = useState(false);
  const [filterPromo, setFilterPromo] = useState(false);
  const [filterStagnant, setFilterStagnant] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'price_asc' | 'price_desc' | 'brand' | 'aging'>('date');

  const eyeglasses = db.getEyeglasses(false);

  // Extract distinct brands
  const brands = useMemo(() => {
    const set = new Set<string>();
    eyeglasses.forEach((e) => set.add(e.brand));
    return ['Tutti', ...Array.from(set).sort()];
  }, [eyeglasses]);

  // Filtering & sorting
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    const now = new Date().getTime();

    return eyeglasses
      .filter((item) => {
        // Only available in this view
        if (item.status !== 'Disponibile') return false;

        // Search text
        if (
          search &&
          !item.brand.toLowerCase().includes(q) &&
          !item.model.toLowerCase().includes(q) &&
          !item.sku.toLowerCase().includes(q) &&
          !item.supplierCode.toLowerCase().includes(q) &&
          !item.color.toLowerCase().includes(q) &&
          !item.location.toLowerCase().includes(q)
        ) {
          return false;
        }

        // Brand filter
        if (selectedBrand !== 'Tutti' && item.brand !== selectedBrand) {
          return false;
        }

        // Gender filter
        if (selectedGender !== 'Tutti' && item.gender !== selectedGender) {
          return false;
        }

        // Showcase filter
        if (filterShowcase && !item.isShowcase) return false;

        // Promo filter
        if (filterPromo && !item.isPromo) return false;

        // Stagnant filter (> 6 mesi)
        if (filterStagnant) {
          const months = (now - new Date(item.stockDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4);
          if (months < 6) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') {
          const pA = a.isPromo && a.promoPrice ? a.promoPrice : a.salePrice;
          const pB = b.isPromo && b.promoPrice ? b.promoPrice : b.salePrice;
          return pA - pB;
        }
        if (sortBy === 'price_desc') {
          const pA = a.isPromo && a.promoPrice ? a.promoPrice : a.salePrice;
          const pB = b.isPromo && b.promoPrice ? b.promoPrice : b.salePrice;
          return pB - pA;
        }
        if (sortBy === 'brand') return a.brand.localeCompare(b.brand);
        if (sortBy === 'aging') return new Date(a.stockDate).getTime() - new Date(b.stockDate).getTime();
        // default 'date' new first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [eyeglasses, search, selectedBrand, selectedGender, filterShowcase, filterPromo, filterStagnant, sortBy]);

  const handleToggleShowcase = (e: React.MouseEvent, item: Eyeglass) => {
    e.stopPropagation();
    db.updateEyeglass(item.id, {
      isShowcase: !item.isShowcase,
      showcasePosition: !item.isShowcase ? 'Vetrina Ingresso - Ripiano' : undefined,
    });
  };

  const handleDelete = (e: React.MouseEvent, item: Eyeglass) => {
    e.stopPropagation();
    if (window.confirm(`Spostare "${item.brand} ${item.model}" nel Cestino?`)) {
      db.softDeleteEyeglass(item.id);
    }
  };

  const calculateMonths = (isoDate: string) => {
    const diff = new Date().getTime() - new Date(isoDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 30.4));
  };

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Inventario Occhiali Disponibili
          </h1>
          <p className="text-xs sm:text-sm text-teal-300/80">
            {filteredItems.length} di {eyeglasses.filter((e) => e.status === 'Disponibile').length} occhiali pronti per la vendita
          </p>
        </div>

        <button
          id="btn-inventory-add"
          onClick={onOpenAddProduct}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Aggiungi Nuovo Occhiale</span>
        </button>
      </div>

      {/* Search & Filter Bar (Section 52) */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-teal-800/40 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-teal-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtra per marca, modello, SKU, colore o posizione..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-teal-700/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          {/* Brand select */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-2.5 bg-slate-950/80 border border-teal-700/40 rounded-xl text-xs text-white focus:outline-none"
          >
            {brands.map((b) => (
              <option key={b} value={b}>
                Brand: {b}
              </option>
            ))}
          </select>

          {/* Gender select */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="px-3 py-2.5 bg-slate-950/80 border border-teal-700/40 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="Tutti">Genere: Tutti</option>
            <option value="Uomo">Uomo</option>
            <option value="Donna">Donna</option>
            <option value="Unisex">Unisex</option>
          </select>

          {/* Sort By (Section 82) */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-950/80 border border-teal-700/40 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="date">Ordina: Più recenti</option>
            <option value="price_asc">Prezzo: Crescente</option>
            <option value="price_desc">Prezzo: Decrescente</option>
            <option value="brand">Marca: A - Z</option>
            <option value="aging">Anzianità stock (più fermi)</option>
          </select>
        </div>

        {/* Quick Filter Toggles */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setFilterShowcase(!filterShowcase)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              filterShowcase
                ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Solo Vetrina</span>
          </button>

          <button
            onClick={() => setFilterPromo(!filterPromo)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              filterPromo
                ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Solo Promo</span>
          </button>

          <button
            onClick={() => setFilterStagnant(!filterStagnant)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              filterStagnant
                ? 'bg-orange-500/20 text-orange-300 border-orange-500'
                : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Stock Fermo (&gt; 6 Mesi)</span>
          </button>

          {(search || selectedBrand !== 'Tutti' || selectedGender !== 'Tutti' || filterShowcase || filterPromo || filterStagnant) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedBrand('Tutti');
                setSelectedGender('Tutti');
                setFilterShowcase(false);
                setFilterPromo(false);
                setFilterStagnant(false);
              }}
              className="text-xs text-teal-400 hover:underline ml-auto"
            >
              Azzera filtri
            </button>
          )}
        </div>
      </div>

      {/* Eyeglasses Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-teal-900/40 text-slate-400 space-y-2">
          <p className="text-base font-semibold text-slate-300">Nessun occhiale trovato con i criteri selezionati.</p>
          <p className="text-xs">Prova ad azzerare i filtri di ricerca o verifica l'ortografia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const months = calculateMonths(item.stockDate);
            const isStagnant12 = months >= 12;
            const isStagnant6 = months >= 6;

            return (
              <div
                key={item.id}
                onClick={() => onSelectEyeglass(item)}
                className="rounded-2xl bg-slate-900/90 border border-teal-900/60 hover:border-teal-500/60 transition-all p-4 flex flex-col justify-between cursor-pointer shadow-md group"
              >
                {/* Image & Main Info */}
                <div>
                  <div className="relative mb-3 aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img
                      src={item.imageUrl}
                      alt={`${item.brand} ${item.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {/* Status Badges Combination (Section 17: Supporta combinazioni!) */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {item.isShowcase && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow">
                          ✨ VETRINA
                        </span>
                      )}
                      {item.isPromo && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow">
                          🏷️ PROMO
                        </span>
                      )}
                      {isStagnant12 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-600 text-white shadow">
                          ⏳ FERMO &gt; 12m
                        </span>
                      )}
                      {!isStagnant12 && isStagnant6 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white shadow">
                          ⏳ FERMO &gt; 6m
                        </span>
                      )}
                    </div>

                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm text-[10px] font-mono text-teal-300 border border-teal-800">
                      SKU: {item.sku}
                    </span>
                  </div>

                  {/* Brand & Model */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-teal-400 uppercase tracking-wider">
                        {item.brand}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.gender}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-teal-200 transition-colors">
                      {item.model}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-1">{item.color}</p>

                    {/* Physical Location (Section 18: "Dove si trova?") */}
                    <div className="flex items-center gap-1 text-xs text-teal-300 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                      <span className="truncate font-medium">{item.location}</span>
                    </div>
                  </div>
                </div>

                {/* Price & Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    {item.isPromo && item.promoPrice ? (
                      <div>
                        <span className="text-base font-extrabold text-rose-400">
                          €{item.promoPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400 line-through ml-1.5">
                          €{item.salePrice.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-extrabold text-emerald-400">
                        €{item.salePrice.toFixed(2)}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 block">
                      Acquisto: €{item.purchasePrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Fast Sale Button (Section 30) */}
                    <button
                      title="Avvia vendita rapida per questo occhiale"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFastSale(item);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1 shadow transition-all active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Vendi</span>
                    </button>

                    {/* Vetrina quick toggle */}
                    <button
                      title={item.isShowcase ? 'Rimuovi dalla Vetrina' : 'Espone in Vetrina'}
                      onClick={(e) => handleToggleShowcase(e, item)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        item.isShowcase
                          ? 'bg-amber-500/20 text-amber-300 border-amber-600'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>

                    {/* Soft Delete to Trash (Section 43) */}
                    <button
                      title="Sposta nel Cestino"
                      onClick={(e) => handleDelete(e, item)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

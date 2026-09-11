import React, { useState, useRef } from 'react';
import { db } from '../services/db';
import { aiService } from '../services/aiService';
import { Eyeglass, Gender, FrameShape, FrameMaterial } from '../types';
import {
  PlusCircle,
  X,
  Camera,
  Barcode,
  Sparkles,
  Check,
  MapPin,
  Upload,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (eyeglass: Eyeglass) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAdded,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80'
  );
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [gender, setGender] = useState<Gender>('Unisex');
  const [purchasePrice, setPurchasePrice] = useState<number>(65);
  const [salePrice, setSalePrice] = useState<number>(149);
  const [location, setLocation] = useState('Espositore Centrale - Ripiano A');
  const [sku, setSku] = useState(`OPT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [supplierCode, setSupplierCode] = useState('');
  const [shape, setShape] = useState<FrameShape>('Rettangolare');
  const [material, setMaterial] = useState<FrameMaterial>('Acetato');
  const [isShowcase, setIsShowcase] = useState(false);
  const [isPromo, setIsPromo] = useState(false);
  const [promoPrice, setPromoPrice] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');

  // AI assistant state
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestionsReceived, setAiSuggestionsReceived] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPhotoUrl(base64);

      // Trigger AI Assistant for suggestions (Section 26)
      setAiAnalyzing(true);
      try {
        const result = await aiService.visualSearchEyeglass(base64);
        if (result.analysis) {
          if (result.analysis.detectedBrand) setBrand(result.analysis.detectedBrand);
          if (result.analysis.shape) setShape(result.analysis.shape as FrameShape);
          if (result.analysis.color) setColor(result.analysis.color);
          if (result.analysis.frameType) setMaterial(result.analysis.frameType as FrameMaterial);
          setAiSuggestionsReceived(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAiAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!brand.trim() || !model.trim() || !location.trim()) {
      alert('I campi Marca, Modello e Posizione Fisica sono obbligatori.');
      return;
    }

    const newEyeglass = db.createEyeglass({
      sku: sku.trim() || `SKU-${Date.now()}`,
      supplierCode: supplierCode.trim() || undefined,
      brand: brand.trim(),
      model: model.trim(),
      color: color.trim() || 'Nero / Standard',
      gender: gender,
      shape: shape,
      material: material,
      purchasePrice: purchasePrice,
      salePrice: salePrice,
      isPromo: isPromo,
      promoPrice: isPromo ? (promoPrice || salePrice * 0.8) : undefined,
      isShowcase: isShowcase,
      showcasePosition: isShowcase ? 'Vetrina Ingresso - Spazio 1' : undefined,
      location: location.trim(),
      stockDate: new Date().toISOString(),
      imageUrl: photoUrl,
      notes: notes.trim() || undefined,
    });

    onAdded(newEyeglass);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md">
      <div
        id="add-product-modal"
        className="relative w-full max-w-2xl bg-slate-900 border border-teal-700/60 rounded-2xl shadow-2xl overflow-hidden my-4 text-white flex flex-col max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="p-4 bg-teal-950/90 border-b border-teal-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-800/60 text-teal-300 border border-teal-600/40">
              <PlusCircle className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Aggiungi Nuovo Occhiale
              </h2>
              <p className="text-xs text-teal-300/80">
                Compila la scheda per caricare l'articolo nell'inventario dello studio
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Section 26 & 27: Photo & AI Assistant Banner */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-48 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-slate-950 border border-teal-800/60 flex-shrink-0 flex items-center justify-center group">
              <img
                src={photoUrl}
                alt="Anteprima"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity text-white"
              >
                <Camera className="w-6 h-6 text-teal-300" />
                <span className="text-[11px] font-semibold">Cambia Foto</span>
              </button>
            </div>

            <div className="flex-1 space-y-2">
              <div className="p-3 rounded-xl bg-teal-950/50 border border-teal-800/60">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-teal-300 font-bold">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>Assistente IA di Compilazione (Sezione 26)</span>
                  </div>
                  {aiAnalyzing && <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Caricando la foto, l'IA analizza forma, finitura e marchio.
                  <b className="text-amber-300 block mt-0.5">
                    Regola Sezione 27: Approvazione umana obbligatoria. Verifica sempre i dati prima di salvare.
                  </b>
                </p>
                {aiSuggestionsReceived && (
                  <div className="mt-2 text-[10px] text-emerald-300 bg-emerald-950/60 p-1.5 rounded border border-emerald-800 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Campi precompilati dall'analisi visiva. Puoi modificarli liberamente.</span>
                  </div>
                )}
              </div>

              {/* Barcode scanner shortcut (Section 28) */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-2 text-[10px] text-slate-500 font-mono">SKU:</span>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full pl-12 pr-3 py-1.5 rounded-lg bg-slate-950 border border-teal-800/60 text-teal-300 font-mono text-xs focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSku(`OPT-${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                >
                  <Barcode className="w-3.5 h-3.5" /> Genera SKU
                </button>
              </div>
            </div>
          </div>

          {/* Form Fields: Marca, Modello, Colore */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Marca / Brand <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Es. Ray-Ban, Persol..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-700/50 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Modello <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Es. RB3025 Aviator"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-700/50 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Colore / Finitura</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Es. Oro / Lenti G-15"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-700/50 text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Physical Location (Section 18: "Dove si trova?") */}
          <div>
            <label className="text-[11px] font-semibold text-teal-300 flex items-center gap-1 mb-1">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>Posizione Fisica nel Negozio <span className="text-rose-400">*</span> (Sezione 18)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Es. Vetrina 1 - Ripiano A, oppure Magazzino - Cassetto 3"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-700/50 text-white focus:outline-none font-medium"
            />
          </div>

          {/* Category: Genere, Forma, Materiale */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Genere</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-700/50 text-white focus:outline-none"
              >
                <option value="Unisex">Unisex</option>
                <option value="Uomo">Uomo</option>
                <option value="Donna">Donna</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Forma Montatura</label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as FrameShape)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-700/50 text-white focus:outline-none"
              >
                <option value="Aviator">Aviator / Goccia</option>
                <option value="Rettangolare">Rettangolare</option>
                <option value="Rotondo">Rotondo</option>
                <option value="Squadrato">Squadrato</option>
                <option value="Cat-eye">Cat-eye</option>
                <option value="Pantografo">Pantografo</option>
                <option value="Browline">Browline</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Materiale</label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value as FrameMaterial)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-700/50 text-white focus:outline-none"
              >
                <option value="Metallo">Metallo</option>
                <option value="Acetato">Acetato</option>
                <option value="Titanio">Titanio</option>
                <option value="Misto">Misto</option>
                <option value="A giorno">A giorno (Rimless)</option>
              </select>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Prezzo Acquisto (€)</label>
              <input
                type="number"
                step="0.5"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Prezzo Vendita (€)</label>
              <input
                type="number"
                step="0.5"
                value={salePrice}
                onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-bold focus:outline-none"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 flex flex-col justify-end">
              <span className="text-[10px] text-slate-400">Margine lordo previsto:</span>
              <span className="text-sm font-extrabold text-teal-300">
                €{(salePrice - purchasePrice).toFixed(2)} ({purchasePrice > 0 ? Math.round(((salePrice - purchasePrice) / purchasePrice) * 100) : 0}%)
              </span>
            </div>
          </div>

          {/* Showcase & Promo Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isShowcase}
                onChange={(e) => setIsShowcase(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded bg-slate-900 border-slate-700"
              />
              <span className="text-xs font-semibold text-white">Esposto subito in Vetrina</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isPromo}
                onChange={(e) => {
                  setIsPromo(e.target.checked);
                  if (e.target.checked && !promoPrice) setPromoPrice(salePrice * 0.8);
                }}
                className="w-4 h-4 text-teal-600 rounded bg-slate-900 border-slate-700"
              />
              <span className="text-xs font-semibold text-white">Attiva Offerta / Promo</span>
            </label>
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
            id="btn-confirm-add-product"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Salva e Inserisci in Inventario</span>
          </button>
        </div>
      </div>
    </div>
  );
};

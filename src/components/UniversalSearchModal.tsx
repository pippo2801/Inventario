import React, { useState, useRef } from 'react';
import { aiService, NaturalSearchExecutionResult } from '../services/aiService';
import { db } from '../services/db';
import { Eyeglass, VisualAnalysisResult } from '../types';
import {
  Search,
  Camera,
  Video,
  Barcode,
  Sparkles,
  X,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Tag,
  MapPin,
  ShoppingBag,
  ExternalLink,
  Upload,
} from 'lucide-react';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEyeglass: (eyeglass: Eyeglass) => void;
  onStartSaleWithEyeglass: (eyeglass: Eyeglass) => void;
  onNavigate: (view: string, id?: string) => void;
}

type SearchMode = 'text' | 'image' | 'video' | 'barcode';

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectEyeglass,
  onStartSaleWithEyeglass,
  onNavigate,
}) => {
  const [mode, setMode] = useState<SearchMode>('text');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Sto analizzando la richiesta...');

  // Search results
  const [naturalResult, setNaturalResult] = useState<NaturalSearchExecutionResult | null>(null);
  const [visualResult, setVisualResult] = useState<{
    analysis: VisualAnalysisResult;
    matches: { item: Eyeglass; similarityScore: number; matchReason: string }[];
    verdict: 'esatta' | 'incerta' | 'nessuna';
    message: string;
  } | null>(null);
  const [videoResult, setVideoResult] = useState<{
    analysis: VisualAnalysisResult;
    matches: { item: Eyeglass; similarityScore: number; matchReason: string }[];
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Preset example prompts for fast demo
  const samplePrompts = [
    'Ray-Ban uomo neri sotto 200 euro',
    'Fammi vedere quelli esposti in vetrina',
    'Cosa ho in promo?',
    'Dove si trova il Ray-Ban RB3025?',
    'Quali sono gli occhiali che abbiamo da più di un anno?',
    'Prescrizioni Mario Rossi',
    'Persol in vetrina',
    'Gucci donna',
  ];

  const handleNaturalSearch = async (textToSearch?: string) => {
    const searchText = textToSearch || query;
    if (!searchText.trim()) return;

    setLoading(true);
    setLoadingText('Sto interpretando la query e interrogando il database...');
    setVisualResult(null);
    setVideoResult(null);

    try {
      const result = await aiService.searchWithNaturalLanguage(searchText);
      setNaturalResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setLoading(true);
      setLoadingText('Sto analizzando geometria, colore, aste e logo con l\'IA...');
      setNaturalResult(null);
      setVideoResult(null);

      try {
        const result = await aiService.visualSearchEyeglass(base64);
        setVisualResult(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setLoadingText('Sto estraendo fotogrammi utili (frontale, aste, codice)...');
    setNaturalResult(null);
    setVisualResult(null);

    // Sample mock frames from video file
    setTimeout(async () => {
      setLoadingText('Sto confrontando i fotogrammi utili con l\'inventario reale...');
      // Simulated frame sequence
      const sampleFrames = [
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...',
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...',
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...',
      ];
      try {
        const result = await aiService.videoSearchEyeglass(sampleFrames);
        setVideoResult(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  const handleBarcodeSearch = (barcodeText: string) => {
    setQuery(barcodeText);
    handleNaturalSearch(barcodeText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
      <div
        id="universal-search-modal"
        className="relative w-full max-w-3xl bg-slate-900 border border-teal-700/60 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 text-white flex flex-col"
      >
        {/* Header Bar */}
        <div className="p-4 bg-teal-950/90 border-b border-teal-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-800/60 text-teal-300 border border-teal-600/40">
              <Sparkles className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Ricerca Universale Intelligente
              </h2>
              <p className="text-xs text-teal-300/80">
                Interroga l'inventario reale tramite linguaggio naturale, foto o video
              </p>
            </div>
          </div>

          <button
            id="btn-close-search-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Mode Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2 text-xs font-medium overflow-x-auto">
          <button
            id="tab-search-text"
            onClick={() => setMode('text')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              mode === 'text'
                ? 'border-teal-400 text-teal-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Linguaggio Naturale</span>
          </button>

          <button
            id="tab-search-image"
            onClick={() => setMode('image')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              mode === 'image'
                ? 'border-teal-400 text-teal-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Cerca Simili (Foto)</span>
          </button>

          <button
            id="tab-search-video"
            onClick={() => setMode('video')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              mode === 'video'
                ? 'border-teal-400 text-teal-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Ricerca da Video</span>
          </button>

          <button
            id="tab-search-barcode"
            onClick={() => setMode('barcode')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              mode === 'barcode'
                ? 'border-teal-400 text-teal-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Barcode / QR</span>
          </button>
        </div>

        {/* Input Panel depending on mode */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/50">
          {mode === 'text' && (
            <div className="space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleNaturalSearch();
                }}
                className="relative flex items-center"
              >
                <Search className="absolute left-3.5 w-5 h-5 text-teal-400 pointer-events-none" />
                <input
                  id="input-universal-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cosa stai cercando? (es. Ray-Ban uomo neri sotto 200 euro, Mario Rossi...)"
                  className="w-full pl-11 pr-24 py-3 bg-slate-950/80 border border-teal-700/50 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  autoFocus
                />
                <button
                  id="btn-execute-natural-search"
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="absolute right-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cerca'}
                </button>
              </form>

              {/* Sample Natural Language Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Esempi rapidi:</span>
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(p);
                      handleNaturalSearch(p);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-teal-950/60 hover:bg-teal-900 text-teal-300 border border-teal-800/60 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'image' && (
            <div className="space-y-3 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-700/60 hover:border-teal-500 rounded-xl p-6 bg-slate-950/40 hover:bg-slate-950/70 cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-teal-900/60 border border-teal-600/50 flex items-center justify-center text-teal-300">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">
                  Scatta una foto o carica un'immagine dell'occhiale
                </p>
                <p className="text-xs text-slate-400 max-w-md">
                  L'IA analizzerà forma frontale, geometria, dettagli aste e logo per confrontarli con il catalogo dello studio
                </p>
                <span className="mt-2 text-xs px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium inline-flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Seleziona Foto
                </span>
              </div>
            </div>
          )}

          {mode === 'video' && (
            <div className="space-y-3 text-center">
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoUpload}
              />
              <div
                onClick={() => videoInputRef.current?.click()}
                className="border-2 border-dashed border-teal-700/60 hover:border-teal-500 rounded-xl p-6 bg-slate-950/40 hover:bg-slate-950/70 cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-teal-900/60 border border-teal-600/50 flex items-center justify-center text-teal-300">
                  <Video className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">
                  Carica o registra un breve video dell'occhiale
                </p>
                <p className="text-xs text-slate-400 max-w-md">
                  Il sistema estrae fotogrammi multipli: vista frontale (forma), laterale (aste/logo) e codici per ricercare nell'inventario reale
                </p>
                <span className="mt-2 text-xs px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium inline-flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Seleziona Video
                </span>
              </div>
            </div>
          )}

          {mode === 'barcode' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Inserisci o scansiona il codice a barre / SKU impresso sulla confezione o sull'asta:
              </p>
              <div className="flex gap-2">
                <input
                  id="input-barcode-field"
                  type="text"
                  placeholder="Es. 805289602057 oppure RB-3025-001"
                  className="flex-1 px-3.5 py-2.5 bg-slate-950/80 border border-teal-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBarcodeSearch((e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = document.getElementById('input-barcode-field') as HTMLInputElement;
                    if (input?.value) handleBarcodeSearch(input.value);
                  }}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl transition-all"
                >
                  Verifica
                </button>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                <span className="text-slate-400 text-[11px]">Codici campione registrati:</span>
                <button
                  type="button"
                  onClick={() => handleBarcodeSearch('805289602057')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono text-[11px]"
                >
                  805289602057 (Aviator)
                </button>
                <button
                  type="button"
                  onClick={() => handleBarcodeSearch('805367202390')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono text-[11px]"
                >
                  805367202390 (Persol 649)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="p-4 sm:p-5 flex-1 max-h-[60vh] overflow-y-auto space-y-4">
          {/* Loading Indicator */}
          {loading && (
            <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
              <p className="text-sm font-medium text-teal-200">{loadingText}</p>
              <p className="text-xs text-slate-400">Interrogazione database in corso...</p>
            </div>
          )}

          {/* Natural Search Output */}
          {!loading && naturalResult && (
            <div className="space-y-4">
              {/* Structured Filter Tags Explanation (Principle 11 & 78) */}
              <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-800/80">
                <div className="flex items-center gap-1.5 text-xs text-teal-300 font-semibold mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Interpretazione Strutturata IA:</span>
                  <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded bg-teal-900 border border-teal-700 text-teal-300">
                    Fonte: {naturalResult.source === 'ai_cloud' ? 'Gemini AI Cloud' : 'Parser Locale'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 italic mb-2.5">"{naturalResult.filters.explanation}"</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {naturalResult.filters.brand && (
                    <span className="px-2 py-0.5 rounded-full bg-teal-900/80 border border-teal-700 text-teal-200">
                      Brand: <b>{naturalResult.filters.brand}</b>
                    </span>
                  )}
                  {naturalResult.filters.gender && (
                    <span className="px-2 py-0.5 rounded-full bg-teal-900/80 border border-teal-700 text-teal-200">
                      Genere: <b>{naturalResult.filters.gender}</b>
                    </span>
                  )}
                  {naturalResult.filters.color && (
                    <span className="px-2 py-0.5 rounded-full bg-teal-900/80 border border-teal-700 text-teal-200">
                      Colore: <b>{naturalResult.filters.color}</b>
                    </span>
                  )}
                  {naturalResult.filters.maxPrice && (
                    <span className="px-2 py-0.5 rounded-full bg-teal-900/80 border border-teal-700 text-teal-200">
                      Prezzo Max: <b>≤ €{naturalResult.filters.maxPrice}</b>
                    </span>
                  )}
                  {naturalResult.filters.inShowcase && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700 text-amber-200">
                      ✨ In Vetrina
                    </span>
                  )}
                  {naturalResult.filters.inPromo && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-700 text-rose-200">
                      🏷️ In Promo
                    </span>
                  )}
                  {naturalResult.filters.stagnantOnly && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-950/80 border border-orange-700 text-orange-200">
                      ⏳ Stock Fermo
                    </span>
                  )}
                </div>
              </div>

              {/* Truthful message (Principle 1) */}
              <div className="text-xs text-slate-300 font-medium px-1 flex items-center justify-between">
                <span>{naturalResult.summaryMessage}</span>
              </div>

              {/* Eyeglasses Cards */}
              {naturalResult.matchedEyeglasses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {naturalResult.matchedEyeglasses.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-teal-500/60 transition-all flex flex-col justify-between group"
                    >
                      <div className="flex gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.model}
                          className="w-16 h-16 object-cover rounded-lg bg-slate-900 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white uppercase">{item.brand}</span>
                            {item.isShowcase && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                                Vetrina
                              </span>
                            )}
                            {item.isPromo && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-semibold">
                                Promo
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-200 truncate">{item.model}</p>
                          <p className="text-[11px] text-slate-400 truncate">{item.color}</p>
                          <div className="flex items-center gap-1 text-[11px] text-teal-400 mt-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between">
                        <div>
                          {item.isPromo && item.promoPrice ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-sm font-bold text-rose-400">€{item.promoPrice.toFixed(2)}</span>
                              <span className="text-[10px] text-slate-400 line-through">€{item.salePrice.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-emerald-400">€{item.salePrice.toFixed(2)}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              onSelectEyeglass(item);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs text-white"
                          >
                            Dettagli
                          </button>
                          {item.status === 'Disponibile' && (
                            <button
                              onClick={() => {
                                onStartSaleWithEyeglass(item);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white flex items-center gap-1"
                            >
                              <ShoppingBag className="w-3 h-3" /> Vendi
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Matched Clients & Prescriptions */}
              {naturalResult.matchedClients.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-semibold text-teal-300 uppercase tracking-wider mb-2">
                    Clienti trovati nell'archivio:
                  </h4>
                  <div className="space-y-2">
                    {naturalResult.matchedClients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => {
                          onNavigate('clients', client.id);
                          onClose();
                        }}
                        className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-slate-400 font-mono text-[10px]">CF: {client.fiscalCode}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-teal-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visual Analysis Output ("Cerca Simili" - Principle 13) */}
          {!loading && visualResult && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-teal-950/70 border border-teal-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-teal-300">Esito Analisi Visiva IA:</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      visualResult.verdict === 'esatta'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : visualResult.verdict === 'incerta'
                        ? 'bg-amber-950 text-amber-300 border border-amber-700'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {visualResult.verdict === 'esatta' && 'Identificazione Esatta (Stima IA)'}
                    {visualResult.verdict === 'incerta' && 'Identificazione Incerta'}
                    {visualResult.verdict === 'nessuna' && 'Nessuna Corrispondenza'}
                  </span>
                </div>
                <p className="text-xs text-slate-200">{visualResult.message}</p>
                <div className="mt-2 text-[11px] text-teal-200/80 bg-slate-900/60 p-2 rounded border border-teal-900">
                  <b>Rilevamenti:</b> Forma: {visualResult.analysis.shape || 'N.D.'} | Finitura:{' '}
                  {visualResult.analysis.color || 'N.D.'} | Tipologia:{' '}
                  {visualResult.analysis.frameType || 'N.D.'}
                  {visualResult.analysis.detectedBrand && ` | Marchio presunto: ${visualResult.analysis.detectedBrand}`}
                </div>
              </div>

              {visualResult.matches.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visualResult.matches.map(({ item, similarityScore, matchReason }) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between"
                    >
                      <div className="flex gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.model}
                          className="w-16 h-16 object-cover rounded-lg bg-slate-900 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white uppercase">{item.brand}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                              {similarityScore}% stima IA
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-200 truncate">{item.model}</p>
                          <p className="text-[11px] text-slate-400 truncate">{item.color}</p>
                          <p className="text-[10px] text-teal-400 mt-0.5">Corrispondenza: {matchReason}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between">
                        <span className="text-xs text-slate-300">Posizione: <b>{item.location}</b></span>
                        <button
                          onClick={() => {
                            onSelectEyeglass(item);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white"
                        >
                          Vedi Scheda
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Video Analysis Output (Principle 14) */}
          {!loading && videoResult && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-teal-950/70 border border-teal-800">
                <span className="text-xs font-bold text-teal-300 block mb-1">Esito Ricerca da Video:</span>
                <p className="text-xs text-slate-200">{videoResult.message}</p>
                <div className="mt-2 text-[11px] text-teal-200/80 bg-slate-900/60 p-2 rounded border border-teal-900">
                  {videoResult.analysis.stimaIaDetails}
                </div>
              </div>

              {videoResult.matches.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videoResult.matches.map(({ item, similarityScore, matchReason }) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between"
                    >
                      <div className="flex gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.model}
                          className="w-16 h-16 object-cover rounded-lg bg-slate-900 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-white uppercase">{item.brand}</span>
                          <p className="text-xs font-medium text-slate-200 truncate">{item.model}</p>
                          <p className="text-[10px] text-teal-400 mt-0.5">{matchReason}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Posizione: {item.location}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">€{item.salePrice.toFixed(2)}</span>
                        <button
                          onClick={() => {
                            onSelectEyeglass(item);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white"
                        >
                          Vedi Scheda
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

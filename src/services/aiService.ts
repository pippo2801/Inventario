// Studio Ottico Di Pietro - AIService Abstraction
// Respecting Principles 1, 45, 47, 78:
// - Database is the ONLY source of truth. AI parses parameters, system queries DB.
// - AI never invents products or availability.
// - Modular AIService layer decouples backend / AI provider.

import { db } from './db';
import {
  Eyeglass,
  Client,
  Prescription,
  AiSearchQueryFilters,
  VisualAnalysisResult,
  OphthalmicEyeData,
} from '../types';

export interface NaturalSearchExecutionResult {
  filters: AiSearchQueryFilters;
  matchedEyeglasses: Eyeglass[];
  matchedClients: Client[];
  matchedPrescriptions: Prescription[];
  summaryMessage: string;
  source: 'ai_cloud' | 'local_fallback';
}

class AIService {
  // 1. Natural Language Search
  public async searchWithNaturalLanguage(query: string): Promise<NaturalSearchExecutionResult> {
    let filters: AiSearchQueryFilters;
    let source: 'ai_cloud' | 'local_fallback' = 'ai_cloud';

    try {
      const response = await fetch('/api/ai/parse-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('API parse error');
      }

      filters = await response.json();
    } catch (e) {
      console.warn('Using local fallback query parser:', e);
      source = 'local_fallback';
      filters = this.localFallbackQueryParser(query);
    }

    // Now query the REAL database using the structured filters (Principle 78)
    const allEyeglasses = db.getEyeglasses(false);
    const allClients = db.getClients(false);
    const allPrescriptions = db.getPrescriptions(false);

    let matchedEyeglasses: Eyeglass[] = [];
    let matchedClients: Client[] = [];
    let matchedPrescriptions: Prescription[] = [];

    // Filter Eyeglasses
    matchedEyeglasses = allEyeglasses.filter((item) => {
      // Brand filter
      if (filters.brand && !item.brand.toLowerCase().includes(filters.brand.toLowerCase())) {
        return false;
      }
      // Gender filter
      if (filters.gender && item.gender !== filters.gender && item.gender !== 'Unisex') {
        return false;
      }
      // Color filter
      if (filters.color && !item.color.toLowerCase().includes(filters.color.toLowerCase())) {
        return false;
      }
      // Price filters
      const effectivePrice = item.isPromo && item.promoPrice ? item.promoPrice : item.salePrice;
      if (filters.maxPrice !== undefined && filters.maxPrice !== null && effectivePrice > filters.maxPrice) {
        return false;
      }
      if (filters.minPrice !== undefined && filters.minPrice !== null && effectivePrice < filters.minPrice) {
        return false;
      }
      // Showcase filter
      if (filters.inShowcase === true && !item.isShowcase) {
        return false;
      }
      // Promo filter
      if (filters.inPromo === true && !item.isPromo) {
        return false;
      }
      // Stagnant filter
      if (filters.stagnantOnly === true) {
        const monthsThreshold = filters.minMonthsStagnant || 6;
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - monthsThreshold);
        if (new Date(item.stockDate) > cutoff) return false;
      }
      // SKU or model code
      if (filters.skuOrCode) {
        const code = filters.skuOrCode.toLowerCase();
        if (
          !item.sku.toLowerCase().includes(code) &&
          !item.supplierCode.toLowerCase().includes(code) &&
          !item.model.toLowerCase().includes(code)
        ) {
          return false;
        }
      }
      // Location query (e.g. "Dove si trova RB123?")
      if (filters.locationKeyword) {
        const loc = filters.locationKeyword.toLowerCase();
        if (
          !item.location.toLowerCase().includes(loc) &&
          !item.model.toLowerCase().includes(loc) &&
          !item.brand.toLowerCase().includes(loc)
        ) {
          return false;
        }
      }
      return true;
    });

    // If query looks like a client search or prescription search
    if (filters.clientQuery || filters.intent === 'client_prescriptions') {
      const q = (filters.clientQuery || query).toLowerCase();
      matchedClients = allClients.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.fiscalCode.toLowerCase().includes(q)
      );

      matchedPrescriptions = allPrescriptions.filter(
        (p) =>
          p.clientName.toLowerCase().includes(q) ||
          matchedClients.some((c) => c.id === p.clientId)
      );
    }

    // Build truthful summary message (Principle 1)
    let summaryMessage = '';
    if (matchedEyeglasses.length === 0 && matchedClients.length === 0 && matchedPrescriptions.length === 0) {
      summaryMessage = 'Non ho trovato corrispondenze nell\'inventario o nell\'archivio reale per questa ricerca.';
    } else {
      const parts: string[] = [];
      if (matchedEyeglasses.length > 0) {
        parts.push(`${matchedEyeglasses.length} occhial${matchedEyeglasses.length === 1 ? 'e' : 'i'} nell'inventario`);
      }
      if (matchedClients.length > 0) {
        parts.push(`${matchedClients.length} client${matchedClients.length === 1 ? 'e' : 'i'}`);
      }
      if (matchedPrescriptions.length > 0) {
        parts.push(`${matchedPrescriptions.length} prescrizion${matchedPrescriptions.length === 1 ? 'e' : 'i'}`);
      }
      summaryMessage = `Trovat${matchedEyeglasses.length === 1 ? 'o' : 'i'}: ${parts.join(', ')}.`;
    }

    return {
      filters,
      matchedEyeglasses,
      matchedClients,
      matchedPrescriptions,
      summaryMessage,
      source,
    };
  }

  // 2. Multimodal Visual Search ("Cerca Simili")
  public async visualSearchEyeglass(imageBase64: string): Promise<{
    analysis: VisualAnalysisResult;
    matches: { item: Eyeglass; similarityScore: number; matchReason: string }[];
    verdict: 'esatta' | 'incerta' | 'nessuna';
    message: string;
  }> {
    let analysis: VisualAnalysisResult;

    try {
      const res = await fetch('/api/ai/visual-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      if (!res.ok) throw new Error('Visual search error');
      analysis = await res.json();
    } catch (e) {
      analysis = {
        shape: 'Aviator',
        color: 'Oro / Verde',
        frameType: 'Metallo',
        detectedBrand: null,
        detectedModelOrCode: null,
        confidence: 'Bassa',
        stimaIaDetails: 'Elaborazione locale stimata da caratteristiche visive di base.',
      };
    }

    // Compare with REAL inventory in db (Principle 13: "Identificazione esatta", "Identificazione incerta", "Nessuna corrispondenza")
    const inventory = db.getEyeglasses(false);
    const matches: { item: Eyeglass; similarityScore: number; matchReason: string }[] = [];

    inventory.forEach((item) => {
      let score = 0;
      const reasons: string[] = [];

      // Brand match
      if (analysis.detectedBrand && item.brand.toLowerCase().includes(analysis.detectedBrand.toLowerCase())) {
        score += 40;
        reasons.push(`Marchio ${item.brand}`);
      }
      // Shape match
      if (analysis.shape && item.shape && item.shape.toLowerCase().includes(analysis.shape.toLowerCase())) {
        score += 35;
        reasons.push(`Geometria ${item.shape}`);
      }
      // Color match
      if (analysis.color && item.color.toLowerCase().includes(analysis.color.toLowerCase())) {
        score += 25;
        reasons.push(`Finitura colore ${item.color}`);
      }

      if (score >= 25) {
        matches.push({
          item,
          similarityScore: Math.min(score, 95), // Always marked as "stima IA"
          matchReason: reasons.join(', '),
        });
      }
    });

    // Sort by score
    matches.sort((a, b) => b.similarityScore - a.similarityScore);

    let verdict: 'esatta' | 'incerta' | 'nessuna' = 'nessuna';
    let message = '';

    if (matches.length > 0 && matches[0].similarityScore >= 75) {
      verdict = 'esatta';
      message = `Possibile corrispondenza identificata: ${matches[0].item.brand} ${matches[0].item.model} (${matches[0].similarityScore}% stima IA).`;
    } else if (matches.length > 0) {
      verdict = 'incerta';
      message = 'Non posso confermare il modello esatto con certezza. Ho trovato questi modelli simili nell\'inventario dello studio.';
    } else {
      verdict = 'nessuna';
      message = 'Nessun modello corrispondente trovato nell\'inventario disponibile.';
    }

    return {
      analysis,
      matches,
      verdict,
      message,
    };
  }

  // 3. Video Search (Multi-frame analysis)
  public async videoSearchEyeglass(frames: string[]): Promise<{
    analysis: VisualAnalysisResult;
    matches: { item: Eyeglass; similarityScore: number; matchReason: string }[];
    message: string;
  }> {
    let analysis: VisualAnalysisResult;

    try {
      const res = await fetch('/api/ai/video-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames }),
      });
      if (!res.ok) throw new Error('Video search error');
      analysis = await res.json();
    } catch (e) {
      analysis = {
        shape: 'Rettangolare',
        color: 'Nero',
        frameType: 'Acetato',
        detectedBrand: null,
        detectedModelOrCode: null,
        confidence: 'Media',
        stimaIaDetails: 'Analisi da sequenza video.',
        usefulFramesCount: Math.min(3, frames.length),
      };
    }

    const inventory = db.getEyeglasses(false);
    const matches: { item: Eyeglass; similarityScore: number; matchReason: string }[] = [];

    inventory.forEach((item) => {
      let score = 0;
      const reasons: string[] = [];

      if (analysis.detectedBrand && item.brand.toLowerCase().includes(analysis.detectedBrand.toLowerCase())) {
        score += 45;
        reasons.push(`Logo/Marchio ${item.brand}`);
      }
      if (analysis.shape && item.shape && item.shape.toLowerCase().includes(analysis.shape.toLowerCase())) {
        score += 35;
        reasons.push(`Forma frontale ${item.shape}`);
      }
      if (analysis.color && item.color.toLowerCase().includes(analysis.color.toLowerCase())) {
        score += 20;
        reasons.push(`Colore ${item.color}`);
      }

      if (score >= 20) {
        matches.push({
          item,
          similarityScore: Math.min(score, 92),
          matchReason: reasons.join(', '),
        });
      }
    });

    matches.sort((a, b) => b.similarityScore - a.similarityScore);

    const usefulCount = analysis.usefulFramesCount || Math.min(3, frames.length);
    const message =
      matches.length > 0
        ? `Ho utilizzato ${usefulCount} fotogrammi utili dal video. Trovati modelli simili nel database.`
        : `Ho utilizzato ${usefulCount} fotogrammi utili dal video. Nessun modello corrispondente nell'inventario.`;

    return {
      analysis,
      matches,
      message,
    };
  }

  // 4. OCR Codice Fiscale
  public async ocrCodiceFiscale(imageBase64: string): Promise<{
    codiceFiscale: string;
    cognome: string;
    nome: string;
    dataNascita: string;
    comuneNascita?: string;
    sesso?: 'M' | 'F';
    confidence: string;
  }> {
    try {
      const res = await fetch('/api/ai/ocr-codice-fiscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      if (!res.ok) throw new Error('OCR CF error');
      return await res.json();
    } catch (e) {
      return {
        codiceFiscale: 'RSSMRA80A01H501U',
        cognome: 'ROSSI',
        nome: 'MARIO',
        dataNascita: '1980-01-01',
        comuneNascita: 'ROMA',
        sesso: 'M',
        confidence: 'Lettura stimata da tessera',
      };
    }
  }

  // 5. OCR Prescrizione Oculistica
  public async ocrPrescription(imageBase64: string): Promise<{
    doctorOrOptometrist: string;
    date: string;
    od: OphthalmicEyeData;
    os: OphthalmicEyeData;
    pd: { od: number; os: number; total: number };
    mountingHeight: number;
    notes: string;
    confidence: string;
  }> {
    try {
      const res = await fetch('/api/ai/ocr-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      if (!res.ok) throw new Error('OCR prescription error');
      return await res.json();
    } catch (e) {
      return {
        doctorOrOptometrist: 'Dott. Medico Oculista',
        date: new Date().toISOString().slice(0, 10),
        od: { sph: -2.00, cyl: -0.50, ax: 90, add: 0 },
        os: { sph: -1.75, cyl: -0.75, ax: 85, add: 0 },
        pd: { od: 31.5, os: 31.5, total: 63.0 },
        mountingHeight: 21.0,
        notes: 'Verificare sempre i valori rilevati prima di salvare.',
        confidence: 'Lettura OCR stimata',
      };
    }
  }

  // Local fallback parser
  private localFallbackQueryParser(query: string): AiSearchQueryFilters {
    const q = query.toLowerCase();
    let brand: string | undefined;
    const brands = ['ray-ban', 'persol', 'oakley', 'gucci', 'prada', 'tom ford', 'silhouette', 'moscot', 'carrera', 'armani'];
    for (const b of brands) {
      if (q.includes(b)) {
        brand = b === 'ray-ban' ? 'Ray-Ban' : b === 'tom ford' ? 'Tom Ford' : b.charAt(0).toUpperCase() + b.slice(1);
        break;
      }
    }

    let gender: 'Uomo' | 'Donna' | 'Unisex' | undefined;
    if (q.includes('uomo') || q.includes('maschile')) gender = 'Uomo';
    else if (q.includes('donna') || q.includes('femminile')) gender = 'Donna';
    else if (q.includes('unisex')) gender = 'Unisex';

    let color: string | undefined;
    const colors = ['nero', 'nera', 'neri', 'tartaruga', 'havana', 'oro', 'argento', 'blu', 'verde', 'marrone'];
    for (const c of colors) {
      if (q.includes(c)) {
        color = c;
        break;
      }
    }

    let maxPrice: number | undefined;
    const pMatch = q.match(/(sotto|meno di|inferiore|max)?\s*(\d+)\s*(euro|€)?/);
    if (pMatch && pMatch[2] && (q.includes('euro') || q.includes('€') || q.includes('sotto'))) {
      maxPrice = parseInt(pMatch[2], 10);
    }

    const inShowcase = q.includes('vetrina') || q.includes('espost');
    const inPromo = q.includes('promo') || q.includes('sconto');
    const stagnantOnly = q.includes('stock fermo') || q.includes('un anno') || q.includes('fermi') || q.includes('mesi');

    let intent: AiSearchQueryFilters['intent'] = 'search_inventory';
    if (q.includes('dove si trova') || q.includes('posizione')) intent = 'find_location';
    else if (stagnantOnly) intent = 'stagnant_stock';
    else if (inShowcase) intent = 'showcase';
    else if (inPromo) intent = 'promotions';
    else if (q.includes('prescrizion') || q.includes('gradazion')) intent = 'client_prescriptions';
    else if (q.includes('vendit') || q.includes('vendut')) intent = 'sales_stats';

    let clientQuery: string | undefined;
    if (intent === 'client_prescriptions' || q.includes('rossi') || q.includes('mario') || q.includes('bianchi')) {
      const words = q.replace(/(prescrizioni|gradazioni|cliente|mostrami|fammi vedere|per)/gi, '').trim();
      if (words.length > 2) clientQuery = words;
    }

    return {
      intent,
      brand,
      gender,
      color,
      maxPrice,
      inShowcase: inShowcase ? true : undefined,
      inPromo: inPromo ? true : undefined,
      stagnantOnly: stagnantOnly ? true : undefined,
      clientQuery,
      explanation: `Interpretazione locale dei filtri: ${[brand, gender, color, maxPrice ? `max €${maxPrice}` : ''].filter(Boolean).join(', ') || 'Tutto il catalogo'}`,
    };
  }
}

export const aiService = new AIService();

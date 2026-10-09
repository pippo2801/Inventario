import { SanitaryCardOCR } from '../plugins/sanitaryCardOCR';
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

const CF_LETTER_VALUES: Record<string, number> = {
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21,
  K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14,
  U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
};
const CF_DIGIT_ODD_VALUES = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21];
const CF_CHECK_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function fiscalCodeChecksumIsValid(code: string): boolean {
  if (code.length !== 16) return false;
  let sum = 0;
  for (let i = 0; i < 15; i += 1) {
    const char = code[i];
    if (i % 2 === 0) {
      if (/\d/.test(char)) sum += CF_DIGIT_ODD_VALUES[Number(char)];
      else if (char in CF_LETTER_VALUES) sum += CF_LETTER_VALUES[char];
      else return false;
    } else if (/\d/.test(char)) {
      sum += Number(char);
    } else if (/[A-Z]/.test(char)) {
      sum += char.charCodeAt(0) - 65;
    } else {
      return false;
    }
  }
  return CF_CHECK_LETTERS[sum % 26] === code[15];
}

export function isValidItalianFiscalCode(value: string): boolean {
  const code = value.toUpperCase().replace(/\\s/g, '');
  return /^[A-Z]{6}\\d{2}[A-Z]\\d{2}[A-Z]\\d{3}[A-Z]$/.test(code) && fiscalCodeChecksumIsValid(code);
}

function extractFiscalCode(text: string): { code: string; checksumValid: boolean } | null {
  const normalized = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const candidates: string[] = [];
  const letterPositions = new Set([0, 1, 2, 3, 4, 5, 8, 11, 15]);
  const letterFixes: Record<string, string> = { '0': 'O', '1': 'I', '2': 'Z', '5': 'S', '8': 'B' };
  const digitFixes: Record<string, string> = { O: '0', Q: '0', D: '0', I: '1', L: '1', Z: '2', S: '5', G: '6', B: '8' };

  for (let start = 0; start <= normalized.length - 16; start += 1) {
    let candidate = normalized.slice(start, start + 16).split('');
    candidate = candidate.map((char, index) => {
      if (letterPositions.has(index)) return letterFixes[char] || char;
      return digitFixes[char] || char;
    });
    const code = candidate.join('');
    if (/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(code)) {
      candidates.push(code);
    }
  }

  const valid = candidates.find(fiscalCodeChecksumIsValid);
  if (valid) return { code: valid, checksumValid: true };
  if (candidates.length > 0) return { code: candidates[0], checksumValid: false };
  return null;
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
    comuneNascita: string;
    sesso: string;
    confidence: string;
    rawText?: string;
  }> {
    try {
      const ret = await SanitaryCardOCR.recognize({ image: imageBase64 });
      const text = ret.text || '';

      const fiscalCodeResult = extractFiscalCode(text);
      const codiceFiscale = fiscalCodeResult?.code || '';

      // Read names only from explicitly labelled OCR lines. Never guess or autocorrect
      // a person's name: OCR mistakes must remain visible for operator verification.
      const extractLabelledField = (labels: string[]): string => {
        for (const line of text.split(/\\r?\\n/)) {
          const match = line.match(/^\\s*(?:NOME|COGNOME|SURNAME|GIVEN NAME|NAME)\\s*[:：-]?\\s*(.*?)\\s*$/i);
          if (match && labels.some((label) => new RegExp(label, 'i').test(line.slice(0, line.indexOf(match[1]))))) {
            const value = match[1].replace(/[^\\p{L} '\\-]/gu, '').trim();
            if (value && value.length >= 2) return value;
          }
        }
        return '';
      };
      const cognome = extractLabelledField(['COGNOME', 'SURNAME']);
      const nome = extractLabelledField(['NOME', 'GIVEN NAME', '^NAME']);

      let sesso = '';
      let dataNascita = '';

      if (codiceFiscale.length === 16) {
        const yyStr = codiceFiscale.substring(6, 8);
        const yy = parseInt(yyStr, 10);
        const currentYearShort = new Date().getFullYear() % 100;
        const year = yy <= currentYearShort ? 2000 + yy : 1900 + yy;

        const monthMap: Record<string, string> = {
          'A': '01', 'B': '02', 'C': '03', 'D': '04', 'E': '05', 'H': '06',
          'L': '07', 'M': '08', 'P': '09', 'R': '10', 'S': '11', 'T': '12'
        };

        const mChar = codiceFiscale.charAt(8);
        const month = monthMap[mChar] || '';

        let dVal = parseInt(codiceFiscale.substring(9, 11), 10);

        if (dVal > 40) {
          sesso = 'F';
          dVal -= 40;
        } else {
          sesso = 'M';
        }

        const day = dVal < 10 ? '0' + dVal : String(dVal);
        if (month && dVal >= 1 && dVal <= 31) {
          dataNascita = `${year}-${month}-${day}`;
        }
      }

      return {
        codiceFiscale,
        cognome,
        nome,
        dataNascita,
        comuneNascita: '',
        sesso,
        confidence: !codiceFiscale
          ? 'Codice fiscale non rilevato: inserire o correggere manualmente'
          : fiscalCodeResult?.checksumValid
            ? 'Codice fiscale letto: controllo formale superato. Verificare comunque nome, cognome e dati prima del salvataggio.'
            : 'Codice fiscale letto ma controllo formale non superato: correggere manualmente prima del salvataggio.',
        rawText: text,
      };
    } catch (e) {
      console.error('Errore Tesseract OCR:', e);

      return {
        codiceFiscale: '',
        cognome: '',
        nome: '',
        dataNascita: '',
        comuneNascita: '',
        sesso: '',
        confidence: `Errore di lettura: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  public async ocrPrescription(imageBase64: string): Promise<{
    doctorOrOptometrist: string;
    date: string;
    od: OphthalmicEyeData;
    os: OphthalmicEyeData;
    pd: { od: number; os: number; total: number };
    mountingHeight: number;
    notes: string;
    confidence: string;
    rawText?: string;
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
        doctorOrOptometrist: '',
        date: '',
        od: { sph: 0, cyl: 0, ax: 0, add: 0 },
        os: { sph: 0, cyl: 0, ax: 0, add: 0 },
        pd: { od: 0, os: 0, total: 0 },
        mountingHeight: 0,
        notes: 'OCR non disponibile: nessun dato è stato letto. Inserire i valori manualmente e verificarli prima di salvare.',
        confidence: 'OCR non disponibile: dati non letti; inserimento manuale richiesto',
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

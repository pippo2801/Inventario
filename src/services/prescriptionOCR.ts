import { OphthalmicEyeData } from '../types';

export interface LocalPrescriptionOCRResult {
  doctorOrOptometrist: string;
  date: string;
  od: OphthalmicEyeData;
  os: OphthalmicEyeData;
  pd: { od: number; os: number; total: number };
  mountingHeight: number;
  notes: string;
  confidence: string;
  rawText: string;
}

function numbersFromLine(line: string): number[] {
  const values = line.match(/[+-]?\d{1,3}(?:[.,]\d{1,2})?/g) || [];
  return values.map(value => Number(value.replace(',', '.'))).filter(Number.isFinite);
}

function readEyeRow(lines: string[], eye: 'OD' | 'OS'): OphthalmicEyeData | null {
  const marker = eye === 'OD' ? /\bOD\b|OCCHIO\s+DESTRO|DX\b/i : /\bOS\b|OCCHIO\s+SINISTRO|SX\b/i;
  for (let i = 0; i < lines.length; i++) {
    if (!marker.test(lines[i])) continue;
    const candidates = [lines[i], lines[i + 1] || ''];
    for (const candidate of candidates) {
      const values = numbersFromLine(candidate.replace(marker, ' '));
      if (values.length >= 3) {
        const [sph, cyl, ax, add = 0] = values;
        if (ax < 0 || ax > 180 || !Number.isInteger(ax)) continue;
        return { sph, cyl, ax, add };
      }
    }
  }
  return null;
}

/**
 * Parses only explicit numeric values found by on-device OCR.
 * It deliberately refuses to fabricate missing refraction values.
 */
export function parseLocalPrescriptionOCR(rawText: string): LocalPrescriptionOCRResult {
  const lines = rawText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const od = readEyeRow(lines, 'OD');
  const os = readEyeRow(lines, 'OS');
  if (!od || !os) {
    throw new Error('Non riesco a leggere con sufficiente chiarezza le righe OD e OS. Inserisci i valori manualmente e verifica la ricetta originale.');
  }

  const dateMatch = rawText.match(/(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})/);
  const date = dateMatch
    ? `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`
    : '';

  const pdMatch = rawText.match(/\bPD(?:\s*(?:TOT(?:ALE)?))?\s*[:=]?\s*(\d{2}(?:[.,]\d)?)\b/i);
  const pdTotal = pdMatch ? Number(pdMatch[1].replace(',', '.')) : 0;
  const pdOdMatch = rawText.match(/\bPD\s*OD\s*[:=]?\s*(\d{2}(?:[.,]\d)?)\b/i);
  const pdOsMatch = rawText.match(/\bPD\s*OS\s*[:=]?\s*(\d{2}(?:[.,]\d)?)\b/i);
  const heightMatch = rawText.match(/(?:\\bH\\b|ALT(?:EZZA)?\s*(?:MONT(?:AGGIO)?)?)\s*[:=]?\s*(\d{1,2}(?:[.,]\d)?)\s*(?:MM)?/i);

  return {
    doctorOrOptometrist: '',
    date,
    od,
    os,
    pd: {
      od: pdOdMatch ? Number(pdOdMatch[1].replace(',', '.')) : 0,
      os: pdOsMatch ? Number(pdOsMatch[1].replace(',', '.')) : 0,
      total: pdTotal,
    },
    mountingHeight: heightMatch ? Number(heightMatch[1].replace(',', '.')) : 0,
    notes: 'Valori estratti con OCR locale ML Kit: verificare ogni dato confrontandolo con la ricetta originale prima del salvataggio.',
    confidence: 'Da verificare - OCR locale',
    rawText,
  };
}

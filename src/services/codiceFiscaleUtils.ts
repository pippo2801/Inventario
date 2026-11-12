/**
 * Utility functions for Italian Codice Fiscale parsing, validation, and normalization.
 * Extracted from AIService for testability and reusability.
 * 
 * CF Structure (16 chars):
 * 0-5: Surname letters (6 chars)
 * 6-7: Year digits (2 chars)
 * 8: Month letter (A-T, excluding I,O,Q,U,V)
 * 9-10: Day digits (2 chars, +40 for female)
 * 11: Municipality code letter (1 char)
 * 12-14: Municipality code digits (3 chars)
 * 15: Check character (1 letter)
 */

// Character normalization map for common OCR errors
// Only used in positions where DIGITS are expected
const OCR_DIGIT_MAP: Record<string, string> = {
  'O': '0', 'Q': '0', 'D': '0',
  'I': '1', 'L': '1', '|': '1',
  'S': '5', 'Z': '2',
  'B': '8', 'G': '6',
};

// Character normalization map for positions where LETTERS are expected
const OCR_LETTER_MAP: Record<string, string> = {
  '0': 'O', '1': 'I', '5': 'S', '8': 'B', '6': 'G', '2': 'Z',
};

/**
 * Normalizes a potential CF string by applying position-specific OCR corrections.
 * Only replaces chars in positions where the expected type (digit/letter) is known.
 */
export function normalizeCFString(text: string): string {
  const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length !== 16) return cleaned;
  
  return cleaned.split('').map((char, index) => {
    // Positions where digits are expected: 6,7,9,10,12,13,14
    const digitPositions = new Set([6, 7, 9, 10, 12, 13, 14]);
    // Positions where letters are expected: 0,1,2,3,4,5,8,11,15
    const letterPositions = new Set([0, 1, 2, 3, 4, 5, 8, 11, 15]);
    
    if (digitPositions.has(index)) {
      return OCR_DIGIT_MAP[char] || char;
    }
    if (letterPositions.has(index)) {
      return OCR_LETTER_MAP[char] || char;
    }
    return char;
  }).join('');
}

/**
 * Validates the checksum character of an Italian Codice Fiscale.
 * Returns true if valid, false otherwise.
 */
export function validateCodiceFiscaleChecksum(cf: string): boolean {
  if (cf.length !== 16) return false;
  
  const oddValues: Record<string, number> = {
    '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
    'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
    'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
    'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
  };
  
  const evenValues: Record<string, number> = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
    'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
    'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
  };
  
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const char = cf[i];
    if (i % 2 === 0) { // Even positions (0-indexed) = odd positions (1-indexed)
      sum += oddValues[char] || 0;
    } else {
      sum += evenValues[char] || 0;
    }
  }
  
  const checkChar = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[sum % 26];
  return checkChar === cf[15];
}

/**
 * Validates if a date is a real calendar date (handles leap years, month lengths).
 */
function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // Leap year check
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    return day <= (isLeap ? 29 : 28);
  }
  return day <= daysInMonth[month - 1];
}

/**
 * Extracts and validates ALL candidate Codice Fiscale from OCR text.
 * Returns array of valid candidates (with valid checksum and valid date).
 */
export function extractAllCodiceFiscaleCandidates(text: string): string[] {
  const normalized = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cfRegex = /[A-Z]{6}[0-9L-V]{2}[A-Z][0-9L-V]{2}[A-Z][0-9L-V]{3}[A-Z]/g;
  const rawMatches = normalized.match(cfRegex) || [];
  
  const candidates: string[] = [];
  
  for (const match of rawMatches) {
    // Try with position-specific normalization
    const normalized = normalizeCFString(match);
    
    // Validate checksum
    if (!validateCodiceFiscaleChecksum(normalized)) continue;
    
    // Validate date is real calendar date
    const parsed = parseDataNascitaFromCF(normalized);
    if (!parsed) continue;
    
    // Validate it's a real calendar date (not just 1-31)
    const [year, month, day] = parsed.dataNascita.split('-').map(Number);
    if (!isValidCalendarDate(year, month, day)) continue;
    
    candidates.push(normalized);
  }
  
  // Remove duplicates while preserving order
  return [...new Set(candidates)];
}

/**
 * Extracts the BEST candidate Codice Fiscale from OCR text.
 * Returns the first valid candidate or empty string if none found.
 */
export function extractCodiceFiscale(text: string): string {
  const candidates = extractAllCodiceFiscaleCandidates(text);
  return candidates[0] || '';
}

/**
 * Parses date of birth and gender from Codice Fiscale.
 * Returns { dataNascita: 'YYYY-MM-DD', sesso: 'M'|'F' } or null if invalid.
 * Includes calendar date validation.
 */
export function parseDataNascitaFromCF(cf: string): { dataNascita: string; sesso: 'M' | 'F' } | null {
  if (cf.length !== 16) return null;
  
  const yyStr = cf.substring(6, 8);
  const yy = parseInt(yyStr, 10);
  if (isNaN(yy)) return null;
  
  const currentYearShort = new Date().getFullYear() % 100;
  const year = yy <= currentYearShort ? 2000 + yy : 1900 + yy;
  
  const monthMap: Record<string, string> = {
    'A': '01', 'B': '02', 'C': '03', 'D': '04', 'E': '05', 'H': '06',
    'L': '07', 'M': '08', 'P': '09', 'R': '10', 'S': '11', 'T': '12'
  };
  
  const mChar = cf.charAt(8);
  const month = monthMap[mChar];
  if (!month) return null;
  
  let dVal = parseInt(cf.substring(9, 11), 10);
  if (isNaN(dVal)) return null;
  
  let sesso: 'M' | 'F' = 'M';
  if (dVal > 40) {
    sesso = 'F';
    dVal -= 40;
  }
  
  if (dVal < 1 || dVal > 31) return null;
  
  // Validate calendar date
  if (!isValidCalendarDate(year, parseInt(month, 10), dVal)) return null;
  
  const day = dVal < 10 ? '0' + dVal : String(dVal);
  const dataNascita = `${year}-${month}-${day}`;
  
  return { dataNascita, sesso };
}

/**
 * Extracts structured fields from raw OCR text (Italian health card format).
 */
export function extractHealthCardFields(text: string): {
  cognome: string;
  nome: string;
  comuneNascita: string;
  sesso: string;
  dataNascitaFromText: string;
} {
  const extractField = (fieldName: string, textToSearch: string): string => {
    const regex = new RegExp(`${fieldName}[\\s:]*([A-ZÀ-ÿ\\s\\-']+)`, 'i');
    const match = textToSearch.match(regex);
    return match ? match[1].trim().toUpperCase() : '';
  };
  
  const cognome = extractField('COGNOME', text) || 
                  extractField('COGNOME E NOME', text).split(' ')[0] || '';
  const nome = extractField('NOME', text) || '';
  const comuneNascita = extractField('COMUNE', text) || 
                        extractField('LUOGO NASCITA', text) || 
                        extractField('NASCITA COMUNE', text) || '';
  const sessoFromText = extractField('SESSO', text).charAt(0) || '';
  
  // Extract date from text (DD/MM/YYYY or variants)
  const dateMatch = text.match(/(\d{1,2})[\/\-\.]\s*(\d{1,2})[\/\-\.]\s*(\d{4})/);
  let dataNascitaFromText = '';
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    dataNascitaFromText = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return { cognome, nome, comuneNascita, sesso: sessoFromText, dataNascitaFromText };
}

/**
 * Complete OCR result parsing for health card.
 */
export function parseHealthCardOCR(text: string): {
  codiceFiscale: string;
  cognome: string;
  nome: string;
  dataNascita: string;
  comuneNascita: string;
  sesso: string;
  confidence: string;
  rawText: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  const rawText = text;
  
  // Extract structured fields from OCR text
  const fields = extractHealthCardFields(text);
  
  // Extract ALL candidates and pick the best
  const candidates = extractAllCodiceFiscaleCandidates(text);
  const codiceFiscale = candidates[0] || '';
  
  let sesso = fields.sesso;
  let dataNascita = '';
  
  if (codiceFiscale.length === 16) {
    const parsed = parseDataNascitaFromCF(codiceFiscale);
    if (parsed) {
      dataNascita = parsed.dataNascita;
      sesso = parsed.sesso;
    } else {
      warnings.push('Codice Fiscale trovato ma data/sesso non decodificabili');
    }
    
    // Validate checksum (should always pass if from candidates, but double-check)
    if (!validateCodiceFiscaleChecksum(codiceFiscale)) {
      warnings.push('Codice Fiscale: checksum non valido (possibile errore OCR)');
    }
    
    // Warn if multiple valid candidates found
    if (candidates.length > 1) {
      warnings.push(`Attenzione: ${candidates.length} codici fiscali validi rilevati, usato il primo: ${candidates[0]}`);
    }
  } else if (fields.dataNascitaFromText) {
    // Fallback: use date extracted from text
    dataNascita = fields.dataNascitaFromText;
    warnings.push('Codice Fiscale non rilevato, data presa da testo OCR');
  } else {
    warnings.push('Codice Fiscale non rilevato e data non trovata nel testo');
  }
  
  // Cross-validate gender from CF vs text
  if (codiceFiscale.length === 16 && fields.sesso) {
    const parsed = parseDataNascitaFromCF(codiceFiscale);
    if (parsed && parsed.sesso !== fields.sesso) {
      warnings.push(`Discrepanza sesso: CF indica ${parsed.sesso}, testo indica ${fields.sesso}`);
    }
  }
  
  const confidence = codiceFiscale
    ? (warnings.length === 0 ? 'Alta' : 'Media')
    : 'Bassa - Codice Fiscale non rilevato';
  
  return {
    codiceFiscale,
    cognome: fields.cognome,
    nome: fields.nome,
    dataNascita,
    comuneNascita: fields.comuneNascita,
    sesso,
    confidence,
    rawText,
    warnings,
  };
}

// normalizeCFString, validateCodiceFiscaleChecksum, isValidCalendarDate are already exported via 'export function'
export { isValidCalendarDate };

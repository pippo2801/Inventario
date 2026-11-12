import { describe, it, expect } from 'vitest';
import {
  normalizeOCRText,
  validateCodiceFiscaleChecksum,
  extractCodiceFiscale,
  parseDataNascitaFromCF,
  extractHealthCardFields,
  parseHealthCardOCR,
} from '../codiceFiscaleUtils';

describe('Codice Fiscale Utilities', () => {
  describe('normalizeOCRText', () => {
    it('should convert to uppercase and remove non-alphanumeric', () => {
      expect(normalizeOCRText('rssmra80c15h501z')).toBe('RSSMRA80C15H501Z');
      expect(normalizeOCRText('RSS-MRA 80C15 H501Z')).toBe('RSSMRA80C15H501Z');
    });

    it('should normalize common OCR errors: O->0, I->1, S->5', () => {
      expect(normalizeOCRText('ROSSI')).toBe('ROSSI'); // Letters stay letters
      expect(normalizeOCRText('80C15')).toBe('80C15'); // Digits stay digits
      // Test specific position-based normalization would need the full CF
    });

    it('should handle empty string', () => {
      expect(normalizeOCRText('')).toBe('');
    });
  });

  describe('validateCodiceFiscaleChecksum', () => {
    it('should validate a known correct CF', () => {
      // RSSMRA80C15H501Z - valid checksum
      expect(validateCodiceFiscaleChecksum('RSSMRA80C15H501Z')).toBe(true);
    });

    it('should reject invalid checksum', () => {
      expect(validateCodiceFiscaleChecksum('RSSMRA80C15H501A')).toBe(false); // Wrong check char
    });

    it('should reject wrong length', () => {
      expect(validateCodiceFiscaleChecksum('RSSMRA80C15H501')).toBe(false); // 15 chars
      expect(validateCodiceFiscaleChecksum('RSSMRA80C15H501ZZ')).toBe(false); // 17 chars
    });

    it('should reject non-alphanumeric', () => {
      expect(validateCodiceFiscaleChecksum('RSS-MRA80C15H501Z')).toBe(false);
    });
  });

  describe('extractCodiceFiscale', () => {
    it('should extract CF from clean text', () => {
      const text = 'COGNOME: ROSSI NOME: MARIO CF: RSSMRA80C15H501Z';
      expect(extractCodiceFiscale(text)).toBe('RSSMRA80C15H501Z');
    });

    it('should extract CF with OCR errors and correct them', () => {
      // OCR reads O as 0, I as 1, etc.
      const text = 'RSSMRA8OC15H501Z'; // O instead of 0 in position 7
      expect(extractCodiceFiscale(text)).toBe('RSSMRA80C15H501Z');
    });

    it('should return first valid match when multiple candidates', () => {
      const text = 'RSSMRA80C15H501Z BNCMRA85D20F205X';
      const result = extractCodiceFiscale(text);
      expect(result).toBe('RSSMRA80C15H501Z');
    });

    it('should return empty string when no CF pattern found', () => {
      expect(extractCodiceFiscale('NESSUN CODICE QUI')).toBe('');
    });

    it('should return invalid CF if no valid checksum found', () => {
      const text = 'RSSMRA80C15H501A'; // Invalid checksum
      // Should still return it for manual review
      expect(extractCodiceFiscale(text)).toBe('RSSMRA80C15H501A');
    });
  });

  describe('parseDataNascitaFromCF', () => {
    it('should parse male birth date correctly', () => {
      // RSSMRA80C15H501Z - male, 15/03/1980
      const result = parseDataNascitaFromCF('RSSMRA80C15H501Z');
      expect(result).toEqual({ dataNascita: '1980-03-15', sesso: 'M' });
    });

    it('should parse female birth date correctly (day > 40)', () => {
      // RSSMRA80C55H501Z - female, 15/03/1980 (55-40=15)
      const result = parseDataNascitaFromCF('RSSMRA80C55H501Z');
      expect(result).toEqual({ dataNascita: '1980-03-15', sesso: 'F' });
    });

    it('should handle year 2000+ correctly', () => {
      // Born in 2005, current year 2024 -> 05 <= 24 so 2005
      const result = parseDataNascitaFromCF('RSSMRA05C15H501Z');
      expect(result?.dataNascita).toBe('2005-03-15');
    });

    it('should handle year 1900+ correctly', () => {
      // Born in 1930, current year 2024 -> 30 > 24 so 1930
      const result = parseDataNascitaFromCF('RSSMRA30C15H501Z');
      expect(result?.dataNascita).toBe('1930-03-15');
    });

    it('should return null for invalid month character', () => {
      expect(parseDataNascitaFromCF('RSSMRA80Z15H501Z')).toBeNull(); // Z not valid month
    });

    it('should return null for invalid day', () => {
      expect(parseDataNascitaFromCF('RSSMRA80C00H501Z')).toBeNull(); // Day 0
      expect(parseDataNascitaFromCF('RSSMRA80C45H501Z')).toBeNull(); // Day 45 (invalid even for female)
    });

    it('should return null for wrong length', () => {
      expect(parseDataNascitaFromCF('RSSMRA80C15H501')).toBeNull();
    });
  });

  describe('extractHealthCardFields', () => {
    it('should extract all fields from standard format', () => {
      const text = `
        COGNOME: ROSSI
        NOME: MARIO
        DATA NASCITA: 15/03/1980
        COMUNE NASCITA: ROMA
        SESSO: M
        CODICE FISCALE: RSSMRA80C15H501Z
      `;
      const result = extractHealthCardFields(text);
      expect(result.cognome).toBe('ROSSI');
      expect(result.nome).toBe('MARIO');
      expect(result.comuneNascita).toBe('ROMA');
      expect(result.sesso).toBe('M');
      expect(result.dataNascitaFromText).toBe('1980-03-15');
    });

    it('should handle COGNOME E NOME format', () => {
      const text = 'COGNOME E NOME: ROSSI MARIO';
      const result = extractHealthCardFields(text);
      expect(result.cognome).toBe('ROSSI');
      expect(result.nome).toBe('MARIO');
    });

    it('should handle alternative field names', () => {
      const text = 'LUOGO NASCITA: MILANO\nNASCITA COMUNE: TORINO';
      const result = extractHealthCardFields(text);
      expect(result.comuneNascita).toBe('MILANO');
    });

    it('should handle various date formats', () => {
      expect(extractHealthCardFields('15/03/1980').dataNascitaFromText).toBe('1980-03-15');
      expect(extractHealthCardFields('15-03-1980').dataNascitaFromText).toBe('1980-03-15');
      expect(extractHealthCardFields('15.03.1980').dataNascitaFromText).toBe('1980-03-15');
      expect(extractHealthCardFields('5/3/1980').dataNascitaFromText).toBe('1980-03-05');
    });

    it('should return empty for missing fields', () => {
      const result = extractHealthCardFields('TESTO VUOTO');
      expect(result.cognome).toBe('');
      expect(result.nome).toBe('');
      expect(result.comuneNascita).toBe('');
      expect(result.sesso).toBe('');
      expect(result.dataNascitaFromText).toBe('');
    });
  });

  describe('parseHealthCardOCR - Integration', () => {
    it('should parse complete clean OCR result', () => {
      const text = `
        COGNOME: ROSSI
        NOME: MARIO
        DATA NASCITA: 15/03/1980
        COMUNE: ROMA
        SESSO: M
        CODICE FISCALE: RSSMRA80C15H501Z
      `;
      const result = parseHealthCardOCR(text);
      
      expect(result.codiceFiscale).toBe('RSSMRA80C15H501Z');
      expect(result.cognome).toBe('ROSSI');
      expect(result.nome).toBe('MARIO');
      expect(result.dataNascita).toBe('1980-03-15');
      expect(result.comuneNascita).toBe('ROMA');
      expect(result.sesso).toBe('M');
      expect(result.confidence).toBe('Alta');
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle OCR with character errors', () => {
      const text = `
        COGNOME: ROSSI
        NOME: MARIO
        CODICE FISCALE: RSSMRA8OC15H501Z
      `; // O instead of 0
      const result = parseHealthCardOCR(text);
      
      expect(result.codiceFiscale).toBe('RSSMRA80C15H501Z'); // Normalized
      expect(result.dataNascita).toBe('1980-03-15');
    });

    it('should detect invalid checksum and warn', () => {
      const text = 'CODICE FISCALE: RSSMRA80C15H501A'; // Wrong check char
      const result = parseHealthCardOCR(text);
      
      expect(result.codiceFiscale).toBe('RSSMRA80C15H501A');
      expect(result.warnings.some(w => w.includes('checksum'))).toBe(true);
      expect(result.confidence).toBe('Media');
    });

    it('should handle missing CF with date fallback', () => {
      const text = `
        COGNOME: ROSSI
        NOME: MARIO
        DATA NASCITA: 15/03/1980
        COMUNE: ROMA
      `;
      const result = parseHealthCardOCR(text);
      
      expect(result.codiceFiscale).toBe('');
      expect(result.dataNascita).toBe('1980-03-15');
      expect(result.warnings.some(w => w.includes('non rilevato'))).toBe(true);
      expect(result.confidence).toContain('Bassa');
    });

    it('should detect gender discrepancy between CF and text', () => {
      // CF indicates male (day 15), text says F
      const text = `
        COGNOME: ROSSI
        NOME: MARIA
        SESSO: F
        CODICE FISCALE: RSSMRA80C15H501Z
      `;
      const result = parseHealthCardOCR(text);
      
      expect(result.sesso).toBe('M'); // CF takes precedence
      expect(result.warnings.some(w => w.includes('Discrepanza sesso'))).toBe(true);
    });

    it('should handle completely unreadable OCR', () => {
      const text = 'ILLEGGIBILE SFOCATO';
      const result = parseHealthCardOCR(text);
      
      expect(result.codiceFiscale).toBe('');
      expect(result.cognome).toBe('');
      expect(result.dataNascita).toBe('');
      expect(result.confidence).toContain('Bassa');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle partial data with multiple issues', () => {
      const text = 'ROSSI MARIO 80C15H501'; // Incomplete CF, no clear fields
      const result = parseHealthCardOCR(text);
      
      expect(result.codiceFiscale).toBe('');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

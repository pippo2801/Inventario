import { describe, expect, it } from 'vitest';
import { parseLocalPrescriptionOCR } from '../prescriptionOCR';

describe('parseLocalPrescriptionOCR', () => {
  it('extracts explicit OD and OS values without inventing missing measurements', () => {
    const result = parseLocalPrescriptionOCR([
      'OD -1,25 -0,50 180 +1,00',
      'OS -0,75 -0,25 170 +1,00',
      'PD TOTALE 63',
      'H MONTAGGIO 20',
      'Data 12/10/2026',
    ].join('\n'));

    expect(result.od).toEqual({ sph: -1.25, cyl: -0.5, ax: 180, add: 1 });
    expect(result.os).toEqual({ sph: -0.75, cyl: -0.25, ax: 170, add: 1 });
    expect(result.pd.total).toBe(63);
    expect(result.mountingHeight).toBe(20);
    expect(result.date).toBe('2026-10-12');
    expect(result.confidence).toContain('Da verificare');
  });

  it('rejects a prescription when either eye row is not readable', () => {
    expect(() => parseLocalPrescriptionOCR('OD -1.00 -0.50 180')).toThrow(/righe OD e OS/i);
  });

  it('does not accept an out-of-range axis', () => {
    expect(() => parseLocalPrescriptionOCR('OD -1.00 -0.50 220\nOS -1.00 -0.50 90')).toThrow(/righe OD e OS/i);
  });
});

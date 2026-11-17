import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../plugins/sanitaryCardOCR', () => ({
  SanitaryCardOCR: {
    recognize: vi.fn(),
  },
}));

import { SanitaryCardOCR } from '../../plugins/sanitaryCardOCR';
import { AIService } from '../aiService';

describe('AIService local OCR errors', () => {
  const service = new AIService();
  const recognize = vi.mocked(SanitaryCardOCR.recognize);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('surfaces a health-card OCR plugin failure instead of returning empty fields', async () => {
    recognize.mockRejectedValueOnce(new Error('Plugin non disponibile'));

    await expect(service.ocrCodiceFiscale('data:image/jpeg;base64,AA=='))
      .rejects.toThrow('Plugin non disponibile');
  });

  it('rejects a health-card image when no text can be recognized', async () => {
    recognize.mockResolvedValueOnce({ text: '' });

    await expect(service.ocrCodiceFiscale('data:image/jpeg;base64,AA=='))
      .rejects.toThrow('Nessun testo');
  });

  it('surfaces a prescription OCR plugin failure', async () => {
    recognize.mockRejectedValueOnce(new Error('Plugin non disponibile'));

    await expect(service.ocrPrescription('data:image/jpeg;base64,AA=='))
      .rejects.toThrow('Plugin non disponibile');
  });
});

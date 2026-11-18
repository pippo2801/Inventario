import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('capacitor-native-ocr', () => ({
  NativeOcr: {
    isAvailable: vi.fn(),
    recognize: vi.fn(),
  },
}));

import { NativeOcr } from 'capacitor-native-ocr';
import { SanitaryCardOCR } from '../sanitaryCardOCR';

describe('SanitaryCardOCR cross-platform bridge', () => {
  const isAvailable = vi.mocked(NativeOcr.isAvailable);
  const recognize = vi.mocked(NativeOcr.recognize);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('uses on-device Italian OCR and returns the recognized text', async () => {
    isAvailable.mockResolvedValue({ available: true });
    recognize.mockResolvedValue({
      text: 'OD -1,25 -0,50 180',
      blocks: [],
      imageSize: { width: 100, height: 100 },
      rotation: 0,
    });

    await expect(SanitaryCardOCR.recognize({ image: 'data:image/jpeg;base64,AA==' }))
      .resolves.toEqual({ text: 'OD -1,25 -0,50 180' });

    expect(recognize).toHaveBeenCalledWith({
      base64: 'data:image/jpeg;base64,AA==',
      languages: ['it-IT'],
      level: 'accurate',
      languageCorrection: true,
    });
  });

  it('fails clearly when native OCR is unavailable', async () => {
    isAvailable.mockResolvedValue({ available: false });

    await expect(SanitaryCardOCR.recognize({ image: 'AA==' }))
      .rejects.toThrow('OCR nativo non disponibile');
    expect(recognize).not.toHaveBeenCalled();
  });

  it('rejects empty image data before invoking the native plugin', async () => {
    await expect(SanitaryCardOCR.recognize({ image: ' ' }))
      .rejects.toThrow('Immagine mancante');
    expect(isAvailable).not.toHaveBeenCalled();
  });
});

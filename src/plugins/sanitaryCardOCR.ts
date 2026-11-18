import { NativeOcr } from 'capacitor-native-ocr';

export interface SanitaryCardOCRPlugin {
  recognize(options: {
    image: string;
  }): Promise<{
    text: string;
  }>;
}

/**
 * Shared on-device OCR bridge.
 * Apple Vision is used on iOS and ML Kit on Android by capacitor-native-ocr.
 * The image remains on-device; no OCR image is uploaded to a remote service.
 */
export const SanitaryCardOCR: SanitaryCardOCRPlugin = {
  async recognize({ image }) {
    if (!image?.trim()) {
      throw new Error('Immagine mancante');
    }

    const { available } = await NativeOcr.isAvailable();
    if (!available) {
      throw new Error('OCR nativo non disponibile su questo dispositivo.');
    }

    const result = await NativeOcr.recognize({
      base64: image,
      languages: ['it-IT'],
      level: 'accurate',
      languageCorrection: true,
    });

    return { text: result.text || '' };
  },
};

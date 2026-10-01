import { registerPlugin } from '@capacitor/core';

export interface SanitaryCardOCRPlugin {
  recognize(options: {
    image: string;
  }): Promise<{
    text: string;
  }>;
}

export const SanitaryCardOCR = registerPlugin<SanitaryCardOCRPlugin>(
  'SanitaryCardOCR'
);

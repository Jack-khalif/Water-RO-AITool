declare module 'tesseract.js' {
  export interface RecognizeResult {
    data: {
      text: string;
      confidence: number;
    };
  }

  export const createWorker: () => Promise<{
    loadLanguage: (lang: string) => Promise<void>;
    initialize: (lang: string) => Promise<void>;
    recognize: (image: string | Buffer) => Promise<RecognizeResult>;
    terminate: () => Promise<void>;
  }>;
}

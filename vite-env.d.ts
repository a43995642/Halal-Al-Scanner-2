// Removed missing vite/client reference to fix type error

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_GOOGLE_API_KEY: string;
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global augmentation for process.env to allow accessing process.env.API_KEY safely in TS
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      VITE_API_KEY: string;
    }
  }
}

// export statement makes this file a module, which allows declare global to work correctly
export {};
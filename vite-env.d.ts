// Removed missing vite/client reference to fix type error

export {};

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_KEY: string;
    readonly VITE_GOOGLE_API_KEY: string;
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly BASE_URL: string;
    readonly MODE: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly SSR: boolean;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      VITE_API_KEY: string;
    }
  }
}

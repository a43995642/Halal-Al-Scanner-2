import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');

  // Prioritize variables: 
  // 1. System/Shell Env (Vercel/CI) -> process.env.API_KEY
  // 2. Local .env file -> env.API_KEY
  // 3. Fallbacks for VITE_ prefixed keys
  const apiKey = process.env.API_KEY || process.env.VITE_API_KEY || env.API_KEY || env.VITE_API_KEY || '';

  // Log warning during build if key is missing (helps debugging in Vercel logs)
  if (!apiKey) {
    console.warn('⚠️ WARNING: API_KEY is missing in build environment. The app will not work correctly.');
  } else {
    // Log success but hide the actual key for security (show only length)
    console.log(`✅ API_KEY found (Length: ${apiKey.length}) and will be injected into the app.`);
  }

  return {
    plugins: [react()],
    // This is critical for Android/Capacitor:
    // It ensures assets are loaded from './' instead of '/'
    base: './',
    define: {
      // Inject API_KEY from system environment or .env file into the client code.
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false
    },
    server: {
      port: 3000,
    }
  };
});
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    // This is critical for Android/Capacitor:
    // It ensures assets are loaded from './' instead of '/'
    base: './',
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
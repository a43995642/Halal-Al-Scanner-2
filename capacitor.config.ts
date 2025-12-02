import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.halalscanner.app',
  appName: 'Halal Scanner',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'localhost' // Ensures origin is https://localhost
  },
  plugins: {
    // Basic plugin configuration if needed
  }
};

export default config;
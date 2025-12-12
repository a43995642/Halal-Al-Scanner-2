
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
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#059669",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },
  }
};

export default config;

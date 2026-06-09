import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.oilloop.app',
  appName: 'OilLoop',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

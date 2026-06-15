import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.frytofly.app',
  appName: 'FrytoFly',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

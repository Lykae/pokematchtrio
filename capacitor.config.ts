import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'at.lykae.pokematchtrio',
  appName: 'pokematch',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.florestbook.app',
  appName: 'Florest Book',
  webDir: 'www',
  android: {
    // O jogo tem fundo ilustrado proprio; sem isso aparece um flash branco.
    backgroundColor: '#1F6B3B',
  },
};

export default config;

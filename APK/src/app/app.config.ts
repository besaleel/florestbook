import {
  ApplicationConfig,
  provideZoneChangeDetection,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { IDIOMA_PADRAO } from './core/services/settings.service';
import { I18nService } from './core/services/i18n.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ mode: 'md' }),
    provideRouter(routes),
    provideHttpClient(),

    // JSON local em assets/i18n/ — nenhum download em tempo de execucao
    // (ESPECIFICATION 1: o jogo funciona 100% offline).
    provideTranslateService({
      fallbackLang: IDIOMA_PADRAO,
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    }),

    // Carrega preferencias e resolve o idioma antes de exibir a primeira tela.
    provideAppInitializer(() => inject(I18nService).iniciar()),
  ],
};

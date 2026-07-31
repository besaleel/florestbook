import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Idioma, IDIOMA_PADRAO, IDIOMAS, SettingsService } from './settings.service';

/**
 * Idioma da interface (BACKLOG 2.4-2.8).
 *
 * No primeiro uso adota o idioma do aparelho; se ele nao estiver entre os seis
 * suportados, recua para EN. Depois disso vale sempre a escolha persistida.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly translate = inject(TranslateService);
  private readonly settings = inject(SettingsService);

  async iniciar(): Promise<void> {
    await this.settings.carregar();

    // `carregar()` so sobrescreve o sinal se havia valor salvo. Se continua no
    // padrao, e o primeiro uso: ai vale o idioma do aparelho.
    const salvo = await this.temIdiomaSalvo();
    const idioma = salvo ? this.settings.idioma() : this.idiomaDoAparelho();

    this.translate.addLangs([...IDIOMAS]);
    this.translate.setFallbackLang(IDIOMA_PADRAO);
    await this.usar(idioma);
  }

  /** Troca o idioma e persiste. A troca e imediata na interface. */
  async usar(idioma: Idioma): Promise<void> {
    await this.settings.definirIdioma(idioma);
    this.translate.use(idioma);
  }

  /**
   * Primeiro idioma do aparelho que esteja entre os suportados, com recuo
   * para EN. `navigator.languages` traz 'pt-BR', 'en-US' etc — comparamos so
   * a parte primaria.
   */
  private idiomaDoAparelho(): Idioma {
    const preferidos = navigator.languages?.length
      ? navigator.languages
      : [navigator.language ?? IDIOMA_PADRAO];

    for (const tag of preferidos) {
      const primario = tag.toLowerCase().split('-')[0];
      if ((IDIOMAS as readonly string[]).includes(primario)) {
        return primario as Idioma;
      }
    }
    return IDIOMA_PADRAO;
  }

  private async temIdiomaSalvo(): Promise<boolean> {
    const { Preferences } = await import('@capacitor/preferences');
    const { value } = await Preferences.get({ key: 'idioma' });
    return value !== null;
  }
}

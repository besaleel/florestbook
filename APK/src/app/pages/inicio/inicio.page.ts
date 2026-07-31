import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

import { I18nService } from '../../core/services/i18n.service';
import { Idioma, IDIOMAS, SettingsService } from '../../core/services/settings.service';
import { BackgroundService } from '../../core/services/background.service';
import { abrirDocumentoLegal } from '../../core/legal';

/** Bandeira de cada idioma para o seletor (BACKLOG 3.3). */
const BANDEIRAS: Record<Idioma, string> = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  it: '🇮🇹',
  de: '🇩🇪',
};

/** Rotulo de cada idioma no seletor, no proprio idioma. */
const NOMES_IDIOMA: Record<Idioma, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  de: 'Deutsch',
};

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [IonContent, FormsModule, TranslatePipe],
  templateUrl: './inicio.page.html',
  styleUrl: './inicio.page.scss',
})
export class InicioPage implements OnInit {
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  protected readonly settings = inject(SettingsService);
  private readonly fundo = inject(BackgroundService);

  protected readonly idiomas = IDIOMAS;
  protected readonly bandeiras = BANDEIRAS;
  protected readonly nomesIdioma = NOMES_IDIOMA;
  protected readonly nome = signal('');
  protected readonly painelIdioma = signal(false);

  async ngOnInit(): Promise<void> {
    // A selecao sazonal ja roda aqui para a floresta abrir no tema certo.
    await this.fundo.iniciar();
    this.nome.set(this.settings.nome());
  }

  protected alternarPainelIdioma(): void {
    this.painelIdioma.update((aberto) => !aberto);
  }

  protected async trocarIdioma(idioma: Idioma): Promise<void> {
    await this.i18n.usar(idioma);
    // O idioma influencia a selecao sazonal (Festa Junina e so em PT).
    await this.fundo.aplicarSazonal();
    this.painelIdioma.set(false);
  }

  protected async alternarSom(): Promise<void> {
    await this.settings.definirSom(!this.settings.som());
  }

  protected async abrirDocumento(qual: 'termos' | 'privacidade'): Promise<void> {
    await abrirDocumentoLegal(qual);
  }

  /** O nome e opcional: o jogo comeca normalmente sem ele. */
  protected async comecar(): Promise<void> {
    await this.settings.definirNome(this.nome());
    await this.router.navigateByUrl('/floresta');
  }
}

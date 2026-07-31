import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

import { I18nService } from '../../core/services/i18n.service';
import { Idioma, IDIOMAS, SettingsService } from '../../core/services/settings.service';
import { BackgroundService } from '../../core/services/background.service';

/** Bandeira de cada idioma para o seletor (BACKLOG 3.3). */
const BANDEIRAS: Record<Idioma, string> = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  it: '🇮🇹',
  de: '🇩🇪',
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
  protected readonly fundo = inject(BackgroundService);

  protected readonly idiomas = IDIOMAS;
  protected readonly bandeiras = BANDEIRAS;
  protected readonly nome = signal('');

  async ngOnInit(): Promise<void> {
    await this.fundo.iniciar();
    this.nome.set(this.settings.nome());
  }

  protected async trocarIdioma(idioma: Idioma): Promise<void> {
    await this.i18n.usar(idioma);
    // O idioma influencia a selecao sazonal (Festa Junina e so em PT).
    await this.fundo.aplicarSazonal();
  }

  protected async alternarSom(): Promise<void> {
    await this.settings.definirSom(!this.settings.som());
  }

  /** O nome e opcional: o jogo comeca normalmente sem ele. */
  protected async comecar(): Promise<void> {
    await this.settings.definirNome(this.nome());
    await this.router.navigateByUrl('/floresta');
  }
}

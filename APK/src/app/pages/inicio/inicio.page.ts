import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

import { I18nService } from '../../core/services/i18n.service';
import { Idioma, IDIOMAS, SettingsService } from '../../core/services/settings.service';
import { BackgroundService } from '../../core/services/background.service';
import { BillingService } from '../../core/services/billing.service';
import { abrirDocumentoLegal } from '../../core/legal';
import { abrirFarmBook } from '../../core/cross-promo';

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
  private readonly billing = inject(BillingService);

  protected readonly idiomas = IDIOMAS;
  protected readonly bandeiras = BANDEIRAS;
  protected readonly nomesIdioma = NOMES_IDIOMA;
  protected readonly nome = signal('');
  protected readonly painelIdioma = signal(false);

  /** Barreira parental do banner do FarmBook (BACKLOG 8.6). */
  protected readonly painelFarmBook = signal(false);
  protected readonly barreiraA = signal(0);
  protected readonly barreiraB = signal(0);
  protected readonly respostaBarreira = signal('');
  protected readonly erroBarreira = signal(false);

  async ngOnInit(): Promise<void> {
    // A selecao sazonal ja roda aqui para a floresta abrir no tema certo.
    await this.fundo.iniciar();
    this.nome.set(this.settings.nome());

    // O estado persistido de `semAnuncios` ja veio do disco antes desta tela,
    // entao quem comprou nunca chega a ver o banner. Esta consulta cobre o
    // caso da REINSTALACAO, em que o disco esta limpo mas a compra existe na
    // conta Google: sem ela, o banner apareceria ate a primeira visita a
    // floresta (BACKLOG 6.9, 6.10). Sem await — a tela nao espera a rede.
    void this.billing.iniciar();
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

  /**
   * Interruptor GERAL de audio da tela inicial: liga/desliga musica e sons
   * dos animais juntos. Os controles separados ficam na tela da floresta.
   */
  protected async alternarSom(): Promise<void> {
    const ligar = !(this.settings.som() || this.settings.musica());
    await Promise.all([
      this.settings.definirSom(ligar),
      this.settings.definirMusica(ligar),
    ]);
  }

  protected async abrirDocumento(qual: 'termos' | 'privacidade'): Promise<void> {
    await abrirDocumentoLegal(qual);
  }

  /**
   * O banner do FarmBook leva para fora do app, entao passa SEMPRE pela mesma
   * barreira parental da loja (BACKLOG 6.11, 8.6): uma multiplicacao de
   * fatores 6 a 9, que a crianca de 2-6 anos nao resolve.
   */
  protected abrirFarmBookComBarreira(): void {
    this.barreiraA.set(6 + Math.floor(Math.random() * 4));
    this.barreiraB.set(6 + Math.floor(Math.random() * 4));
    this.respostaBarreira.set('');
    this.erroBarreira.set(false);
    this.painelFarmBook.set(true);
  }

  protected async confirmarBarreiraFarmBook(): Promise<void> {
    const certo = Number(this.respostaBarreira()) === this.barreiraA() * this.barreiraB();
    if (!certo) {
      this.erroBarreira.set(true);
      this.respostaBarreira.set('');
      return;
    }
    this.painelFarmBook.set(false);
    await abrirFarmBook();
  }

  /** O nome e opcional: o jogo comeca normalmente sem ele. */
  protected async comecar(): Promise<void> {
    await this.settings.definirNome(this.nome());
    await this.router.navigateByUrl('/floresta');
  }
}

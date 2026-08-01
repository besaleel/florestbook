import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { App } from '@capacitor/app';

import { Animal, ChaveAnimal } from '../../core/models/animal.model';
import { ChaveTema, TEMAS } from '../../core/models/tema.model';
import { AdsService } from '../../core/services/ads.service';
import { BillingService } from '../../core/services/billing.service';
import { AnimalService } from '../../core/services/animal.service';
import { AudioService } from '../../core/services/audio.service';
import { BackgroundService } from '../../core/services/background.service';
import { HitTestService } from '../../core/services/hit-test.service';
import { Idioma, IDIOMAS, SettingsService } from '../../core/services/settings.service';
import { I18nService } from '../../core/services/i18n.service';
import { FaixaNomeComponent } from '../../components/faixa-nome/faixa-nome.component';
import { abrirDocumentoLegal } from '../../core/legal';

/**
 * Duracao da faixa do nome: 4,5 s para TODOS os animais (ESPECIFICATION 3.4).
 *
 * Dimensionada pelos sons mais longos (lobo 4,02 s e macaco 4,00 s) com margem
 * de 0,5 s. Uniforme de proposito: um animal cujo nome sumisse mais cedo que o
 * dos outros seria imprevisivel para a crianca.
 */
const DURACAO_FAIXA_MS = 4500;

/** Duracao da animacao de reacao ao toque (ESPECIFICATION 2.2). */
const DURACAO_REACAO_MS = 600;

type Painel = 'idioma' | 'background' | 'nome' | 'compra' | null;

/** Etapas do fluxo de compra: barreira parental primeiro (BACKLOG 6.11). */
type EtapaCompra = 'barreira' | 'loja';

const BANDEIRAS: Record<Idioma, string> = {
  pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷', it: '🇮🇹', de: '🇩🇪',
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
  selector: 'app-floresta',
  standalone: true,
  imports: [IonContent, TranslatePipe, FaixaNomeComponent],
  templateUrl: './floresta.page.html',
  styleUrl: './floresta.page.scss',
})
export class FlorestaPage implements OnInit {
  protected readonly ads = inject(AdsService);
  protected readonly billing = inject(BillingService);
  private readonly animais = inject(AnimalService);
  private readonly audio = inject(AudioService);
  private readonly hitTest = inject(HitTestService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly fundo = inject(BackgroundService);
  protected readonly settings = inject(SettingsService);

  protected readonly lista = this.animais.listar();
  protected readonly idiomas = IDIOMAS;
  protected readonly bandeiras = BANDEIRAS;
  protected readonly nomesIdioma = NOMES_IDIOMA;

  /** Rascunho do nome enquanto o campo de edicao esta aberto. */
  protected readonly rascunhoNome = signal('');

  /** Animal exibido na faixa; `null` = faixa escondida. */
  protected readonly animalNaFaixa = signal<Animal | null>(null);

  /** Animal em animacao de reacao ao toque. */
  protected readonly reagindo = signal<ChaveAnimal | null>(null);

  protected readonly painel = signal<Painel>(null);

  // --- Fluxo de compra (BACKLOG 6.7-6.12) ---
  protected readonly etapaCompra = signal<EtapaCompra>('barreira');
  protected readonly barreiraA = signal(0);
  protected readonly barreiraB = signal(0);
  protected readonly respostaBarreira = signal('');
  protected readonly erroBarreira = signal(false);
  protected readonly avisoCompra = signal<'nadaARestaurar' | null>(null);

  /** Temas do seletor: todos os que existem, em qualquer idioma e epoca. */
  protected readonly temas = this.fundo.temasDoSeletor;

  private timerFaixa?: ReturnType<typeof setTimeout>;
  private timerReacao?: ReturnType<typeof setTimeout>;

  constructor() {
    // Trocar de idioma reavalia a sazonalidade (Festa Junina so vale em PT).
    effect(() => {
      this.settings.idioma();
      void this.fundo.aplicarSazonal();
    });

    this.destroyRef.onDestroy(() => {
      clearTimeout(this.timerFaixa);
      clearTimeout(this.timerReacao);
    });
  }

  async ngOnInit(): Promise<void> {
    await this.fundo.iniciar();
    this.audio.precarregar();
    // Mapas de opacidade para o toque por pixel (BACKLOG 4.4).
    void this.hitTest.precarregar(this.lista.map((a) => a.chave));
    // Banner do rodape. Sem rede, falha em silencio e o espaco recolhe.
    void this.ads.iniciar();
    // Billing: recupera compra ja feita e busca o preco (BACKLOG 6.8, 6.10).
    void this.billing.iniciar();

    // Reavalia o tema ao voltar do segundo plano: o app pode ter ficado
    // aberto durante a virada de uma janela sazonal (BACKLOG 4B.10).
    void App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void this.fundo.aplicarSazonal();
    });
  }

  protected imagem(animal: Animal): string {
    return this.animais.imagem(animal.chave);
  }

  /** Animais da frente cobrem os do fundo, inclusive durante as animacoes. */
  protected camada(animal: Animal): number {
    return animal.fileira === 'frente' ? 20 : 10;
  }

  /**
   * Resolve o toque no palco (BACKLOG 4.4).
   *
   * As caixas dos animais se sobrepoem (leao x lobo em 29%, elefante x macaco
   * em 21%), mas a sobreposicao deve ser SO VISUAL. Percorremos os candidatos
   * da FRENTE para o FUNDO e ficamos com o primeiro cujo pixel tocado seja
   * opaco — assim o animal da frente vence a regiao disputada e o toque na
   * area transparente dele atravessa para quem esta atras.
   */
  protected async tocarNoPalco(evento: PointerEvent): Promise<void> {
    // A barra superior, os paineis e o rodape tem os proprios handlers; o
    // palco so responde por toques que nao vieram de um controle.
    if ((evento.target as HTMLElement).closest('button, .painel, .rodape')) return;

    const palco = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    if (!palco.width || !palco.height) return;

    // Posicao do toque em % do palco.
    const px = ((evento.clientX - palco.left) / palco.width) * 100;
    const py = ((evento.clientY - palco.top) / palco.height) * 100;

    // Como o asset e 1024x1536 e o palco tem a mesma proporcao, a altura do
    // animal em % da ALTURA do palco e igual a sua largura em % da LARGURA.
    const candidatos = [...this.lista].sort(
      (a, b) => this.camada(b) - this.camada(a),
    );

    for (const animal of candidatos) {
      const meia = animal.largura / 2;
      const u = (px - (animal.x - meia)) / animal.largura;
      const v = (py - (animal.y - meia)) / animal.largura;

      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      if (!this.hitTest.opaco(animal.chave, u, v)) continue;

      await this.tocar(animal);
      return;
    }

    // Toque no cenario: fecha qualquer painel aberto.
    this.painel.set(null);
  }

  /**
   * Toque no animal: som + reacao + faixa, os tres ao mesmo tempo
   * (ESPECIFICATION 4.2).
   */
  protected async tocar(animal: Animal): Promise<void> {
    this.painel.set(null);

    // Primeiro gesto do usuario: e aqui que o navegador libera o audio, entao
    // a musica de fundo comeca junto com o primeiro animal tocado.
    void this.audio.liberarComGesto();
    void this.audio.tocarAnimal(animal.chave);

    // Reinicia a animacao de reacao mesmo se o mesmo animal for tocado de novo.
    clearTimeout(this.timerReacao);
    this.reagindo.set(null);
    requestAnimationFrame(() => this.reagindo.set(animal.chave));
    this.timerReacao = setTimeout(() => this.reagindo.set(null), DURACAO_REACAO_MS);

    // Tocar outro animal antes dos 4,5 s troca a faixa e REINICIA o timer.
    clearTimeout(this.timerFaixa);
    this.animalNaFaixa.set(animal);
    this.timerFaixa = setTimeout(() => this.animalNaFaixa.set(null), DURACAO_FAIXA_MS);
  }

  protected alternarPainel(qual: Exclude<Painel, null>): void {
    this.painel.update((atual) => (atual === qual ? null : qual));
  }

  /** Toque no cracha abre a edicao do nome, ja com o valor atual. */
  protected editarNome(): void {
    this.rascunhoNome.set(this.settings.nome());
    this.painel.set('nome');
  }

  protected async salvarNome(): Promise<void> {
    await this.settings.definirNome(this.rascunhoNome());
    this.painel.set(null);
  }

  /**
   * Abre um documento legal no navegador do sistema, nunca dentro do app.
   * A Politica para Familias exige que links externos saiam do contexto
   * infantil (ESPECIFICATION 6.1, BACKLOG 7.5).
   */
  protected async abrirDocumento(qual: 'termos' | 'privacidade'): Promise<void> {
    await abrirDocumentoLegal(qual);
  }

  protected async trocarIdioma(idioma: Idioma): Promise<void> {
    await this.i18n.usar(idioma);
    this.painel.set(null);
  }

  /** A escolha manual congela a selecao automatica para sempre. */
  protected async trocarTema(chave: ChaveTema): Promise<void> {
    await this.fundo.escolherManualmente(chave);
    this.painel.set(null);
  }

  /** Sons dos animais — independente da musica de fundo. */
  protected async alternarSom(): Promise<void> {
    await this.settings.definirSom(!this.settings.som());
  }

  /** Musica de fundo — independente dos sons dos animais. */
  protected async alternarMusica(): Promise<void> {
    const ligada = !this.settings.musica();
    await this.settings.definirMusica(ligada);
    // Ligar a musica e um gesto do usuario: aproveita para liberar o autoplay.
    if (ligada) await this.audio.liberarComGesto();
  }

  /**
   * Abre o fluxo de compra SEMPRE pela barreira parental (BACKLOG 6.11):
   * uma multiplicacao que a crianca de 2-6 anos nao resolve. Fatores de 6 a 9
   * para nao sair trivial (6x7 em vez de 2x2).
   */
  protected abrirCompra(): void {
    this.barreiraA.set(6 + Math.floor(Math.random() * 4));
    this.barreiraB.set(6 + Math.floor(Math.random() * 4));
    this.respostaBarreira.set('');
    this.erroBarreira.set(false);
    this.avisoCompra.set(null);
    this.etapaCompra.set('barreira');
    this.painel.set('compra');
  }

  protected confirmarBarreira(): void {
    const certo = Number(this.respostaBarreira()) === this.barreiraA() * this.barreiraB();
    if (!certo) {
      this.erroBarreira.set(true);
      this.respostaBarreira.set('');
      return;
    }
    this.etapaCompra.set('loja');
  }

  /**
   * Compra via Google Play (BACKLOG 6.7). Sucesso fecha o painel e o banner
   * some sozinho (o rodape observa `semAnuncios`). Falha ou cancelamento
   * apenas devolve ao jogo, sem bloqueio (BACKLOG 6.12).
   */
  protected async comprarRemocao(): Promise<void> {
    await this.billing.comprar();
    // Sucesso ou nao, o jogo volta ao normal: com a compra o banner some
    // sozinho (o rodape observa `semAnuncios`); sem ela nada muda.
    this.painel.set(null);
  }

  /** Restauracao manual para reinstalacao ou troca de aparelho (6.10). */
  protected async restaurarCompra(): Promise<void> {
    const restaurado = await this.billing.restaurar();
    if (restaurado) {
      this.painel.set(null);
      return;
    }
    this.avisoCompra.set('nadaARestaurar');
  }

  protected rotuloTema(chave: ChaveTema): string {
    return `temas.${chave}`;
  }

  protected assetDoTema(chave: ChaveTema): string {
    const tema = TEMAS.find((t) => t.chave === chave);
    return `assets/images/${tema?.asset ?? 'background.webp'}`;
  }
}

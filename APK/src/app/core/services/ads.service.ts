import { Injectable, computed, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  AdMobBannerSize,
  MaxAdContentRating,
} from '@capacitor-community/admob';

import { SettingsService } from './settings.service';

/**
 * Bloco de anuncios de TESTE, publico do Google. Clicar nele e seguro.
 * (ESPECIFICATION 7, BACKLOG 6.13)
 */
const BLOCO_TESTE = 'ca-app-pub-3940256099942544/6300978111';

/**
 * Bloco de PRODUCAO do Florest Book, formato BANNER. Nunca clicar.
 *
 * O bloco anterior (`.../8466632581`) era do formato "Nativo avancado" e por
 * isso NUNCA preenchia: o app pede `showBanner()`, e um bloco nativo nao
 * responde a um pedido de banner — sem erro, so sem anuncio. Foi a causa do
 * rodape vazio nos testes de 01/08/2026. Formato do bloco e formato do pedido
 * precisam bater; se um dia o rodape voltar a ficar vazio, conferir isto
 * ANTES de mexer no resto.
 */
const BLOCO_PRODUCAO = 'ca-app-pub-3480885465464323/2258417075';

/**
 * Anuncios (ESPECIFICATION 6.1, BACKLOG 6.1-6.5, 6.13).
 *
 * ## Politica para Familias — obrigatorio, nao opcional
 *
 * O publico declarado inclui criancas, entao a configuracao padrao do AdMob
 * REPROVA o app na revisao mesmo funcionando. Sao tres exigencias:
 *   - `tagForChildDirectedTreatment` ligado;
 *   - anuncios NAO personalizados (`npa: '1'`);
 *   - filtro de conteudo restrito ao publico infantil.
 *
 * ## Teste x producao
 *
 * A decisao esta concentrada em `producao()`: QUALQUER build rodando em
 * aparelho usa o bloco de PRODUCAO — decisao de 01/08/2026, para validar o
 * resultado real (area do banner, altura, preenchimento) no celular de testes
 * antes de publicar. O bloco de teste do Google fica reservado ao navegador.
 *
 * ⚠️ Consequencia: NUNCA clicar em anuncio no aparelho, nem em build de
 * debug — o Google trata clique do desenvolvedor como fraude e suspende a
 * conta AdMob. Ver o anuncio na tela e seguro; o clique nao e.
 *
 * O App ID (`ca-app-pub-3480885465464323~9513221026`) e sempre o de producao e
 * fica no AndroidManifest — so o BLOCO alterna.
 */
@Injectable({ providedIn: 'root' })
export class AdsService {
  private readonly settings = inject(SettingsService);

  /** Altura do banner em px, para o layout reservar espaco exato. */
  readonly alturaBanner = signal(0);

  /**
   * PREVIA DE LAYOUT (temporaria, 01/08/2026).
   *
   * Enquanto o bloco de banner novo nao comeca a servir, o espaco do anuncio
   * fica com altura 0 e nao da para julgar o enquadramento final da tela.
   * Com isto ligado, uma faixa clara ocupa a altura REAL de um banner
   * adaptativo, mostrando como a tela vai ficar com o anuncio no lugar.
   *
   * ⚠️ Voltar para `false` antes de publicar: em producao o espaco deve
   * aparecer somente quando existe anuncio de verdade (BACKLOG 6.5).
   * Desligada na 1.2.1 justamente por isso — so religar em teste local.
   */
  readonly previaDeLayout = signal(false);

  /** Altura tipica de um banner adaptativo em celular (dp ~= px em mdpi). */
  private readonly ALTURA_PREVIA = 60;

  /**
   * Altura que o layout deve reservar: a do anuncio real ou, na previa, a
   * altura simulada. Um banner real que chegue durante a previa tem
   * precedencia — nunca queremos a faixa falsa por cima do anuncio.
   */
  readonly alturaReservada = computed(() => {
    const real = this.alturaBanner();
    if (real > 0) return real;
    return this.previaDeLayout() ? this.ALTURA_PREVIA : 0;
  });

  /** `true` so quando a faixa mostrada e a simulada, nao um anuncio real. */
  readonly mostrandoPrevia = computed(
    () => this.previaDeLayout() && this.alturaBanner() === 0,
  );

  private iniciado = false;

  /**
   * `true` em QUALQUER aparelho real (debug ou release): o bloco de producao
   * vale para todo build nativo, para o teste em aparelho mostrar o banner
   * real. No navegador (`ionic serve`) segue o bloco de teste do Google.
   */
  private producao(): boolean {
    return Capacitor.isNativePlatform();
  }

  private get bloco(): string {
    return this.producao() ? BLOCO_PRODUCAO : BLOCO_TESTE;
  }

  /**
   * Inicializa o SDK. Falha de rede NUNCA quebra o jogo: sem anuncio, o
   * espaco simplesmente nao aparece (ESPECIFICATION 6, BACKLOG 6.5).
   */
  async iniciar(): Promise<void> {
    if (this.iniciado || !Capacitor.isNativePlatform()) return;
    if (this.settings.semAnuncios()) return;

    try {
      // As tres exigencias da Politica para Familias vao AQUI, na
      // inicializacao do SDK — nao basta o `npa` do banner. Sem o
      // `tagForChildDirectedTreatment` o SDK pede inventario que nao pode ser
      // servido a um app dirigido a criancas e a resposta volta sem
      // preenchimento: banner vazio, sem erro. Junto com a permissao AD_ID
      // ausente no manifesto, foi o que deixou o rodape em branco no teste em
      // aparelho de 01/08/2026.
      await AdMob.initialize({
        initializeForTesting: !this.producao(),
        tagForChildDirectedTreatment: true,
        tagForUnderAgeOfConsent: true,
        maxAdContentRating: MaxAdContentRating.General,
      });

      // O layout so reserva o espaco quando o banner REALMENTE carrega: assim
      // um aparelho offline nao fica com uma faixa vazia no rodape.
      await AdMob.addListener(
        BannerAdPluginEvents.SizeChanged,
        (tamanho: AdMobBannerSize) => this.alturaBanner.set(tamanho.height ?? 0),
      );
      await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () =>
        this.alturaBanner.set(0),
      );

      // Anuncio de verdade na tela: a previa de layout sai de cena. Enquanto
      // o bloco novo nao servir, este evento nao chega e a faixa simulada
      // continua ali, que e justamente o que se quer conferir.
      await AdMob.addListener(BannerAdPluginEvents.Loaded, () =>
        this.previaDeLayout.set(false),
      );

      this.iniciado = true;
      await this.mostrarBanner();
    } catch {
      // Offline ou SDK indisponivel: segue sem anuncio.
      this.alturaBanner.set(0);
    }
  }

  async mostrarBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.settings.semAnuncios()) return;

    const opcoes: BannerAdOptions = {
      adId: this.bloco,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: !this.producao(),
      // Anuncios nao personalizados: sem isso o app e reprovado na revisao.
      npa: true,
    };

    try {
      await AdMob.showBanner(opcoes);
    } catch {
      this.alturaBanner.set(0);
    }
  }

  /** Chamado apos a compra: remove o banner permanentemente (BACKLOG 6.9). */
  async removerBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.removeBanner();
    } catch {
      // Ja removido ou nunca exibido.
    }
    this.alturaBanner.set(0);
  }
}

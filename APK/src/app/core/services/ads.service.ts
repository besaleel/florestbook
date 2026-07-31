import { Injectable, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  AdMobBannerSize,
} from '@capacitor-community/admob';

import { SettingsService } from './settings.service';

/**
 * Bloco de anuncios de TESTE, publico do Google. Clicar nele e seguro.
 * (ESPECIFICATION 7, BACKLOG 6.13)
 */
const BLOCO_TESTE = 'ca-app-pub-3940256099942544/6300978111';

/** Bloco de PRODUCAO do Florest Book. Nunca clicar. */
const BLOCO_PRODUCAO = 'ca-app-pub-3480885465464323/8466632581';

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
 * A decisao esta concentrada em `producao()`: builds de DEBUG usam o bloco de
 * teste e builds de RELEASE usam o de producao. Assim o teste em aparelho e
 * seguro (clicar no anuncio de teste nao e fraude) e o AAB publicado ja sai
 * monetizando, sem depender de alguem lembrar de trocar uma constante.
 *
 * O App ID (`ca-app-pub-3480885465464323~9513221026`) e sempre o de producao e
 * fica no AndroidManifest — so o BLOCO alterna.
 */
@Injectable({ providedIn: 'root' })
export class AdsService {
  private readonly settings = inject(SettingsService);

  /** Altura do banner em px, para o layout reservar espaco exato. */
  readonly alturaBanner = signal(0);

  private iniciado = false;

  /**
   * `true` em build de release num aparelho real.
   *
   * `ngDevMode` e removido pelo compilador em producao, entao esta condicao e
   * resolvida em tempo de build — nao ha risco de o bloco de producao vazar
   * para um build de debug.
   */
  private producao(): boolean {
    return Capacitor.isNativePlatform() && !ngDevMode;
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
      await AdMob.initialize({
        initializeForTesting: !this.producao(),
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

import { Injectable, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

import { AdsService } from './ads.service';
import { SettingsService } from './settings.service';

/**
 * Produto unico do app: remocao de anuncios, NAO-CONSUMIVEL. O identificador
 * deve existir com este exato nome na Play Console (ESPECIFICATION 6.2).
 */
export const PRODUTO_REMOVE_ADS = 'remove_ads';

/** `purchaseState === '1'` e PURCHASED no Android; '2' e compra pendente. */
const ESTADO_COMPRADO = '1';

/**
 * Google Play Billing (ESPECIFICATION 6.2, BACKLOG 6.6-6.12).
 *
 * Plugin: @capgo/native-purchases, com Play Billing Library 8 — versao minima
 * exigida pelo Google desde agosto/2026.
 *
 * Regras de negocio:
 *  - o preco exibido vem SEMPRE do Google Play, nunca fixo no codigo (6.8);
 *  - falha ou cancelamento devolve ao jogo sem bloquear nada (6.12);
 *  - a compra e verificada na abertura (getPurchases), entao reinstalacao ou
 *    troca de aparelho recupera sozinha — alem do botao "Restaurar" (6.10).
 */
@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly settings = inject(SettingsService);
  private readonly ads = inject(AdsService);

  /** Preco formatado pelo Google Play (ex.: "R$ 9,90"); null = indisponivel. */
  readonly preco = signal<string | null>(null);

  /** Compra em andamento: desabilita os botoes para evitar toque duplo. */
  readonly processando = signal(false);

  /**
   * Consulta silenciosa na abertura do app: recupera compra ja feita
   * (reinstalacao, troca de aparelho) e busca o preco para a loja.
   * Qualquer falha e ignorada — sem Play Services o jogo segue normal.
   */
  async iniciar(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const { isBillingSupported } = await NativePurchases.isBillingSupported();
      if (!isBillingSupported) return;
    } catch {
      return;
    }

    await this.sincronizarCompra();

    if (!this.settings.semAnuncios()) {
      await this.carregarPreco();
    }
  }

  /**
   * Fluxo de compra (6.7). Retorna `true` somente com a compra confirmada.
   * Cancelamento e erro caem no mesmo lugar: jogo segue com anuncios (6.12).
   */
  async comprar(): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || this.processando()) return false;

    this.processando.set(true);
    try {
      const transacao = await NativePurchases.purchaseProduct({
        productIdentifier: PRODUTO_REMOVE_ADS,
        productType: PURCHASE_TYPE.INAPP,
      });
      // Compra PENDENTE (ex.: boleto) ainda nao da o direito; ela sera
      // reconhecida por getPurchases() na proxima abertura, quando confirmar.
      if (transacao.purchaseState && transacao.purchaseState !== ESTADO_COMPRADO) {
        return false;
      }
      await this.concederRemocao();
      return true;
    } catch {
      return false;
    } finally {
      this.processando.set(false);
    }
  }

  /** Restauracao manual (6.10). Retorna `true` se havia compra para restaurar. */
  async restaurar(): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || this.processando()) return false;

    this.processando.set(true);
    try {
      await NativePurchases.restorePurchases();
      await this.sincronizarCompra();
      return this.settings.semAnuncios();
    } catch {
      return false;
    } finally {
      this.processando.set(false);
    }
  }

  /** Confere no Google Play se `remove_ads` ja pertence a este usuario. */
  private async sincronizarCompra(): Promise<void> {
    try {
      const { purchases } = await NativePurchases.getPurchases({
        productType: PURCHASE_TYPE.INAPP,
      });
      const comprado = purchases.some(
        (p) =>
          p.productIdentifier === PRODUTO_REMOVE_ADS &&
          (p.purchaseState === undefined || p.purchaseState === ESTADO_COMPRADO),
      );
      if (comprado && !this.settings.semAnuncios()) {
        await this.concederRemocao();
      }
    } catch {
      // Sem resposta do Play: mantem o estado persistido local.
    }
  }

  private async carregarPreco(): Promise<void> {
    try {
      const { product } = await NativePurchases.getProduct({
        productIdentifier: PRODUTO_REMOVE_ADS,
        productType: PURCHASE_TYPE.INAPP,
      });
      this.preco.set(product.priceString ?? null);
    } catch {
      // Produto ainda nao configurado na Play Console ou sem rede.
      this.preco.set(null);
    }
  }

  /** Efetiva a remocao: persiste o estado e tira o banner da tela (6.9). */
  private async concederRemocao(): Promise<void> {
    await this.settings.definirSemAnuncios(true);
    await this.ads.removerBanner();
  }
}

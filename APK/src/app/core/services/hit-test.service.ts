import { Injectable } from '@angular/core';
import { ChaveAnimal } from '../models/animal.model';

/** Alpha minimo para o pixel contar como parte do animal. */
const LIMIAR_ALPHA = 24;

/** Lado do mapa de opacidade. 64x64 = 4 KB por animal, precisao de ~1,5%. */
const RESOLUCAO = 64;

/**
 * Deteccao de toque por pixel opaco (ESPECIFICATION 4.2, BACKLOG 4.4).
 *
 * O PNG de cada animal e 1024x1536 com transparencia em volta, entao a caixa
 * retangular do elemento e MUITO maior que o animal desenhado. Medindo as
 * posicoes de 4.2, as caixas se sobrepoem bastante — leao x lobo em 29%,
 * elefante x macaco em 21%, macaco x sapo em 15%. Com caixas retangulares o
 * animal de cima roubaria toques destinados ao vizinho, e o sapo (o menor, no
 * centro) seria o mais prejudicado.
 *
 * A solucao e testar o ALPHA do pixel tocado: cada animal responde apenas onde
 * esta efetivamente desenhado. A sobreposicao continua sendo visual, como a
 * especificacao quer, mas deixa de existir no toque — sem precisar recortar
 * regiao nenhuma a mao.
 *
 * O mapa e construido uma vez por animal, em 64x64, e fica em memoria.
 */
@Injectable({ providedIn: 'root' })
export class HitTestService {
  private readonly mapas = new Map<ChaveAnimal, Uint8Array>();
  private readonly carregando = new Map<ChaveAnimal, Promise<void>>();

  /** Constroi os mapas de opacidade. Falha silenciosa: ver `opaco()`. */
  async precarregar(chaves: readonly ChaveAnimal[]): Promise<void> {
    await Promise.all(chaves.map((chave) => this.mapaDe(chave)));
  }

  /**
   * O ponto (u, v), em coordenadas normalizadas 0..1 dentro da caixa do
   * animal, cai sobre pixel desenhado?
   *
   * Enquanto o mapa nao estiver pronto, retorna `true` — e melhor aceitar um
   * toque a mais do que deixar a crianca tocando um animal que nao responde.
   */
  opaco(chave: ChaveAnimal, u: number, v: number): boolean {
    const mapa = this.mapas.get(chave);
    if (!mapa) return true;

    if (u < 0 || u > 1 || v < 0 || v > 1) return false;

    const x = Math.min(RESOLUCAO - 1, Math.floor(u * RESOLUCAO));
    const y = Math.min(RESOLUCAO - 1, Math.floor(v * RESOLUCAO));
    return mapa[y * RESOLUCAO + x] === 1;
  }

  private mapaDe(chave: ChaveAnimal): Promise<void> {
    const emAndamento = this.carregando.get(chave);
    if (emAndamento) return emAndamento;

    const promessa = this.construir(chave).catch(() => {
      // Sem mapa, `opaco()` aceita tudo — o jogo continua jogavel.
    });
    this.carregando.set(chave, promessa);
    return promessa;
  }

  private async construir(chave: ChaveAnimal): Promise<void> {
    const img = new Image();
    img.decoding = 'async';
    img.src = `assets/images/${chave}.webp`;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = RESOLUCAO;
    canvas.height = RESOLUCAO;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, RESOLUCAO, RESOLUCAO);
    const { data } = ctx.getImageData(0, 0, RESOLUCAO, RESOLUCAO);

    const mapa = new Uint8Array(RESOLUCAO * RESOLUCAO);
    for (let i = 0; i < mapa.length; i++) {
      mapa[i] = data[i * 4 + 3] >= LIMIAR_ALPHA ? 1 : 0;
    }

    this.mapas.set(chave, mapa);
  }
}

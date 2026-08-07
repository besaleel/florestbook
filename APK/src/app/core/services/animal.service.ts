import { Injectable } from '@angular/core';
import { Animal, ChaveAnimal } from '../models/animal.model';

/**
 * Catalogo dos 5 animais (ESPECIFICATION 4.2, BACKLOG 2.1).
 *
 * Posicoes medidas sobre
 * `PROJECT/assets/new-modelo-sugerido-posicao-animais.png` (31/07/2026), em
 * percentuais do palco. O modelo anterior deixava os animais PEQUENOS demais
 * no aparelho; o novo os aproxima, ocupando a clareira inteira.
 *
 * A ZONA UTIL passou de 40-79% para 25-83% da altura: os animais sobem ate as
 * copas e descem ate onde comeca o rodape do cenario.
 *
 * O arranjo e em DUAS FILEIRAS com sobreposicao visual. A sobreposicao e
 * apenas visual: o toque e resolvido por pixel opaco (HitTestService), entao
 * cada animal responde so onde esta desenhado (ESPECIFICATION 4.2).
 *
 * ## Enquadramento (correcao de 01/08/2026)
 *
 * O teste em aparelho (Xiaomi 1080x2400 e LG 720x1560, `PROJECT/assets/
 * tela-xiaomi.png` e `tela-LG.png`) mostrou leao e elefante CORTADOS nas
 * bordas: com largura 42 e 48 centradas em x 26 e 77, as caixas iam de 5% a
 * 47% e de 53% a 101% — o elefante literalmente estourava o cenario.
 *
 * A correcao tem DUAS partes, e a segunda e a que resolve de fato:
 *
 * 1. Aqui: animais ~12% menores e os das pontas trazidos para dentro, com a
 *    regra explicita `x -/+ largura/2` dentro de MARGEM_BORDA (4%), protegida
 *    por `verificarEnquadramento()`.
 * 2. No SCSS (`.faixa-animais`): estes percentuais passaram a ser medidos
 *    sobre a largura VISIVEL, nao sobre o `.cenario` — que reproduz o `cover`
 *    e sangra para fora da tela nos aparelhos estreitos (520 px de cenario
 *    para 360 px de tela no LG). Sem essa parte, encolher os numeros aqui
 *    apenas ameniza o corte: a sobra lateral varia com a proporcao da tela.
 */

/** Folga minima entre a caixa de qualquer animal e a borda do cenario, em %. */
export const MARGEM_BORDA = 4;

/** Limites da zona util, em % da altura do palco. */
export const ZONA_UTIL = { topo: 25, base: 83 } as const;

@Injectable({ providedIn: 'root' })
export class AnimalService {
  private readonly catalogo: readonly Animal[] = [
    {
      chave: 'leao',
      // 26 -> 24: a juba encostava na arvore da esquerda no LG (720 de largura).
      x: 24,
      y: 50,
      largura: 37,
      fileira: 'fundo',
      rosto: '50% 22%',
      // Respiracao media; balanco de cabeca um pouco maior.
      idle: { duracao: 3.4, atraso: 0, amplitude: 0.022, rotacao: 1.4 },
    },
    {
      chave: 'elefante',
      // Era o pior caso: x 77 + largura 48 punha a borda direita em 101%.
      x: 74,
      y: 49,
      largura: 42, // Continua o maior de todos: ancora a cena.
      fileira: 'fundo',
      rosto: '50% 24%',
      // Respiracao lenta e ampla; balanco minimo (animal pesado).
      idle: { duracao: 4.6, atraso: 0.8, amplitude: 0.028, rotacao: 0.6 },
    },
    {
      chave: 'lobo',
      x: 37,
      y: 64,
      largura: 35,
      fileira: 'frente',
      rosto: '52% 20%',
      // Respiracao media-rapida, alerta.
      idle: { duracao: 2.8, atraso: 1.5, amplitude: 0.02, rotacao: 1.2 },
    },
    {
      chave: 'macaco',
      x: 68,
      y: 66,
      largura: 32,
      fileira: 'frente',
      rosto: '50% 18%',
      // O mais agitado: ciclo curto, rotacao maior.
      idle: { duracao: 2.1, atraso: 0.4, amplitude: 0.03, rotacao: 2.4 },
    },
    {
      chave: 'sapo',
      x: 54,
      y: 73,
      // Menor de todos e no centro: e o caso critico do alvo de 48 dp
      // (BACKLOG 4.5). O minimo em px e garantido no CSS, nao aqui.
      // Encolhe menos que os outros justamente por ser o alvo critico.
      largura: 27,
      fileira: 'frente',
      rosto: '50% 26%',
      // Pulsacao em ciclos curtos com pausa entre elas (inflar/desinflar).
      idle: { duracao: 2.6, atraso: 1.1, amplitude: 0.045, rotacao: 0.5 },
    },
  ];

  /** Os 5 animais, ja ordenados por fileira (fundo primeiro). */
  listar(): readonly Animal[] {
    return this.catalogo;
  }

  /**
   * Animais cuja caixa invade a margem da borda do cenario.
   *
   * Vazio significa cena bem enquadrada. Existe para o teste travar a
   * regressao de 01/08/2026 (leao e elefante cortados no aparelho): mexer nas
   * posicoes sem conferir a borda foi exatamente o que produziu o corte.
   */
  verificarEnquadramento(): readonly ChaveAnimal[] {
    return this.catalogo
      .filter((a) => {
        const esquerda = a.x - a.largura / 2;
        const direita = a.x + a.largura / 2;
        return esquerda < MARGEM_BORDA || direita > 100 - MARGEM_BORDA;
      })
      .map((a) => a.chave);
  }

  buscar(chave: ChaveAnimal): Animal {
    const animal = this.catalogo.find((a) => a.chave === chave);
    if (!animal) throw new Error(`Animal desconhecido: ${chave}`);
    return animal;
  }

  imagem(chave: ChaveAnimal): string {
    return `assets/images/${chave}.webp`;
  }

  som(chave: ChaveAnimal): string {
    return `assets/sounds/${chave}.mp3`;
  }
}

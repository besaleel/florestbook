import { Injectable } from '@angular/core';
import { Animal, ChaveAnimal } from '../models/animal.model';

/**
 * Catalogo dos 5 animais (ESPECIFICATION 4.2, BACKLOG 2.1).
 *
 * Posicoes medidas sobre `PROJECT/assets/modelo-sugerido-posicao-animais.png`,
 * em percentuais do palco. A ZONA UTIL vai de 40% a 79% da altura: acima e
 * ceu/copas, abaixo e o rodape do cenario e o banner. Nenhum animal invade
 * essas faixas — sao as duas barras pretas do modelo.
 *
 * O arranjo e em DUAS FILEIRAS com sobreposicao visual. A sobreposicao e
 * apenas visual: a area de toque de cada animal e exclusiva, e o da frente
 * vence a disputa (ESPECIFICATION 4.2).
 */

/** Limites da zona util, em % da altura do palco. */
export const ZONA_UTIL = { topo: 40, base: 79 } as const;

@Injectable({ providedIn: 'root' })
export class AnimalService {
  private readonly catalogo: readonly Animal[] = [
    {
      chave: 'leao',
      x: 42,
      y: 53,
      largura: 26,
      fileira: 'fundo',
      rosto: '50% 22%',
      // Respiracao media; balanco de cabeca um pouco maior.
      idle: { duracao: 3.4, atraso: 0, amplitude: 0.022, rotacao: 1.4 },
    },
    {
      chave: 'elefante',
      x: 72,
      y: 55,
      largura: 32, // Maior de todos: ancora a cena.
      fileira: 'fundo',
      rosto: '50% 24%',
      // Respiracao lenta e ampla; balanco minimo (animal pesado).
      idle: { duracao: 4.6, atraso: 0.8, amplitude: 0.028, rotacao: 0.6 },
    },
    {
      chave: 'lobo',
      x: 34,
      y: 68,
      largura: 26,
      fileira: 'frente',
      rosto: '52% 20%',
      // Respiracao media-rapida, alerta.
      idle: { duracao: 2.8, atraso: 1.5, amplitude: 0.02, rotacao: 1.2 },
    },
    {
      chave: 'macaco',
      x: 68,
      y: 72,
      largura: 22,
      fileira: 'frente',
      rosto: '50% 18%',
      // O mais agitado: ciclo curto, rotacao maior.
      idle: { duracao: 2.1, atraso: 0.4, amplitude: 0.03, rotacao: 2.4 },
    },
    {
      chave: 'sapo',
      x: 53,
      y: 75,
      // Menor de todos e no centro: e o caso critico do alvo de 48 dp
      // (BACKLOG 4.5). O minimo em px e garantido no CSS, nao aqui.
      largura: 17,
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

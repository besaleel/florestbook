/**
 * Chave interna do animal: portugues, minuscula e SEM ACENTO
 * (ESPECIFICATION 3.2). A mesma chave nomeia o WebP, o MP3 e a chave de
 * traducao. O nome exibido ao usuario vem SEMPRE do i18n, nunca daqui.
 */
export type ChaveAnimal = 'elefante' | 'leao' | 'lobo' | 'macaco' | 'sapo';

/** Fileira de profundidade na composicao (ESPECIFICATION 4.2). */
export type Fileira = 'fundo' | 'frente';

export interface Animal {
  readonly chave: ChaveAnimal;

  /**
   * Centro do animal em PERCENTUAL do palco, nunca em pixels
   * (ESPECIFICATION 5) — preserva a composicao em qualquer proporcao de tela.
   */
  readonly x: number;
  readonly y: number;

  /** Largura em % da largura do palco. Respeita a hierarquia de tamanho. */
  readonly largura: number;

  /**
   * Fileira: os da frente cobrem os do fundo e VENCEM o toque na regiao
   * disputada (ESPECIFICATION 4.2). Deriva o z-index.
   */
  readonly fileira: Fileira;

  /**
   * `object-position` do recorte circular do rosto na faixa do nome
   * (ESPECIFICATION 4.2) — calibrado por animal, sem assets adicionais.
   */
  readonly rosto: string;

  /** Parametros do idle: cada animal tem a sua personalidade (ESPECIFICATION 2.2). */
  readonly idle: {
    /** Duracao do ciclo de respiracao. */
    readonly duracao: number;
    /** Defasagem para que os cinco nao pulsem em sincronia. */
    readonly atraso: number;
    /** Amplitude da escala (1 + amplitude no pico). */
    readonly amplitude: number;
    /** Balanco em graus. */
    readonly rotacao: number;
  };
}

/**
 * Registro de temas de background (ESPECIFICATION 4.3).
 *
 * O mecanismo e DIRIGIDO A DADOS: acrescentar um tema e acrescentar uma
 * entrada em `TEMAS`, sem tocar em logica. Chaves sem acento e sem hifen,
 * acompanhando a convencao das chaves de animal.
 */

export type ChaveTema =
  | 'standard'
  | 'pascoa'
  | 'festejunina'
  | 'halloween'
  | 'natal'
  | 'anonovo';

/**
 * Janela sazonal. `pascoa` e movel (computus), por isso o tipo distingue as
 * duas formas em vez de usar so mes/dia.
 */
export type JanelaSazonal =
  | { tipo: 'fixa'; inicio: { mes: number; dia: number }; fim: { mes: number; dia: number } }
  | { tipo: 'pascoa'; diasAntes: number; diasDepois: number };

export interface Tema {
  readonly chave: ChaveTema;
  /** Nome do arquivo em assets/images/. */
  readonly asset: string;
  /** Ausente = nunca entra automaticamente; so no seletor manual. */
  readonly janela?: JanelaSazonal;
  /** Ausente = disponivel automaticamente em todos os idiomas. */
  readonly idiomas?: readonly string[];
}

export const TEMAS: readonly Tema[] = [
  {
    chave: 'standard',
    asset: 'background.webp',
    // Sem janela: e o recuo padrao fora de todas as epocas.
  },
  {
    chave: 'pascoa',
    asset: 'background-pascoa.webp',
    janela: { tipo: 'pascoa', diasAntes: 7, diasDepois: 1 },
  },
  {
    chave: 'festejunina',
    asset: 'background-festejunina.webp',
    janela: { tipo: 'fixa', inicio: { mes: 6, dia: 1 }, fim: { mes: 6, dia: 30 } },
    // Culturalmente especifica: exibi-la automaticamente para quem nao a
    // celebra nao faz sentido. Segue disponivel na troca manual em todos os
    // idiomas (ESPECIFICATION 4.3).
    idiomas: ['pt'],
  },
  {
    chave: 'halloween',
    asset: 'background-halloween.webp',
    janela: { tipo: 'fixa', inicio: { mes: 10, dia: 24 }, fim: { mes: 10, dia: 31 } },
  },
  {
    chave: 'natal',
    asset: 'background-natal.webp',
    // 01-28/12: o Ano Novo assume a partir de 29/12 (decisao do cliente).
    janela: { tipo: 'fixa', inicio: { mes: 12, dia: 1 }, fim: { mes: 12, dia: 28 } },
  },
  {
    chave: 'anonovo',
    asset: 'background-anonovo.webp',
    // Atravessa a virada do ano: 29/12 a 05/01. A comparacao trata esse caso.
    janela: { tipo: 'fixa', inicio: { mes: 12, dia: 29 }, fim: { mes: 1, dia: 5 } },
  },
];

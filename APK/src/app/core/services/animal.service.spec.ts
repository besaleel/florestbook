import { TestBed } from '@angular/core/testing';

import { AnimalService, MARGEM_BORDA } from './animal.service';

/**
 * Trava a regressao de enquadramento de 01/08/2026: no teste em aparelho
 * (Xiaomi e LG) o leao e o elefante apareciam CORTADOS nas bordas, porque as
 * caixas iam de 5% a 47% e de 53% a 101% do cenario.
 */
describe('AnimalService', () => {
  let servico: AnimalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servico = TestBed.inject(AnimalService);
  });

  it('mantem os 5 animais dentro da margem da borda', () => {
    expect(servico.verificarEnquadramento()).toEqual([]);
  });

  it('nenhum animal encosta na borda do cenario', () => {
    for (const animal of servico.listar()) {
      const esquerda = animal.x - animal.largura / 2;
      const direita = animal.x + animal.largura / 2;

      expect(esquerda)
        .withContext(`${animal.chave} vaza pela esquerda`)
        .toBeGreaterThanOrEqual(MARGEM_BORDA);
      expect(direita)
        .withContext(`${animal.chave} vaza pela direita`)
        .toBeLessThanOrEqual(100 - MARGEM_BORDA);
    }
  });

  it('a regra de borda reprova o elefante da v03', () => {
    // Prova que a regra realmente pega o caso ruim, em vez de passar sempre.
    // O elefante da v03 (x 77, largura 48) ia ate 101% — o corte relatado.
    const foraDaTela = (x: number, largura: number) =>
      x - largura / 2 < MARGEM_BORDA || x + largura / 2 > 100 - MARGEM_BORDA;

    expect(foraDaTela(77, 48)).toBeTrue();

    // O leao da v03 (x 26, largura 42) ia ate 5%, ou seja, PASSAVA nesta
    // regra e mesmo assim aparecia cortado: o corte dele vinha da outra
    // metade do problema — o `.cenario` mais largo que a tela, resolvido por
    // `.faixa-animais` no SCSS. Fica registrado para nao se tentar explicar
    // o corte do leao so com estes numeros.
    expect(foraDaTela(26, 42)).toBeFalse();

    // E aprova os valores novos.
    expect(foraDaTela(74, 42)).toBeFalse();
    expect(foraDaTela(24, 37)).toBeFalse();
  });
});

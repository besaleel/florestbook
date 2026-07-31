import { TestBed } from '@angular/core/testing';
import { SeasonalService } from './seasonal.service';

describe('SeasonalService', () => {
  let servico: SeasonalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servico = TestBed.inject(SeasonalService);
  });

  /** Formata como dd/MM/yyyy para comparar com as datas da ESPECIFICATION. */
  const br = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  describe('domingoDePascoa — computus (BACKLOG 4B.11)', () => {
    // Datas reais conferidas em ESPECIFICATION 4.3.
    const esperado: Record<number, string> = {
      2024: '31/03/2024',
      2025: '20/04/2025',
      2026: '05/04/2026',
      2027: '28/03/2027',
      2028: '16/04/2028',
      2029: '01/04/2029',
      2030: '21/04/2030',
      2031: '13/04/2031',
      2032: '28/03/2032',
    };

    for (const [ano, data] of Object.entries(esperado)) {
      it(`acerta a Pascoa de ${ano}`, () => {
        expect(br(servico.domingoDePascoa(Number(ano)))).toBe(data);
      });
    }
  });

  describe('temaDaData — janelas fixas', () => {
    it('cai em standard fora de todas as janelas', () => {
      expect(servico.temaDaData(new Date(2026, 7, 15), 'pt')).toBe('standard');
    });

    it('reconhece Halloween nas bordas (24 e 31/10)', () => {
      expect(servico.temaDaData(new Date(2026, 9, 24), 'en')).toBe('halloween');
      expect(servico.temaDaData(new Date(2026, 9, 31), 'en')).toBe('halloween');
    });

    it('nao reconhece Halloween um dia antes nem um depois', () => {
      expect(servico.temaDaData(new Date(2026, 9, 23), 'en')).toBe('standard');
      expect(servico.temaDaData(new Date(2026, 10, 1), 'en')).toBe('standard');
    });

    it('reconhece Natal de 01 a 24/12', () => {
      expect(servico.temaDaData(new Date(2026, 11, 1), 'pt')).toBe('natal');
      expect(servico.temaDaData(new Date(2026, 11, 24), 'pt')).toBe('natal');
    });
  });

  describe('temaDaData — Ano Novo atravessa a virada (BACKLOG 4B.12)', () => {
    it('assume a partir de 25/12', () => {
      expect(servico.temaDaData(new Date(2026, 11, 25), 'pt')).toBe('anonovo');
      expect(servico.temaDaData(new Date(2026, 11, 31), 'pt')).toBe('anonovo');
    });

    it('continua depois da virada, ate 05/01', () => {
      expect(servico.temaDaData(new Date(2027, 0, 1), 'pt')).toBe('anonovo');
      expect(servico.temaDaData(new Date(2027, 0, 5), 'pt')).toBe('anonovo');
    });

    it('termina em 06/01', () => {
      expect(servico.temaDaData(new Date(2027, 0, 6), 'pt')).toBe('standard');
    });
  });

  describe('temaDaData — Pascoa movel', () => {
    it('cobre de 7 dias antes a 1 dia depois (Pascoa 2026 = 05/04)', () => {
      expect(servico.temaDaData(new Date(2026, 2, 29), 'pt')).toBe('pascoa');
      expect(servico.temaDaData(new Date(2026, 3, 5), 'pt')).toBe('pascoa');
      expect(servico.temaDaData(new Date(2026, 3, 6), 'pt')).toBe('pascoa');
    });

    it('nao vale fora da janela', () => {
      expect(servico.temaDaData(new Date(2026, 2, 28), 'pt')).toBe('standard');
      expect(servico.temaDaData(new Date(2026, 3, 7), 'pt')).toBe('standard');
    });

    it('acompanha a data movel: em 2027 a Pascoa e 28/03', () => {
      expect(servico.temaDaData(new Date(2027, 2, 28), 'pt')).toBe('pascoa');
      expect(servico.temaDaData(new Date(2027, 3, 5), 'pt')).toBe('standard');
    });
  });

  describe('temaDaData — Festa Junina restrita ao PT (BACKLOG 4B.9)', () => {
    it('vale em junho para PT', () => {
      expect(servico.temaDaData(new Date(2026, 5, 1), 'pt')).toBe('festejunina');
      expect(servico.temaDaData(new Date(2026, 5, 30), 'pt')).toBe('festejunina');
    });

    it('NAO vale automaticamente nos demais idiomas', () => {
      for (const idioma of ['en', 'es', 'fr', 'it', 'de']) {
        expect(servico.temaDaData(new Date(2026, 5, 15), idioma)).toBe('standard');
      }
    });
  });

  describe('ano bissexto (BACKLOG 4B.12)', () => {
    it('trata 29/02 sem quebrar', () => {
      expect(servico.temaDaData(new Date(2028, 1, 29), 'pt')).toBe('standard');
    });

    it('acerta a Pascoa de um ano bissexto (2028 = 16/04)', () => {
      expect(servico.temaDaData(new Date(2028, 3, 16), 'pt')).toBe('pascoa');
    });
  });
});

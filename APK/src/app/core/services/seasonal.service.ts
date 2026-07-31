import { Injectable } from '@angular/core';
import { ChaveTema, JanelaSazonal, Tema, TEMAS } from '../models/tema.model';

/**
 * Selecao sazonal de background (ESPECIFICATION 4.3, BACKLOG 4B.7-4B.9).
 *
 * Roda 100% OFFLINE, usando a data local do aparelho — nenhuma chamada de
 * rede. Fora de todas as janelas, o resultado e `standard`.
 */
@Injectable({ providedIn: 'root' })
export class SeasonalService {
  /**
   * Domingo de Pascoa pelo algoritmo de Meeus/Jones/Butcher (computus
   * gregoriano). Vale para qualquer ano, sem tabela nem manutencao
   * (ESPECIFICATION 4.3).
   */
  domingoDePascoa(ano: number): Date {
    const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
    const d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
  }

  /**
   * Tema correspondente a data e ao idioma. Em caso de sobreposicao vale a
   * janela de MENOR duracao (a mais especifica).
   */
  temaDaData(data: Date, idioma: string): ChaveTema {
    const candidatos = TEMAS.filter(
      (tema) =>
        tema.janela !== undefined &&
        this.idiomaPermitido(tema, idioma) &&
        this.dentroDaJanela(tema.janela, data),
    );

    if (candidatos.length === 0) return 'standard';

    // Menor duracao vence: e a janela mais especifica.
    return candidatos.reduce((menor, atual) =>
      this.duracaoEmDias(atual.janela!, data) < this.duracaoEmDias(menor.janela!, data)
        ? atual
        : menor,
    ).chave;
  }

  /**
   * A restricao de idioma vale apenas para a selecao AUTOMATICA. Todos os
   * temas seguem disponiveis no seletor manual, em qualquer idioma
   * (ESPECIFICATION 4.3, BACKLOG 4B.5/4B.9).
   */
  private idiomaPermitido(tema: Tema, idioma: string): boolean {
    return tema.idiomas === undefined || tema.idiomas.includes(idioma);
  }

  private dentroDaJanela(janela: JanelaSazonal, data: Date): boolean {
    const dia = this.meiaNoite(data);

    if (janela.tipo === 'pascoa') {
      const pascoa = this.meiaNoite(this.domingoDePascoa(dia.getFullYear()));
      const inicio = this.somarDias(pascoa, -janela.diasAntes);
      const fim = this.somarDias(pascoa, janela.diasDepois);
      return dia >= inicio && dia <= fim;
    }

    const atual = this.ordinal(dia.getMonth() + 1, dia.getDate());
    const inicio = this.ordinal(janela.inicio.mes, janela.inicio.dia);
    const fim = this.ordinal(janela.fim.mes, janela.fim.dia);

    // Janela que atravessa a virada do ano (ex.: 25/12 a 05/01).
    return inicio <= fim ? atual >= inicio && atual <= fim : atual >= inicio || atual <= fim;
  }

  private duracaoEmDias(janela: JanelaSazonal, data: Date): number {
    if (janela.tipo === 'pascoa') return janela.diasAntes + janela.diasDepois + 1;

    const ano = data.getFullYear();
    const inicio = new Date(ano, janela.inicio.mes - 1, janela.inicio.dia);
    let fim = new Date(ano, janela.fim.mes - 1, janela.fim.dia);
    // Atravessa o ano: o fim cai no ano seguinte.
    if (fim < inicio) fim = new Date(ano + 1, janela.fim.mes - 1, janela.fim.dia);

    return Math.round((fim.getTime() - inicio.getTime()) / 86_400_000) + 1;
  }

  /** Mes/dia como inteiro comparavel (MMDD), independente do ano. */
  private ordinal(mes: number, dia: number): number {
    return mes * 100 + dia;
  }

  private meiaNoite(data: Date): Date {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate());
  }

  private somarDias(data: Date, dias: number): Date {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);
  }
}

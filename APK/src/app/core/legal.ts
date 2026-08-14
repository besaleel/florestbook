import { Browser } from '@capacitor/browser';

/**
 * Documentos legais, exigidos pela Politica para Familias (BACKLOG 7.5).
 *
 * Hospedados no dominio proprio `bza.tec.br` (desde 14/08/2026, substituindo o
 * GitHub Pages); os HTML de origem ficam em `DEPLOY/`. Os links abrem SEMPRE no
 * navegador do sistema, nunca dentro do app: a Politica para Familias exige que
 * links externos saiam do contexto infantil (ESPECIFICATION 6.1).
 *
 * As URLs sao literais e sem extensao, no padrao do site — nao derivam de uma
 * base + nome de arquivo. Estas mesmas URLs vao na ficha da Play Console.
 */
export const URL_TERMOS = 'https://bza.tec.br/florestbook-termos-de-uso';
export const URL_PRIVACIDADE = 'https://bza.tec.br/florestbook-politica-privacidade';

export async function abrirDocumentoLegal(qual: 'termos' | 'privacidade'): Promise<void> {
  await Browser.open({ url: qual === 'termos' ? URL_TERMOS : URL_PRIVACIDADE });
}

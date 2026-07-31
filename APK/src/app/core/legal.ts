import { Browser } from '@capacitor/browser';

/**
 * Documentos legais, exigidos pela Politica para Familias (BACKLOG 7.5).
 *
 * Hospedados no GitHub Pages; os HTML de origem ficam em `DEPLOY/`. Os links
 * abrem SEMPRE no navegador do sistema, nunca dentro do app: a Politica para
 * Familias exige que links externos saiam do contexto infantil
 * (ESPECIFICATION 6.1).
 */
const BASE_LEGAL = 'https://besaleel.github.io/florestbook';

export const URL_TERMOS = `${BASE_LEGAL}/termos-de-uso.html`;
export const URL_PRIVACIDADE = `${BASE_LEGAL}/politica-privacidade.html`;

export async function abrirDocumentoLegal(qual: 'termos' | 'privacidade'): Promise<void> {
  await Browser.open({ url: qual === 'termos' ? URL_TERMOS : URL_PRIVACIDADE });
}

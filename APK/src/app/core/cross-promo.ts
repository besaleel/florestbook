import { Browser } from '@capacitor/browser';

/**
 * Divulgacao cruzada da familia de jogos (BACKLOG 8.6).
 *
 * O banner do FarmBook na tela inicial leva para a ficha do app na Play Store.
 * Como o Florest Book esta no programa Familias, este e um link externo saindo
 * do contexto infantil: SO pode ser aberto depois da barreira parental, pela
 * mesma regra que ja vale para os documentos legais e para a loja de
 * `remove_ads` (ESPECIFICATION 6.1, BACKLOG 6.11).
 *
 * Abre no navegador do sistema; no aparelho o proprio Android encaminha a URL
 * para o app da Play Store quando ele esta instalado.
 */
export const URL_FARMBOOK =
  'https://play.google.com/store/apps/details?id=com.farmbook.app';

export async function abrirFarmBook(): Promise<void> {
  await Browser.open({ url: URL_FARMBOOK });
}

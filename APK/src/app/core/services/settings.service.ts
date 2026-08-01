import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { ChaveTema } from '../models/tema.model';

/** Idiomas suportados (ESPECIFICATION 1). O recuo e sempre EN (BACKLOG 2.8). */
export const IDIOMAS = ['pt', 'en', 'es', 'fr', 'it', 'de'] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_PADRAO: Idioma = 'en';

const CHAVES = {
  nome: 'nome',
  idioma: 'idioma',
  som: 'som',
  musica: 'musica',
  background: 'background',
  escolhaManual: 'backgroundEscolhidoManualmente',
  semAnuncios: 'semAnuncios',
} as const;

/**
 * Estado persistido do jogo (ESPECIFICATION 4.3, BACKLOG 2.3).
 *
 * Tudo fica SO NO APARELHO, via Capacitor Preferences — nada e enviado a
 * servidor. Isso e requisito da Politica para Familias do Google Play
 * (ESPECIFICATION 6.1), nao apenas uma escolha de arquitetura.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  /** Nome da crianca. Vazio e valido: o jogo funciona normalmente sem nome. */
  readonly nome = signal('');
  readonly idioma = signal<Idioma>(IDIOMA_PADRAO);
  /** Sons dos animais. Independente da musica: sao DOIS controles na barra. */
  readonly som = signal(true);
  /** Musica de fundo. Desligar a musica nao cala os animais, e vice-versa. */
  readonly musica = signal(true);
  readonly background = signal<ChaveTema>('standard');

  /**
   * A escolha manual do usuario SEMPRE vence a selecao automatica
   * (ESPECIFICATION 4.3). Uma vez ligado, nada volta a desliga-lo sozinho —
   * para uma crianca pequena, um cenario que muda entre sessoes e confuso.
   */
  readonly backgroundEscolhidoManualmente = signal(false);

  /** Compra de remocao de anuncios (Fase 6). */
  readonly semAnuncios = signal(false);

  private carregado = false;

  /** Le tudo do disco. Chamado uma vez, na abertura do app. */
  async carregar(): Promise<void> {
    if (this.carregado) return;

    const [nome, idioma, som, musica, background, manual, semAnuncios] =
      await Promise.all(Object.values(CHAVES).map((key) => Preferences.get({ key })));

    if (nome.value) this.nome.set(nome.value);
    if (this.ehIdiomaValido(idioma.value)) this.idioma.set(idioma.value);
    if (som.value !== null) this.som.set(som.value === 'true');
    if (musica.value !== null) this.musica.set(musica.value === 'true');
    if (background.value) this.background.set(background.value as ChaveTema);
    if (manual.value !== null) this.backgroundEscolhidoManualmente.set(manual.value === 'true');
    if (semAnuncios.value !== null) this.semAnuncios.set(semAnuncios.value === 'true');

    this.carregado = true;
  }

  async definirNome(nome: string): Promise<void> {
    const limpo = nome.trim();
    this.nome.set(limpo);
    await Preferences.set({ key: CHAVES.nome, value: limpo });
  }

  async definirIdioma(idioma: Idioma): Promise<void> {
    this.idioma.set(idioma);
    await Preferences.set({ key: CHAVES.idioma, value: idioma });
  }

  async definirSom(ligado: boolean): Promise<void> {
    this.som.set(ligado);
    await Preferences.set({ key: CHAVES.som, value: String(ligado) });
  }

  async definirMusica(ligada: boolean): Promise<void> {
    this.musica.set(ligada);
    await Preferences.set({ key: CHAVES.musica, value: String(ligada) });
  }

  /**
   * Troca manual de background pelo usuario. Liga `escolhidoManualmente`,
   * congelando a selecao automatica para sempre.
   */
  async escolherBackground(chave: ChaveTema): Promise<void> {
    this.background.set(chave);
    this.backgroundEscolhidoManualmente.set(true);
    await Promise.all([
      Preferences.set({ key: CHAVES.background, value: chave }),
      Preferences.set({ key: CHAVES.escolhaManual, value: 'true' }),
    ]);
  }

  /**
   * Troca automatica por data (Fase 4B). NAO liga `escolhidoManualmente` —
   * e o unico caminho que altera o background sem ser o usuario.
   */
  async aplicarBackgroundAutomatico(chave: ChaveTema): Promise<void> {
    if (this.backgroundEscolhidoManualmente()) return;
    this.background.set(chave);
    await Preferences.set({ key: CHAVES.background, value: chave });
  }

  async definirSemAnuncios(comprado: boolean): Promise<void> {
    this.semAnuncios.set(comprado);
    await Preferences.set({ key: CHAVES.semAnuncios, value: String(comprado) });
  }

  private ehIdiomaValido(valor: string | null): valor is Idioma {
    return valor !== null && (IDIOMAS as readonly string[]).includes(valor);
  }
}

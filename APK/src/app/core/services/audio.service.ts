import { Injectable, effect, inject } from '@angular/core';
import { App } from '@capacitor/app';
import { ChaveAnimal } from '../models/animal.model';
import { SettingsService } from './settings.service';

/**
 * Volume normal da musica de fundo.
 *
 * Estava em 0.35 e ficou BAIXO demais no alto-falante de um celular (teste
 * real, 31/07/2026). A musica ja foi normalizada para -16 LUFS na origem, e o
 * alto-falante de um aparelho de entrada tem pouca potencia: 0.75 deixa a
 * trilha audivel sem competir com a voz dos animais, que tocam mais alto e
 * ainda contam com o ducking abaixo.
 */
const VOLUME_MUSICA = 0.75;

/** Volume da musica enquanto um animal fala (ducking, ESPECIFICATION 3.4). */
const VOLUME_DUCK = 0.18;

/** Duracao da rampa de volume do ducking. Curta o bastante para acompanhar
 *  o som do animal, longa o bastante para nao soar como um corte. */
const RAMPA_MS = 220;

const ANIMAIS: readonly ChaveAnimal[] = ['elefante', 'leao', 'lobo', 'macaco', 'sapo'];

/**
 * Audio do jogo (ESPECIFICATION 3.4, BACKLOG 5.6-5.10).
 *
 * Tudo e local: nenhum download em tempo de execucao. Regras:
 *  - um som por vez (novo toque interrompe o anterior);
 *  - a musica de fundo abaixa enquanto o animal fala;
 *  - loop continuo, sem emenda audivel;
 *  - respeita o botao de som, cujo estado e persistido;
 *  - pausa quando o app vai a segundo plano.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly settings = inject(SettingsService);

  private readonly sons = new Map<ChaveAnimal, HTMLAudioElement>();
  private musica?: HTMLAudioElement;
  private tocando?: HTMLAudioElement;
  private rampa?: ReturnType<typeof setInterval>;

  /** O navegador so libera audio apos o primeiro gesto do usuario. */
  private liberado = false;

  constructor() {
    // O botao de som vale para tudo: musica e vozes dos animais.
    effect(() => {
      const ligado = this.settings.som();
      if (!ligado) {
        this.pararTudo();
      } else if (this.liberado) {
        void this.tocarMusica();
      }
    });

    void App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        // Segundo plano: silencia sem perder o estado do botao de som.
        this.musica?.pause();
        this.tocando?.pause();
      } else if (this.settings.som() && this.liberado) {
        void this.tocarMusica();
      }
    });
  }

  /**
   * Pre-carrega os 6 arquivos. Chamado na abertura da floresta: a criança
   * nao pode esperar download no primeiro toque.
   */
  precarregar(): void {
    for (const chave of ANIMAIS) {
      if (this.sons.has(chave)) continue;
      const audio = new Audio(`assets/sounds/${chave}.mp3`);
      audio.preload = 'auto';
      this.sons.set(chave, audio);
    }

    if (!this.musica) {
      this.musica = new Audio('assets/sounds/background-music.mp3');
      this.musica.loop = true;
      this.musica.preload = 'auto';
      this.musica.volume = VOLUME_MUSICA;
    }
  }

  /**
   * Libera o audio apos o primeiro gesto do usuario e inicia a musica.
   * Politica de autoplay: sem um gesto, `play()` e rejeitado.
   */
  async liberarComGesto(): Promise<void> {
    this.liberado = true;
    if (this.settings.som()) await this.tocarMusica();
  }

  /**
   * Toca o som do animal, interrompendo o anterior (um som por vez) e
   * abaixando a musica enquanto durar.
   */
  async tocarAnimal(chave: ChaveAnimal): Promise<void> {
    if (!this.settings.som()) return;

    this.liberado = true;
    this.precarregar();

    // Um som por vez: corta o anterior e o rebobina para o proximo toque.
    if (this.tocando) {
      this.tocando.pause();
      this.tocando.currentTime = 0;
    }

    const som = this.sons.get(chave);
    if (!som) return;

    som.currentTime = 0;
    this.tocando = som;

    // A musica volta ao volume normal quando o som termina — inclusive se for
    // interrompido no meio por outro animal.
    const restaurar = () => {
      som.removeEventListener('ended', restaurar);
      som.removeEventListener('pause', restaurar);
      if (this.tocando === som) this.tocando = undefined;
      this.ajustarVolume(VOLUME_MUSICA);
    };
    som.addEventListener('ended', restaurar);
    som.addEventListener('pause', restaurar);

    this.ajustarVolume(VOLUME_DUCK);
    await this.tocarMusica();

    try {
      await som.play();
    } catch {
      // Sem audio disponivel, o jogo continua: a faixa do nome ainda aparece.
      restaurar();
    }
  }

  private async tocarMusica(): Promise<void> {
    if (!this.settings.som() || !this.liberado) return;
    this.precarregar();
    if (!this.musica || !this.musica.paused) return;

    try {
      await this.musica.play();
    } catch {
      // Autoplay bloqueado: tenta de novo no proximo gesto.
    }
  }

  /** Rampa suave de volume — um corte seco soaria como falha de audio. */
  private ajustarVolume(alvo: number): void {
    if (!this.musica) return;
    clearInterval(this.rampa);

    const inicio = this.musica.volume;
    const passos = Math.max(1, Math.round(RAMPA_MS / 20));
    let passo = 0;

    this.rampa = setInterval(() => {
      passo++;
      if (!this.musica || passo >= passos) {
        if (this.musica) this.musica.volume = alvo;
        clearInterval(this.rampa);
        return;
      }
      this.musica.volume = inicio + (alvo - inicio) * (passo / passos);
    }, 20);
  }

  private pararTudo(): void {
    clearInterval(this.rampa);
    this.musica?.pause();
    if (this.tocando) {
      this.tocando.pause();
      this.tocando.currentTime = 0;
      this.tocando = undefined;
    }
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { ChaveTema, TEMAS } from '../models/tema.model';
import { SettingsService } from './settings.service';
import { SeasonalService } from './seasonal.service';

/** Cor de recuo das sobras do palco, caso o JSON de cores nao carregue. */
const COR_PADRAO = '#4c8334';

/**
 * Tema ativo do cenario (ESPECIFICATION 4.3, BACKLOG 4B.2-4B.10).
 *
 * Aplica a selecao sazonal na abertura do app e ao voltar do segundo plano,
 * SOMENTE se o usuario nunca tiver escolhido um background manualmente.
 */
@Injectable({ providedIn: 'root' })
export class BackgroundService {
  private readonly settings = inject(SettingsService);
  private readonly seasonal = inject(SeasonalService);

  /** Cores de borda por tema, geradas por `npm run assets` (BACKLOG 1.13). */
  private readonly cores = signal<Record<string, string>>({});

  /** Temas cujo asset existe de fato — a base do recuo seguro. */
  private readonly disponiveis = signal<readonly ChaveTema[]>(TEMAS.map((t) => t.chave));

  readonly tema = computed(() => this.settings.background());

  readonly imagem = computed(() => {
    const tema = TEMAS.find((t) => t.chave === this.tema());
    return `assets/images/${tema?.asset ?? 'background.webp'}`;
  });

  /** Cor solida das sobras do palco, acompanhando o tema ativo. */
  readonly corDaBorda = computed(() => this.cores()[this.tema()] ?? COR_PADRAO);

  /** Os temas oferecidos no seletor manual: todos os que existem. */
  readonly temasDoSeletor = computed(() =>
    TEMAS.filter((t) => this.disponiveis().includes(t.chave)),
  );

  async iniciar(): Promise<void> {
    await this.carregarCores();
    await this.aplicarSazonal();
  }

  /**
   * Reavalia a data e aplica o tema da epoca. Chamado na abertura e ao voltar
   * do segundo plano. Nao faz nada se houve escolha manual — essa e a regra
   * que impede o cenario de mudar sozinho entre sessoes.
   */
  async aplicarSazonal(agora: Date = new Date()): Promise<void> {
    if (this.settings.backgroundEscolhidoManualmente()) return;

    const escolhido = this.seasonal.temaDaData(agora, this.settings.idioma());
    // Recuo seguro: tema cujo asset nao exista cai em `standard`, sem erro
    // nem tela em branco (ESPECIFICATION 4.3, BACKLOG 4B.3).
    const seguro = this.disponiveis().includes(escolhido) ? escolhido : 'standard';
    await this.settings.aplicarBackgroundAutomatico(seguro);
  }

  async escolherManualmente(chave: ChaveTema): Promise<void> {
    await this.settings.escolherBackground(chave);
  }

  /**
   * Le as cores de borda extraidas no pipeline. As chaves presentes no JSON
   * sao tambem a prova de quais assets existem: se um tema nao foi convertido,
   * ele nao aparece aqui e e excluido do registro.
   */
  private async carregarCores(): Promise<void> {
    try {
      const resposta = await fetch('assets/data/theme-colors.json');
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

      const cores = (await resposta.json()) as Record<string, string>;
      this.cores.set(cores);
      this.disponiveis.set(TEMAS.filter((t) => t.chave in cores).map((t) => t.chave));
    } catch {
      // Offline-first: sem o JSON o jogo segue no tema padrao, nunca quebra.
      this.disponiveis.set(['standard']);
    }
  }
}

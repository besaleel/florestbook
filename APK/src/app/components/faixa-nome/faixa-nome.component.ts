import { Component, computed, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { Animal } from '../../core/models/animal.model';
import { AnimalService } from '../../core/services/animal.service';

/**
 * Faixa branca com o nome do animal em silabas (ESPECIFICATION 4.2).
 *
 * O circulo do rosto e um RECORTE do proprio PNG do animal, via `object-fit`
 * + `object-position` calibrado por animal — sem assets adicionais
 * (BACKLOG 5.2).
 *
 * Quem controla a duracao de 4,5 s e o reinicio do timer e a pagina da
 * floresta; aqui so entra a apresentacao.
 */
@Component({
  selector: 'app-faixa-nome',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './faixa-nome.component.html',
  styleUrl: './faixa-nome.component.scss',
})
export class FaixaNomeComponent {
  private readonly animais = inject(AnimalService);

  /** Animal exibido; `null` esconde a faixa. */
  readonly animal = input.required<Animal | null>();

  protected readonly imagem = computed(() => {
    const a = this.animal();
    return a ? this.animais.imagem(a.chave) : '';
  });

  /**
   * Chave de traducao das silabas. Monossilabos (WOLF, FROG, LOUP) vem do
   * i18n sem hifen — separa-los seria incorreto (BACKLOG 2.6).
   */
  protected readonly chaveSilabas = computed(() => {
    const a = this.animal();
    return a ? `silabas.${a.chave}` : '';
  });

  protected readonly chaveNome = computed(() => {
    const a = this.animal();
    return a ? `animais.${a.chave}` : '';
  });
}

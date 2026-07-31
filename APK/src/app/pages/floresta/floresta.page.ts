import { Component, OnInit, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

import { AnimalService } from '../../core/services/animal.service';
import { BackgroundService } from '../../core/services/background.service';
import { SettingsService } from '../../core/services/settings.service';
import { Animal } from '../../core/models/animal.model';

/**
 * Tela principal — esqueleto da Fase 4.
 *
 * Ja entrega o palco responsivo, o posicionamento em percentuais e o idle por
 * animal. Faixa do nome, audio, barra superior e banner sao das Fases 4-6.
 */
@Component({
  selector: 'app-floresta',
  standalone: true,
  imports: [IonContent, TranslatePipe],
  templateUrl: './floresta.page.html',
  styleUrl: './floresta.page.scss',
})
export class FlorestaPage implements OnInit {
  private readonly animais = inject(AnimalService);
  protected readonly fundo = inject(BackgroundService);
  protected readonly settings = inject(SettingsService);

  protected readonly lista = this.animais.listar();

  async ngOnInit(): Promise<void> {
    await this.fundo.iniciar();
  }

  protected imagem(animal: Animal): string {
    return this.animais.imagem(animal.chave);
  }

  /** Animais da frente cobrem os do fundo, inclusive durante a animacao. */
  protected camada(animal: Animal): number {
    return animal.fileira === 'frente' ? 20 : 10;
  }
}

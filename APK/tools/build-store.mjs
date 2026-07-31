/**
 * build-store.mjs — assets da ficha da Play Store (BACKLOG 7.9).
 *
 * Gera o feature graphic 1024x500 a partir do logo e do background padrao.
 * As screenshots sao capturas reais do jogo, feitas a parte.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORIGEM = path.join(RAIZ, 'PROJECT', 'assets');
const DESTINO = path.join(RAIZ, 'DEPLOY', 'store-assets');

/** Dimensao exigida pelo Google para o feature graphic. */
const LARG = 1024;
const ALT = 500;

await mkdir(DESTINO, { recursive: true });

/**
 * Feature graphic: fundo da floresta desfocado + logo centralizado.
 *
 * O desfoque e proposital — o feature graphic aparece atras do titulo e dos
 * botoes na ficha da loja, e um fundo detalhado competiria com esse texto.
 */
const fundo = await sharp(path.join(ORIGEM, 'background.png'))
  // Recorta a faixa central do cenario, onde fica a clareira.
  .resize(LARG, ALT, { fit: 'cover', position: 'centre' })
  .blur(8)
  .modulate({ brightness: 0.82 })
  .toBuffer();

const logo = await sharp(path.join(ORIGEM, 'logo.png'))
  .resize(430, 430, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer();

await sharp(fundo)
  .composite([{ input: logo, gravity: 'center' }])
  // Sem alpha: o Google rejeita transparencia nos assets da ficha.
  .removeAlpha()
  .png()
  .toFile(path.join(DESTINO, 'feature-graphic.png'));

const meta = await sharp(path.join(DESTINO, 'feature-graphic.png')).metadata();
console.log(
  `feature-graphic.png  ${meta.width}x${meta.height}  canais=${meta.channels}  alpha=${meta.hasAlpha}`,
);
if (meta.width !== LARG || meta.height !== ALT) {
  throw new Error(`Dimensao errada: o Google exige exatamente ${LARG}x${ALT}.`);
}
if (meta.hasAlpha) throw new Error('Feature graphic saiu com alpha.');

console.log('\nOK. Falta: screenshots (minimo 2) — ver npm run screenshots.');

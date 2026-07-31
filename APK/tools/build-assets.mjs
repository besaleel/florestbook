/**
 * build-assets.mjs — pipeline de assets do Florest Book (ESPECIFICATION 3.3).
 *
 * PROJECT/assets/*.png  -> APK/src/assets/images/*.webp   (sharp, q85)
 * PROJECT/sounds/*.mp3  -> APK/src/assets/sounds/*.mp3    (ffmpeg, mono 96k)
 *
 * Os originais em PROJECT/ NUNCA sao sobrescritos: o pipeline so le de la.
 *
 * A varredura e por PADRAO DE NOME, nao por lista fixa: um background novo
 * entra so por existir (ESPECIFICATION 3.3, BACKLOG 1.3).
 */
import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readdir, copyFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORIGEM_IMAGENS = path.join(RAIZ, 'PROJECT', 'assets');
const ORIGEM_SONS = path.join(RAIZ, 'PROJECT', 'sounds');
const DESTINO_IMAGENS = path.join(RAIZ, 'APK', 'src', 'assets', 'images');
const DESTINO_SONS = path.join(RAIZ, 'APK', 'src', 'assets', 'sounds');
const DESTINO_DADOS = path.join(RAIZ, 'APK', 'src', 'assets', 'data');

/** Chaves internas dos animais: sem acento, minusculas (ESPECIFICATION 3.2). */
const ANIMAIS = ['elefante', 'leao', 'lobo', 'macaco', 'sapo'];

/**
 * Arquivos de PROJECT/assets/ que o pipeline ignora (BACKLOG 1.7).
 * `modelo-sugerido-posicao-animais.png` tem 1024x1536, a MESMA dimensao dos
 * backgrounds — uma varredura por dimensao o embarcaria por engano.
 */
const IMAGENS_IGNORADAS = new Set([
  'flaicon.ico',
  'modelo-sugerido-posicao-animais.png',
]);

/**
 * Arquivos de PROJECT/sounds/ que nao entram no build (BACKLOG 1.12).
 * `elefante02.mp3` foi descartado por decisao do cliente (pendencia C).
 */
const SONS_IGNORADOS = new Set([
  'elefante02.mp3',
  'ORIGINAL-background-sound.mp3',
  'background-sound.wav',
]);

/**
 * Grafias toleradas na origem -> chave do tema.
 * `backgroung-natal.png` veio com G no lugar do D (pendencia L). Enquanto o
 * arquivo nao for renomeado, mapeamos explicitamente: sem isso o tema de Natal
 * sumiria em silencio, que e o modo de falha mais dificil de diagnosticar.
 */
const CORRECOES_DE_GRAFIA = new Map([['backgroung-natal', 'background-natal']]);

const QUALIDADE_WEBP = 85;
const DIM_ANIMAL = { width: 512, height: 768 };
const DIM_BACKGROUND = { width: 1080, height: 1620 };

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

async function existe(caminho) {
  try {
    await stat(caminho);
    return true;
  } catch {
    return false;
  }
}

async function temFfmpeg() {
  try {
    await execFileAsync('ffmpeg', ['-version']);
    return true;
  } catch {
    return false;
  }
}

/** Converte um PNG para WebP no tamanho alvo, preservando o canal alpha. */
async function paraWebp(origem, destino, dimensao) {
  await sharp(origem)
    .resize({ ...dimensao, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALIDADE_WEBP, alphaQuality: 100, effort: 6 })
    .toFile(destino);
  return (await stat(destino)).size;
}

/**
 * Cor media da moldura da imagem — usada nas sobras do palco (ESPECIFICATION 5,
 * BACKLOG 1.13). Amostramos so as bordas laterais: o centro e a clareira onde
 * ficam os animais, e a media dele nao representa a moldura de vegetacao.
 */
async function corDaBorda(origem) {
  const { width, height } = await sharp(origem).metadata();
  const faixa = Math.max(1, Math.floor(width * 0.08));

  const amostras = await Promise.all(
    [0, width - faixa].map((left) =>
      sharp(origem)
        .extract({ left, top: 0, width: faixa, height })
        .stats(),
    ),
  );

  const [r, g, b] = [0, 1, 2].map((canal) =>
    Math.round(
      amostras.reduce((soma, s) => soma + s.channels[canal].mean, 0) / amostras.length,
    ),
  );
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

async function processarImagens() {
  console.log('\n=== IMAGENS ===');
  await mkdir(DESTINO_IMAGENS, { recursive: true });
  await mkdir(DESTINO_DADOS, { recursive: true });

  const arquivos = await readdir(ORIGEM_IMAGENS);
  const coresPorTema = {};
  let total = 0;

  for (const arquivo of arquivos) {
    if (IMAGENS_IGNORADAS.has(arquivo)) {
      console.log(`  ignorado    ${arquivo}`);
      continue;
    }
    if (path.extname(arquivo).toLowerCase() !== '.png') continue;

    const base = path.basename(arquivo, '.png');
    const origem = path.join(ORIGEM_IMAGENS, arquivo);

    // O logo e tratado por build-icons.mjs, nao aqui.
    if (base === 'logo') continue;

    const ehAnimal = ANIMAIS.includes(base);
    const nomeCorrigido = CORRECOES_DE_GRAFIA.get(base) ?? base;
    const ehBackground = nomeCorrigido === 'background' || nomeCorrigido.startsWith('background-');

    if (!ehAnimal && !ehBackground) {
      console.log(`  ignorado    ${arquivo}  (fora dos padroes de nome)`);
      continue;
    }

    const destino = path.join(DESTINO_IMAGENS, `${nomeCorrigido}.webp`);
    const peso = await paraWebp(origem, destino, ehAnimal ? DIM_ANIMAL : DIM_BACKGROUND);
    total += peso;

    const rotulo = nomeCorrigido === base ? '' : `  (renomeado de "${base}")`;
    console.log(`  ${ehAnimal ? 'animal ' : 'fundo  '}     ${nomeCorrigido}.webp  ${kb(peso)}${rotulo}`);

    if (ehBackground) {
      const chave = nomeCorrigido === 'background' ? 'standard' : nomeCorrigido.replace('background-', '');
      coresPorTema[chave] = await corDaBorda(origem);
    }
  }

  const destinoCores = path.join(DESTINO_DADOS, 'theme-colors.json');
  await writeFile(destinoCores, `${JSON.stringify(coresPorTema, null, 2)}\n`, 'utf8');
  console.log(`\n  cores de borda por tema -> assets/data/theme-colors.json`);
  for (const [chave, cor] of Object.entries(coresPorTema)) {
    console.log(`    ${chave.padEnd(14)} ${cor}`);
  }

  return total;
}

async function processarSons() {
  console.log('\n=== SONS ===');
  await mkdir(DESTINO_SONS, { recursive: true });

  const comFfmpeg = await temFfmpeg();
  if (!comFfmpeg) {
    console.warn(
      '  AVISO: ffmpeg nao encontrado. Os MP3 serao copiados SEM normalizacao\n' +
        '         de volume nem reducao para mono 96 kbps (BACKLOG 1.8).\n' +
        '         Instale com: winget install Gyan.FFmpeg',
    );
  }

  let total = 0;

  // Sons dos animais: normalizar + mono 96 kbps, SEM corte de duracao.
  // A faixa do nome dura 4,5 s justamente para nao precisar cortar audio
  // (ESPECIFICATION 3.4) — cortar produziria clique audivel no meio do uivo.
  for (const animal of ANIMAIS) {
    const origem = path.join(ORIGEM_SONS, `${animal}.mp3`);
    const destino = path.join(DESTINO_SONS, `${animal}.mp3`);

    if (!(await existe(origem))) {
      console.warn(`  AUSENTE     ${animal}.mp3`);
      continue;
    }

    if (comFfmpeg) {
      await execFileAsync('ffmpeg', [
        '-y', '-loglevel', 'error',
        '-i', origem,
        '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
        '-ac', '1', '-ar', '44100', '-b:a', '96k',
        destino,
      ]);
    } else {
      await copyFile(origem, destino);
    }

    const peso = (await stat(destino)).size;
    total += peso;
    console.log(`  ${comFfmpeg ? 'normalizado' : 'copiado    '} ${animal}.mp3  ${kb(peso)}`);
  }

  // Musica de fundo: ja comprimida na origem (723 KB, mono 96 kbps —
  // ESPECIFICATION 3.4). So renomeia; reencodar seria perda em cascata.
  const origemMusica = path.join(ORIGEM_SONS, 'background-sound.mp3');
  const destinoMusica = path.join(DESTINO_SONS, 'background-music.mp3');
  if (await existe(origemMusica)) {
    await copyFile(origemMusica, destinoMusica);
    const peso = (await stat(destinoMusica)).size;
    total += peso;
    console.log(`  copiado     background-music.mp3  ${kb(peso)}  (ja comprimida na origem)`);
  } else {
    console.warn('  AUSENTE     background-sound.mp3');
  }

  for (const ignorado of SONS_IGNORADOS) {
    if (await existe(path.join(ORIGEM_SONS, ignorado))) {
      console.log(`  ignorado    ${ignorado}`);
    }
  }

  return total;
}

const imagens = await processarImagens();
const sons = await processarSons();

console.log('\n=== TOTAL EMBARCADO ===');
console.log(`  imagens  ${kb(imagens)}`);
console.log(`  sons     ${kb(sons)}`);
console.log(`  TOTAL    ${((imagens + sons) / 1024 / 1024).toFixed(2)} MB  (meta: app < 30 MB)`);

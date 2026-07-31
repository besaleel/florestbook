/**
 * build-icons.mjs — origem unica de logo e icones (ESPECIFICATION 3.1.1).
 *
 * Nada e desenhado a parte: TUDO deriva dos dois PNG de PROJECT/assets/.
 *
 *   logo-simplificada.png -> icones do app, adaptativo, favicon, PWA, loja
 *   logo.png              -> logo da tela inicial e splash
 *
 * Sao dois arquivos DISTINTOS e nao intercambiaveis (BACKLOG 1.5): o logo
 * completo tem detalhe demais para sobreviver a 48x48 px na gaveta de apps.
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORIGEM = path.join(RAIZ, 'PROJECT', 'assets');
const LOGO_COMPLETO = path.join(ORIGEM, 'logo.png');
const LOGO_SIMPLES = path.join(ORIGEM, 'logo-simplificada.png');

const RES_ANDROID = path.join(RAIZ, 'APK', 'android', 'app', 'src', 'main', 'res');
const SRC_ASSETS = path.join(RAIZ, 'APK', 'src', 'assets');
const STORE_ASSETS = path.join(RAIZ, 'DEPLOY', 'store-assets');

/** Verde da marca — fundo do splash e achatamento do icone da loja. */
const COR_MARCA = { r: 0x1f, g: 0x6b, b: 0x3b, alpha: 1 };

/** Densidades do icone legado do Android. */
const DENSIDADES = [
  ['mdpi', 48],
  ['hdpi', 72],
  ['xhdpi', 96],
  ['xxhdpi', 144],
  ['xxxhdpi', 192],
];

/**
 * Icone adaptativo: o Android reserva 66% centrais como safe zone e corta o
 * resto em mascaras circulares. Desenhamos o logo em 66% de um canvas
 * transparente para que o elemento central sobreviva ao corte (pendencia J).
 */
const SAFE_ZONE = 0.66;
const LADO_ADAPTATIVO = 432;

const criados = [];

async function garantirPasta(p) {
  await mkdir(p, { recursive: true });
}

async function registrar(destino) {
  criados.push(path.relative(RAIZ, destino));
}

/** Redimensiona mantendo alpha, sem ampliar alem do original. */
async function png(origem, destino, lado) {
  await garantirPasta(path.dirname(destino));
  await sharp(origem)
    .resize(lado, lado, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(destino);
  await registrar(destino);
}

/** Logo centrado em `SAFE_ZONE` de um canvas quadrado transparente. */
async function comSafeZone(origem, destino, lado) {
  await garantirPasta(path.dirname(destino));
  const interno = Math.round(lado * SAFE_ZONE);
  const miolo = await sharp(origem)
    .resize(interno, interno, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: { width: lado, height: lado, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: miolo, gravity: 'center' }])
    .png()
    .toFile(destino);
  await registrar(destino);
}

async function iconesAndroid() {
  console.log('\n=== ICONES ANDROID (de logo-simplificada.png) ===');

  for (const [densidade, lado] of DENSIDADES) {
    const pasta = path.join(RES_ANDROID, `mipmap-${densidade}`);
    // Icone legado: quadrado e arredondado usam a mesma arte.
    await png(LOGO_SIMPLES, path.join(pasta, 'ic_launcher.png'), lado);
    await png(LOGO_SIMPLES, path.join(pasta, 'ic_launcher_round.png'), lado);
    // Foreground adaptativo: 1.5x o lado nominal, com safe zone de 66%.
    await comSafeZone(LOGO_SIMPLES, path.join(pasta, 'ic_launcher_foreground.png'), Math.round(lado * 1.5));
    console.log(`  mipmap-${densidade.padEnd(8)} ${lado}px  (+ foreground adaptativo)`);
  }

  // Cor de fundo do icone adaptativo, referenciada pelo XML abaixo.
  const valores = path.join(RES_ANDROID, 'values');
  await garantirPasta(valores);
  const hex = `#${[COR_MARCA.r, COR_MARCA.g, COR_MARCA.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  await writeFile(
    path.join(valores, 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${hex}</color>\n</resources>\n`,
    'utf8',
  );
  await registrar(path.join(valores, 'ic_launcher_background.xml'));

  const xmlAdaptativo =
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n' +
    '    <background android:drawable="@color/ic_launcher_background" />\n' +
    '    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n' +
    '</adaptive-icon>\n';
  for (const nome of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
    const destino = path.join(RES_ANDROID, 'mipmap-anydpi-v26', nome);
    await garantirPasta(path.dirname(destino));
    await writeFile(destino, xmlAdaptativo, 'utf8');
    await registrar(destino);
  }
  console.log(`  mipmap-anydpi-v26  adaptive-icon.xml  (fundo ${hex})`);
}

/**
 * Prova visual da safe zone (BACKLOG 1.6): aplica a mascara circular do
 * Android sobre o icone adaptativo. Se o elemento central some aqui, ele some
 * na gaveta de aplicativos do aparelho.
 */
async function provaSafeZone() {
  const lado = 432;
  const destino = path.join(STORE_ASSETS, 'validacao-safe-zone.png');
  await garantirPasta(STORE_ASSETS);

  const interno = Math.round(lado * SAFE_ZONE);
  const miolo = await sharp(LOGO_SIMPLES)
    .resize(interno, interno, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const composto = await sharp({
    create: { width: lado, height: lado, channels: 4, background: COR_MARCA },
  })
    .composite([{ input: miolo, gravity: 'center' }])
    .png()
    .toBuffer();

  const mascaraCircular = Buffer.from(
    `<svg width="${lado}" height="${lado}"><circle cx="${lado / 2}" cy="${lado / 2}" r="${lado / 2}" fill="#fff"/></svg>`,
  );

  await sharp(composto)
    .composite([{ input: mascaraCircular, blend: 'dest-in' }])
    .png()
    .toFile(destino);
  await registrar(destino);
  console.log(`\n  prova da safe zone -> ${path.relative(RAIZ, destino)}`);
  console.log('    Abra e confirme que o elemento central sobrevive ao corte circular.');
}

async function webEPwa() {
  console.log('\n=== WEB / PWA ===');
  // Favicon do WebView e icones PWA/iOS: da simplificada (ESPECIFICATION 3.1.1).
  await png(LOGO_SIMPLES, path.join(SRC_ASSETS, 'icon', 'favicon.png'), 64);
  await png(LOGO_SIMPLES, path.join(SRC_ASSETS, 'icon', 'icon-180.png'), 180);
  await png(LOGO_SIMPLES, path.join(SRC_ASSETS, 'icon', 'icon-512.png'), 512);
  console.log('  favicon.png 64  |  icon-180.png  |  icon-512.png  (iOS futuro)');

  // Logo da tela inicial: do logo COMPLETO, exibido grande (BACKLOG 1.5).
  const destinoLogo = path.join(SRC_ASSETS, 'images', 'logo.webp');
  await garantirPasta(path.dirname(destinoLogo));
  await sharp(LOGO_COMPLETO)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(destinoLogo);
  await registrar(destinoLogo);
  console.log('  logo.webp 512  (de logo.png — tela inicial)');
}

async function splash() {
  console.log('\n=== SPLASH (de logo.png) ===');
  // Logo sobre a cor solida da marca, retrato e paisagem.
  for (const [nome, largura, altura] of [
    ['splash.png', 1080, 1920],
    ['splash_land.png', 1920, 1080],
  ]) {
    const destino = path.join(RES_ANDROID, 'drawable', nome);
    await garantirPasta(path.dirname(destino));
    const lado = Math.round(Math.min(largura, altura) * 0.5);
    const miolo = await sharp(LOGO_COMPLETO)
      .resize(lado, lado, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({ create: { width: largura, height: altura, channels: 4, background: COR_MARCA } })
      .composite([{ input: miolo, gravity: 'center' }])
      .png()
      .toFile(destino);
    await registrar(destino);
    console.log(`  ${nome}  ${largura}x${altura}`);
  }
}

async function iconeDaLoja() {
  console.log('\n=== PLAY STORE ===');
  // 512x512 SEM ALPHA: o Google rejeita icone com transparencia.
  // Achatamos sobre a cor da marca (ESPECIFICATION 3.1.1, BACKLOG 7.8).
  await garantirPasta(STORE_ASSETS);
  const destino = path.join(STORE_ASSETS, 'icon-512.png');

  const miolo = await sharp(LOGO_SIMPLES)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({ create: { width: 512, height: 512, channels: 4, background: COR_MARCA } })
    .composite([{ input: miolo, gravity: 'center' }])
    .removeAlpha()
    .png()
    .toFile(destino);
  await registrar(destino);

  const { channels, hasAlpha } = await sharp(destino).metadata();
  console.log(`  icon-512.png  canais=${channels}  alpha=${hasAlpha}  (exigido: sem alpha)`);
  if (hasAlpha) throw new Error('icon-512.png saiu COM alpha — o Google rejeitaria.');
}

await iconesAndroid();
await provaSafeZone();
await webEPwa();
await splash();
await iconeDaLoja();

console.log(`\n=== ${criados.length} arquivos gerados ===`);

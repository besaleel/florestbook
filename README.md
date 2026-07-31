# Florest Book

Jogo infantil de sons de animais da floresta, para crianças em fase de
pré-alfabetização (2–6 anos). A criança toca a figura de um animal, ouve o som
correspondente e vê o nome com as sílabas separadas.

**Funciona 100% offline.** A rede é usada apenas para o banner de anúncio e a
compra de remoção de anúncios — sem conexão, o jogo continua inteiro.

| | |
|---|---|
| Plataforma | Android (iOS previsto) |
| Stack | Ionic 8 + Angular 20 + Capacitor 8 |
| Idiomas | PT, EN, ES, FR, IT, DE |
| Pacote | `com.florestbook.app` |

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [DOC/ESPECIFICATION.md](DOC/ESPECIFICATION.md) | Especificação completa — decisões de arquitetura, telas, assets, áudio |
| [PROJECT/BACKLOG.md](PROJECT/BACKLOG.md) | Backlog por fases, com o que está feito e o que falta |
| [DOC/GERAR-AAB.md](DOC/GERAR-AAB.md) | Passo a passo do build de release assinado |

## ⚠️ Assets não estão neste repositório

`PROJECT/assets/` e `PROJECT/sounds/` guardam as imagens e os áudios originais
— obra comercial, mantida fora do repositório público. **Sem eles o projeto
compila, mas o jogo abre sem imagens nem som.**

O que falta para rodar por completo:

```
PROJECT/assets/     logo.png, background*.png, os 5 animais .png
PROJECT/sounds/     background-sound.mp3, os 5 animais .mp3
```

Os nomes exatos e as dimensões estão em
[ESPECIFICATION § 3](DOC/ESPECIFICATION.md). Nada em `APK/src/assets/images` e
`APK/src/assets/sounds` é versionado: os dois diretórios são **gerados** a
partir de `PROJECT/`.

## Como rodar

```bash
cd APK
npm install

npm run assets   # PROJECT/ -> APK/src/assets (WebP + áudio normalizado)
npm run icons    # logo.png -> ícones, splash, favicon, ícone da loja

npm start        # navegador, em http://localhost:4200
```

Para gerar o APK de depuração:

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

> `npm run icons` precisa rodar **depois** de qualquer `npx cap sync`: o sync
> recria `android/app/src/main/res/` e apaga os ícones e as telas de abertura.

### Requisitos

- Node.js 20+
- Android Studio (SDK + JDK 17)
- **ffmpeg** — usado por `npm run assets` para normalizar o volume dos sons.
  Sem ele o pipeline avisa e copia os MP3 sem processar.

## Estrutura

```
APK/          Aplicativo Ionic/Angular + Capacitor
  src/app/core/       serviços (áudio, animais, temas, anúncios, preferências)
  src/app/pages/      tela inicial e a floresta
  tools/              build-assets.mjs e build-icons.mjs
DEPLOY/       Artefatos de publicação, termo de uso e política de privacidade
DOC/          Especificação e guia de build
PROJECT/      Backlog e (localmente) os assets originais
```

## Privacidade

O aplicativo **não coleta dados pessoais**. Nome, idioma e preferências ficam
apenas no aparelho, via Capacitor Preferences, e nada é enviado a servidor —
exigência da Política para Famílias do Google Play, que se aplica por o público
declarado incluir crianças.

- [Termo de Uso](DEPLOY/termos-de-uso.html)
- [Política de Privacidade](DEPLOY/politica-privacidade.html)

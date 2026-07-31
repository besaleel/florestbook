# BACKLOG — FLOREST BOOK

Lista de atividades derivada de [ESPECIFICATION.md](../DOC/ESPECIFICATION.md).

**Legenda:** `[ ]` pendente · `[x]` concluído · `[~]` em andamento · 🔒 bloqueado

---

## Fase 0 — Fundação

- [x] **0.1** Repositório git inicializado com `.gitignore` protegendo
      `node_modules/`, `APK/www/`, `local.properties`, **`keystore.properties`**,
      **`*.jks`** e `DEPLOY/*.aab`. As duas entradas em negrito são de
      segurança: senhas e chave de assinatura nunca vão para o repositório
      (ver [DOC/GERAR-AAB.md](../DOC/GERAR-AAB.md))
- [x] **0.2** Projeto criado em `APK/` — **Ionic 8 + Angular 20.3**
- [x] **0.3** Capacitor 8.4 + plataforma Android; `appId=com.florestbook.app`,
      `appName=Florest Book`
- [x] **0.4** Orientação travada em **retrato** (`android:screenOrientation`
      no `AndroidManifest.xml`)
- [x] **0.5** `<title>` do `index.html` definido como "Florest Book"
- [x] **0.6** Build validado: `npm run build` + `npx cap sync` +
      `gradlew assembleDebug` → `app-debug.apk` (9,8 MB)
- [ ] **0.7** APK instalado e aberto em aparelho real *(depende de você)*

## Fase 1 — Pipeline de assets

- [x] **1.1** `APK/tools/build-assets.mjs` (`npm run assets`) — converte
      `PROJECT/assets/` → `APK/src/assets/` com sharp, WebP q85
      (ESPECIFICATION § 3.3)
- [x] **1.2** 5 animais em WebP ~512×768 — **conferir transparência**
      (canal alpha preservado na conversão)
- [x] **1.3** **6 backgrounds** em WebP ~1080×1620 (`standard`, `pascoa`,
      `festejunina`, `halloween`, `natal`, **`anonovo`**). O pipeline varre o
      diretório por padrão de nome, não por lista fixa — o Ano Novo entrou sem
      nenhuma alteração no script, exatamente como previsto.
      **Resultado: ~26 MB em PNG → 2,03 MB em WebP**
- [x] **1.4** `APK/tools/build-icons.mjs` (`npm run icons`) — ícones Android
      nas 5 densidades + foreground adaptativo (safe zone 66%) + favicon +
      apple-touch-icon + splash + `DEPLOY/store-assets/icon-512.png` sem alpha
- [x] **1.5** ⚠️ **Origem correta de cada logo** (ESPECIFICATION § 3.1):
      ícones e favicon derivam de **`logo-simplificada.png`**; tela inicial e
      splash derivam de **`logo.png`**. São dois arquivos distintos — não usar
      um só para tudo
- [x] **1.6** Validar `logo-simplificada.png` dentro da **safe zone de 66%** do
      ícone adaptativo: gerar o ícone, aplicar máscara circular e confirmar que
      o elemento central sobrevive ao corte *(pendência J)*
- [x] **1.7** ⚠️ **Arquivos que o pipeline deve ignorar** em `PROJECT/assets/`:
      `flaicon.ico` (formato não suportado pelo Android) e
      **`modelo-sugerido-posicao-animais.png`** (guia de composição, não é asset
      do jogo). O modelo tem 1024×1536, **a mesma dimensão dos backgrounds** —
      uma varredura por dimensão o embarcaria por engano
- [x] **1.8** Processar os 5 sons dos animais: normalizar volume e reduzir para
      mono 96 kbps. **Sem corte de duração** — a faixa foi dimensionada em 4,5 s
      justamente para não cortar (ESPECIFICATION § 3.4).
      Comando de referência (ffmpeg):
      ```
      ffmpeg -i <origem> \
        -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
        -ac 1 -ar 44100 -b:a 96k <destino>
      ```
      Estimativa: ~411 KB → ~100 KB
- [x] **1.9** Sons copiados para `APK/src/assets/sounds/` — automatizar dentro
      de `npm run assets`
- [x] **1.10** Música de fundo: já comprimida para 723 KB (mono 96 kbps).
      Embarcar como `assets/sounds/background-music.mp3`
- [ ] **1.11** Ouvir a música comprimida em **aparelho real**. O `.wav` de
      origem está a 30.357 Hz (taxa incomum); se houver chiado ou abafamento,
      reencodar a partir do `.wav`, não do MP3 de 256 kbps *(pendência K)*
- [x] **1.12** Arquivos que **não entram no build**: `elefante02.mp3`
      (descartado), `ORIGINAL-background-sound.mp3` e `background-sound.wav`
      (fontes). Conferir que o pipeline não os copia
- [x] **1.13** Extrair **uma cor de borda por tema** para as sobras do palco
      (ESPECIFICATION § 5) — verde nos diurnos, tons escuros no Halloween e no
      Natal. Definir também a cor sólida de fundo do splash
- [x] **1.14** Conferir peso total dos assets embarcados — **2,90 MB**
      (2,03 MB de imagens + 0,87 MB de som). APK debug: **9,8 MB**, bem dentro
      da meta de 30 MB (ESPECIFICATION § 3.3)
- [ ] **1.15** *(opcional, Fase 7)* Reduzir os ícones SVG que o Ionic embarca
      por padrão, mantendo só os efetivamente usados

## Fase 2 — Núcleo do app

- [x] **2.1** `AnimalService` — catálogo dos 5 animais com posição em %,
      calibração do rosto (`object-position` medido por animal) e tempos de
      idle defasados
- [x] **2.2** Chaves internas **sem acento**: `elefante | leao | lobo | macaco |
      sapo`. A mesma chave nomeia PNG, MP3 e chave de tradução
      (ESPECIFICATION § 3.2)
- [x] **2.3** `SettingsService` com Capacitor Preferences + signals: `nome`,
      `idioma`, `som`, `background`, `backgroundEscolhidoManualmente`
- [x] **2.4** `@ngx-translate` **v18** (`provideTranslateService` +
      `provideTranslateHttpLoader`), JSON local
- [x] **2.5** Traduções dos 6 idiomas — mesmo conjunto de chaves em todos
      (validar contagem)
- [x] **2.6** Nomes silabados por idioma (ESPECIFICATION § 4.2). Monossílabos
      (EN `WOLF`/`FROG`, FR `LOUP`, DE `WOLF`/`FROSCH`) ficam **sem hífen** —
      separá-los seria incorreto
- [ ] **2.7** Revisão da separação silábica por falante nativo dos 6 idiomas
      *(pendência H)*
- [x] **2.8** Idioma do aparelho no primeiro uso, com recuo para EN

## Fase 3 — Tela inicial

- [x] **3.1** Layout: logo (`logo.png`), boas-vindas, botão "Começar" grande
- [x] **3.2** Campo de nome da criança (persistido, opcional — jogo funciona
      sem nome)
- [x] **3.3** Seletor de idioma com bandeiras, troca imediata
- [x] **3.4** Botão de música de fundo (liga/desliga, persistido)
- [x] **3.5** Navegação para a tela principal

## Fase 4 — Tela principal (a floresta)

- [ ] **4.1** Palco responsivo mantendo a proporção do background; sobras na cor
      sólida do **tema ativo** (1.13), trocando junto com o background
- [ ] **4.2** Posicionar os **5 animais** em percentuais seguindo o modelo
      `PROJECT/assets/modelo-sugerido-posicao-animais.png` e a tabela de
      ESPECIFICATION § 4.2. Arranjo em **duas fileiras**: leão (~42%, ~53%) e
      elefante (~72%, ~55%) ao fundo; lobo (~34%, ~68%), macaco (~68%, ~72%) e
      sapo (~53%, ~75%) à frente
- [ ] **4.3** Respeitar a **zona útil de 40% a 79%** da altura da tela — acima
      é céu/copas, abaixo é o rodapé do cenário e o banner. Nenhum animal
      invade essas faixas (as duas barras pretas do modelo)
- [ ] **4.4** ⚠️ **Sobreposição visual sim, de toque não.** A arte se sobrepõe
      entre as fileiras, mas cada animal precisa de área tocável exclusiva. Onde
      há disputa, o animal da **frente vence**; a área do de trás é recortada
- [ ] **4.5** Escala relativa respeitando a hierarquia de tamanho
      (elefante > leão ≈ lobo > macaco > sapo), **sem** que o sapo fique menor
      que o alvo mínimo de 48 dp — ele é o menor e fica no centro, é o caso
      crítico
- [ ] **4.6** Barra superior: avatar + nome (esquerda); idioma, background e som
      (direita) — 3 ícones
- [ ] **4.7** ⚠️ **Legibilidade sobre fundos escuros** (ESPECIFICATION § 4.2):
      Halloween e Natal são cenas noturnas, os outros 3 temas são claros.
      Garantir contraste dos ícones e do nome da criança nos dois extremos —
      sombra projetada ou fundo semitransparente, nunca dependendo da cor do
      cenário
- [ ] **4.8** Conferir visualmente o arranjo dos animais **em cada um dos 5
      temas**. A composição é a mesma (centro livre), mas o rodapé do Halloween
      e do Natal tem elementos maiores, e a zona útil termina onde eles começam
- [ ] **4.9** Área reservada do banner no rodapé (recolhe se não houver anúncio)
- [ ] **4.10** Botão "Remover Anúncio" acima do banner
- [ ] **4.11** Animação **idle** por CSS, defasada por animal, com a
      personalidade de cada um (ESPECIFICATION § 2.2): elefante lento e amplo,
      macaco agitado, sapo pulsando com pausa
- [ ] **4.12** Animação de **reação ao toque** (~600 ms, squash & stretch).
      Cuidar para que o "pulo" **não invada a zona de outro animal** nem as
      faixas de 4.3 — a escala momentânea aumenta a área ocupada
- [ ] **4.13** Respeitar `prefers-reduced-motion`
- [ ] **4.14** Animar **somente** `transform` e `opacity` — verificar no
      DevTools que não há layout/paint por frame
- [ ] **4.15** **`z-index` coerente com as fileiras:** os animais da frente
      (lobo, macaco, sapo) sobre os do fundo (leão, elefante), inclusive durante
      as animações

## Fase 4B — Backgrounds temáticos sazonais

✅ **Assets entregues** — os 5 temas estão em `PROJECT/assets/`. Todos são de
festa, então a seleção automática **por data** é o mecanismo desta versão.

Regras completas em ESPECIFICATION § 4.3. Depende de 2.3 (`SettingsService`).

- [x] **4B.1** ⚠️ **Renomear `backgroung-natal.png` → `background-natal.png`**
      *(pendência L)*. O arquivo veio com "backgrou**ng**" (G no lugar do D).
      Sem isso o tema de Natal some silenciosamente, ignorado pelo recuo de
      4B.3 — falha difícil de diagnosticar
- [x] **4B.2** Registro de temas dirigido por dados, conforme a interface `Tema`
      e a tabela de ESPECIFICATION § 4.3. Chaves: `standard`, `pascoa`,
      `festejunina`, `halloween`, `natal` — **sem acento e sem hífen**
- [x] **4B.3** ⚠️ **Recuo seguro:** tema cujo asset não exista é ignorado,
      caindo em `standard` sem erro nem tela em branco (proteção para temas
      futuros e para falhas de nomenclatura)
- [ ] **4B.4** Seletor manual com os 5 temas: liga
      `backgroundEscolhidoManualmente = true`. **A escolha do usuário nunca é
      sobrescrita** por seleção automática
- [x] **4B.5** Todos os temas disponíveis no seletor em qualquer idioma e
      qualquer época do ano
- [ ] **4B.6** Rótulos dos 5 temas traduzidos nos 6 idiomas *(pendência M)*
- [x] **4B.7** `SeasonalService.domingoDePascoa(ano)` — computus gregoriano
      (Meeus/Jones/Butcher), offline. Código pronto em ESPECIFICATION § 4.3
- [x] **4B.8** `temaDaData(data, idioma)`: aplica as 4 janelas (Páscoa −7/+1;
      Festa Junina 01–30/06; Halloween 24–31/10; Natal 01–31/12), retornando
      `standard` fora de época e resolvendo sobreposição pela **janela mais
      curta**
- [x] **4B.9** Restringir **Festa Junina ao PT**. Nos demais idiomas segue
      disponível na troca manual
- [ ] **4B.10** Aplicar na abertura do app e ao retornar do segundo plano,
      **somente** se `backgroundEscolhidoManualmente == false`
- [x] **4B.11** Testes unitários da Páscoa 2024–2032 (31/03, 20/04, 05/04,
      28/03, 16/04, 01/04, 21/04, 13/04, 28/03)
- [x] **4B.12** Testar bordas: primeiro e último dia de cada janela, virada de
      ano (31/12 → 01/01) e ano bissexto
- [ ] **4B.13** Verificação manual com a data do aparelho alterada, confirmando
      que a escolha manual nunca é sobrescrita
- [ ] **4B.14** *(futuro)* Thanksgiving não tem asset e não entra no registro.
      Se for produzido, basta somar a linha (4ª quinta de novembro, idioma EN) —
      a lógica já suporta

## Fase 5 — Faixa do nome e áudio

- [ ] **5.1** Componente da faixa: fundo branco sólido, círculo com o rosto do
      animal à esquerda, nome silabado em caixa alta e fonte grande. Conferir
      que ela se destaca também sobre os **temas claros** (Páscoa, Festa
      Junina) — contorno ou sombra sutil, ver ESPECIFICATION § 4.2
- [ ] **5.2** Círculo do rosto por recorte do próprio PNG (`object-fit: cover` +
      `object-position` calibrado por animal) — sem assets adicionais
- [ ] **5.3** Posicionar imediatamente acima do banner, sem sobreposição
- [ ] **5.4** Fade in / fade out
- [ ] **5.5** ⚠️ Timer de **4,5 s** (não 3 s), reiniciado ao tocar outro animal.
      Dimensionado pelos sons de 4 s (lobo e macaco) — ESPECIFICATION § 3.4
- [ ] **5.6** `AudioService`: pré-carregar sons, tocar **um por vez** (novo som
      interrompe o anterior)
- [ ] **5.7** Música de fundo em loop contínuo, volume suave, com *ducking*
      durante o som do animal
- [ ] **5.8** Verificar que o loop da música emenda **sem estalo** (pontas em
      silêncio)
- [ ] **5.9** Pausar áudio quando o app vai a segundo plano
- [ ] **5.10** O áudio respeita o botão de som; estado persistido
- [ ] **5.11** Validar em aparelho real que o som termina antes do fim da faixa
      de 4,5 s (maiores: lobo 4,02 s e macaco 4,00 s)

## Fase 6 — Monetização

- [ ] **6.1** Integrar plugin AdMob no Capacitor
- [ ] **6.2** ⚠️ **Configurar AdMob para público infantil** —
      `tagForChildDirectedTreatment`, anúncios **não personalizados** e filtro
      de conteúdo restrito. Exigido pela Política para Famílias
      (ESPECIFICATION § 6.1); sem isso o app é **reprovado na revisão**
- [ ] **6.3** Banner **Nativo Avançado** no rodapé, 100% da largura
      (IDs de **teste** durante o desenvolvimento)
- [ ] **6.4** App ID no `AndroidManifest.xml`:
      `ca-app-pub-3480885465464323~9513221026` (sempre o de produção)
- [ ] **6.5** Tratar ausência de rede: recolher o banner sem quebrar o layout
- [ ] **6.6** Integrar Google Play Billing
- [ ] **6.7** Fluxo de compra do produto `remove_ads` (não-consumível)
- [ ] **6.8** Exibir preço **vindo do Google Play** (nunca fixo no código);
      US$ 1,90 é apenas referência
- [ ] **6.9** Remover banner e botão após a compra (estado persistido)
- [ ] **6.10** **Restaurar compra** (obrigatório para reinstalação/troca de
      aparelho)
- [ ] **6.11** Barreira parental antes da tela de pagamento
- [ ] **6.12** Falha ou cancelamento da compra retorna ao jogo sem bloqueio
- [ ] ⚠️ **6.13** **TROCAR PARA OS IDs DE PRODUÇÃO ANTES DA PUBLICAÇÃO ABERTA**

      *Bloqueia a monetização: enquanto isso o app exibe "This is a test ad"
      e **não gera nenhuma receita**.*

      Concentrar a decisão em **um único ponto** do `AdsService` (um método
      `producao()` que retorna `Capacitor.isNativePlatform()`), do qual derivam
      `adId`, `isTesting` e `initializeForTesting`.

      | | Teste | Produção |
      |---|---|---|
      | Bloco de anúncios | `ca-app-pub-3940256099942544/6300978111` (público do Google) | `ca-app-pub-3480885465464323/8466632581` |
      | `isTesting` | `true` | `false` |

      O **App ID** (`ca-app-pub-3480885465464323~9513221026`) é sempre o de
      produção — só o bloco alterna.

      ⚠️ **Depois da troca, nunca toque nos próprios anúncios**: o Google trata
      cliques do próprio desenvolvedor como fraude e suspende a conta AdMob.
      Durante o teste interno, com os IDs de teste, clicar é seguro.

      **Manter em teste enquanto:** teste interno e fechado. **Trocar quando:**
      for publicar em produção aberta — e gerar um novo AAB com `versionCode`
      incrementado.

## Fase 7 — Publicação

- [ ] **7.1** Termo de Uso em HTML → `DEPLOY/termos-de-uso.html`
- [ ] **7.2** Política de Privacidade em HTML → `DEPLOY/politica-privacidade.html`
      (deve declarar: nome fica só no aparelho; uso do AdMob)
- [ ] **7.3** Nos dois documentos, declarar explicitamente o **Compromisso com
      a Política para Famílias do Google Play** e a ausência de coleta de dados
      de crianças (ESPECIFICATION § 6.1)
- [ ] **7.4** Publicar os documentos em URL pública e verificar (HTTP 200,
      conteúdo idêntico ao gerado em `DEPLOY/`)
- [ ] **7.5** Links para os dois documentos na **tela inicial**, abrindo no
      navegador do sistema via Capacitor Browser — exigência da Política para
      Famílias para links externos
- [ ] **7.6** ⚠️ **Criar o keystore `florestbook-release.jks`** (alias
      `florestbook`, RSA 2048, `-validity 10000`) e configurar
      `APK/android/keystore.properties` — ambos **fora do git**. Passo a passo
      em [DOC/GERAR-AAB.md § 2](../DOC/GERAR-AAB.md).
      **Keystore próprio deste app** — não reaproveitar o de outro projeto.
      Perder o arquivo impede atualizar o `com.florestbook.app` para sempre;
      backup em dois lugares + ativar Play App Signing
- [x] **7.6a** Bloco de assinatura no `APK/android/app/build.gradle` lendo
      `keystore.properties`, com aviso audível quando ausente (GERAR-AAB § 3) —
      sem isso o release sai assinado com a chave de **debug** e é rejeitado
- [ ] **7.7** Definir `versionCode` / `versionName` iniciais (1 / 1.0.0)
- [ ] **7.8** Ícone 512×512 sem alpha → `DEPLOY/store-assets/icon-512.png`
- [ ] **7.9** Feature graphic 1024×500 + screenshots
- [ ] **7.10** Descrições da loja nos 6 idiomas
- [ ] **7.11** Confirmar disponibilidade do nome "Florest Book" na Play Store
      (ESPECIFICATION § 7 — "Florest" não é a grafia inglesa de "forest")
- [ ] **7.12** Classificação etária (IARC) coerente com o público de 2–6 anos
- [ ] **7.13** Questionário **Segurança dos Dados** declarando "nenhum dado
      coletado", e marcar na Play Console a exibição da mensagem
      **"Compromisso com a Política para Famílias do Google Play"**
- [ ] **7.14** Conferir peso final do AAB — meta < 30 MB
- [ ] **7.15** AAB assinado gerado em `DEPLOY/florestbook-release-v01.aab`,
      seguindo [DOC/GERAR-AAB.md](../DOC/GERAR-AAB.md). Conferir na saída do
      Gradle que **não** aparece o aviso de `keystore.properties nao encontrado`
- [ ] **7.16** Registrar o build na tabela "Histórico de releases" do
      GERAR-AAB.md (arquivo, `versionCode`, `versionName`)
- [ ] **7.17** Publicar em teste interno e validar em aparelho real
- [x] **7.18** ~~Documentar o processo de build~~ — ✅ [DOC/GERAR-AAB.md](../DOC/GERAR-AAB.md)

## Fase 8 — Melhorias (pós-lançamento)

- [ ] **8.1** Sprite sheets de animação (piscar, mexer orelha, levantar cabeça)
      substituindo o PNG estático — sem mudar a arquitetura do app
- [ ] **8.2** Variações de som por animal, alternando a cada toque
      (ESPECIFICATION § 9)
- [ ] **8.3** Mais animais da floresta
- [ ] **8.4** Versão iOS — a preparação está em ESPECIFICATION § 6.2
      (ícones já gerados, sem APIs exclusivas de Android fora das camadas
      isoladas de ads e billing)
- [ ] **8.5** Novos temas de background — a arquitetura da Fase 4B aceita novos
      temas apenas somando uma entrada ao registro

---

## Achados desta entrega (31/07/2026)

Coisas descobertas ao construir as Fases 0–3, que não estavam previstas:

| # | Achado | Situação |
|---|--------|----------|
| 1 | **6º background entregue:** `background-anonovo.png` estava em `PROJECT/assets/` sem constar na especificação | ✅ Registrado como tema `anonovo`, janela **25/12–05/01**. O Natal foi encurtado para **01–24/12** para não colidir. É a única janela que atravessa a virada do ano |
| 2 | **O logo diz "ForestBook"**, com a grafia inglesa correta, enquanto o app se chama "Florest Book" (§ 7) | ⚠️ *Pendência N* — **decisão sua**: qual grafia vale na loja e na tela? |
| 3 | **`logo-simplificada.png` é idêntico em complexidade ao `logo.png`** — texto + 5 animais. Reduzido a 48 px o nome fica ilegível, que é exatamente o problema que a existência dos dois arquivos deveria evitar (§ 3.1) | ⚠️ *Pendência O* — sugestão: uma versão só com um animal ou o livro, sem texto |
| 4 | **`background-anonovo.png` é fotorrealista**; os outros cinco são cartoon, como os animais | ⚠️ *Pendência P* — manter ou pedir versão em cartoon? |
| 5 | Grafia `backgroung-natal.png` *(pendência L)* | ✅ Resolvido **no pipeline**, sem tocar no original: `build-assets.mjs` mapeia a grafia e grava `background-natal.webp` |
| 6 | Safe zone de 66% *(pendência J)* | ✅ Validada — `npm run icons` gera a prova com máscara circular em `DEPLOY/store-assets/validacao-safe-zone.png` |
| 7 | O keystore `florestbook-release.jks` **já existe** na raiz do projeto | ✅ Fora do git (`.gitignore`). Falta só o `keystore.properties` com as senhas, quando for gerar o AAB |

## Pendências do cliente

| Item | Bloqueia | Situação |
|------|----------|----------|
| **Renomear `backgroung-natal.png`** *(pendência L)* | 4B.1 | ⚠️ Grafia com "G" no lugar do "D" — sem isso o tema de Natal não aparece |
| Licença da música de fundo *(pendência D)* | 7.4 | A confirmar — item de revisão da Play Store |
| Revisão nativa da separação silábica *(pendência H)* | 2.7 | A providenciar (6 idiomas) |
| Nomes dos 5 temas nos 6 idiomas *(pendência M)* | 4B.6 | A providenciar |
| **Keystore `florestbook-release.jks`** | 7.6 | A criar — comando interativo em [DOC/GERAR-AAB.md § 2](../DOC/GERAR-AAB.md) (pede senha no terminal) |
| URL pública para termos/política | 7.4 | A definir |
| Conta Google Play Console ativa | 7.17 | A confirmar |
| ~~Backgrounds temáticos~~ *(pendência I)* | 4B | ✅ **Entregues** — Páscoa, Festa Junina, Halloween e Natal |
| ~~Eixo dos temas: ambiental ou sazonal~~ | 4B.7–4B.13 | ✅ Os 4 assets são de festa → **sazonal por data** |
| ~~IDs do AdMob~~ *(pendência E)* | 6.4, 6.13 | ✅ **Entregues** em [DOC/admob.MD](../DOC/admob.MD) |
| ~~Logo com canal alpha~~ | 1.5 | ✅ **Entregue** (`logo.png` + `logo-simplificada.png`) |
| ~~Sons dos 5 animais~~ | 1.8 | ✅ **Entregues** |
| ~~Música de fundo comprimida~~ | 1.10 | ✅ **Entregue** (723 KB) |

## Ordem sugerida

`0 → 1 → 2 → 3 → 4 → 4B → 5 → 6 → 7`

- A **Fase 6** pode correr em paralelo à 5.
- A **Fase 7** começa cedo nos itens de documento (7.1–7.4), que não dependem
  de código.
- A **Fase 4B** é autocontida e não tem mais bloqueio de asset — pode ser feita
  a qualquer momento após 4.4. Comece por **4B.1** (renomear o arquivo do
  Natal), que é a única correção de origem.

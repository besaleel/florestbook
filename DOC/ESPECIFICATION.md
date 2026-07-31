# ESPECIFICAÇÃO DO GAME FLOREST BOOK

## 1. Visão geral

FLOREST Book é um jogo infantil baseado no clássico livro de sons de animais: a
criança toca a figura de um animal e o jogo emite o som correspondente,
exibindo o nome do animal com as sílabas separadas.

Os personagens são cinco animais da floresta: **elefante, leão, lobo, macaco e
sapo**.

- **Público-alvo:** crianças em fase pré-alfabetização (2–6 anos).
- **Plataforma inicial:** Android (Google Play).
- **Plataforma futura:** iOS (App Store).
- **Requisito central:** funcionar **100% offline**. A única funcionalidade que
  exige rede é o banner de anúncio e a compra de remoção de anúncios; a
  ausência de rede nunca pode quebrar o jogo.
- **Multi-idioma:** PT, EN, ES, FR, IT, DE.

### 1.1 Stack definida

| Camada | Escolha |
|--------|---------|
| Framework | Angular + Ionic |
| Empacotamento nativo | Capacitor |
| Renderização dos animais | 2D (PNG com transparência) + animação CSS |
| Áudio | HTML5 Audio / Web Audio API |
| i18n | `@ngx-translate/core` com arquivos JSON locais |
| Persistência | Capacitor Preferences (nome, idioma, som, background) |
| Anúncios | AdMob Native Advanced via plugin Capacitor |
| Compras | Google Play Billing (produto único, não-consumível) |

---

## 2. Decisões de arquitetura

### 2.1 Renderização 2D

Os animais são renderizados como **PNG com transparência animados por CSS**, não
como malhas 3D. O jogo não embarca nem carrega assets 3D em tempo de execução.

Motivo: o público-alvo usa em grande parte aparelhos Android de entrada — o
celular dos pais. Renderizar WebGL nesses aparelhos tem risco alto de travamento
e consumo de bateria, sem ganho perceptível para uma cena estática vista em
retrato. O PNG animado por CSS entrega a mesma leitura visual com custo
próximo de zero.

**Os PNG entregues são adequados para uso direto:** 1024×1536, RGBA, com o
animal recortado sobre fundo transparente. Não é necessário trabalho de recorte.

### 2.2 Como os animais ganham vida sem 3D

O requisito "parecer estar vivo" é atendido por animação CSS sobre o PNG:

- **Idle (contínuo, sutil):** respiração via `transform: scale()` suave em
  loop, com leve balanço (`rotate` de 1–2°). Cada animal recebe `delay` e
  duração diferentes para que não pulsem em sincronia.
- **Ao toque:** animação curta de reação (~600 ms) — um "pulo" com squash &
  stretch, escala e rotação — disparada junto com o som.
- **Acessibilidade:** respeitar `prefers-reduced-motion`, reduzindo o idle.

Somente `transform` e `opacity` são animados, garantindo aceleração por GPU.

Personalidade por animal (mesmo mecanismo, parâmetros distintos), para que a
floresta não pareça uniforme:

| Animal | Idle |
|--------|------|
| Elefante | Respiração lenta e ampla; balanço mínimo (animal pesado) |
| Leão | Respiração média; balanço de cabeça um pouco maior |
| Lobo | Respiração média-rápida, alerta |
| Macaco | O mais agitado: ciclo curto, rotação maior |
| Sapo | Pulsação em ciclos curtos com pausa entre elas (inflar/desinflar) |

Animações mais ricas (piscar, mexer orelha) ficam para versões futuras, via
sprites pré-renderizados — sem alterar a arquitetura do app.

---

## 3. Assets

Todos os originais ficam em `PROJECT/` e **nunca são sobrescritos**.

### 3.1 Background e logo (`PROJECT/assets/`)

| Arquivo | Dimensão | Formato | Peso | Uso |
|---------|----------|---------|------|-----|
| `background.png` | 1024×1536 | RGB (sem alpha) | 2.259 KB | Fundo padrão (`standard`) |
| `background-pascoa.png` | 1024×1536 | RGB | 2.789 KB | Tema Páscoa |
| `background-festejunina.png` | 1024×1536 | RGB | 2.569 KB | Tema Festa Junina |
| `background-halloween.png` | 1024×1536 | RGB | 2.348 KB | Tema Halloween |
| `backgroung-natal.png` | 1024×1536 | RGB | 3.174 KB | Tema Natal — ⚠️ ver grafia abaixo |
| `logo.png` | 1024×1024 | RGBA | 1.941 KB | Tela inicial (logo completo) |
| `logo-simplificada.png` | 1024×1024 | RGBA | 1.879 KB | **Origem dos ícones do app** |
| `flaicon.ico` | 256×256 | ICO | 170 KB | Build desktop / favicon de site |
| `modelo-sugerido-posicao-animais.png` | 1024×1536 | RGB | — | **Não embarcado** — guia de composição (§ 4.2) |

Ambos os logos têm **canal alpha**, atendendo ao requisito do ícone adaptativo
do Android.

#### Os cinco backgrounds

Todos entregues em 1024×1536 RGB, no mesmo estilo ilustrado e com a **mesma
composição em corredor de floresta**: vegetação emoldurando as laterais e o
**centro livre**, que é exatamente onde os animais são posicionados. Isso
significa que **o mesmo arranjo de posições em percentuais (§ 4.2) serve para
todos os temas** — não é preciso calibrar posições por background.

| Tema | Chave | Cena |
|------|-------|------|
| Padrão | `standard` | Floresta diurna |
| Páscoa | `pascoa` | Bandeirinhas pastel, ovos, coelho, cruz com manto |
| Festa Junina | `festejunina` | Bandeirinhas xadrez, fogueira, barraca de palha, chapéu |
| Halloween | `halloween` | **Noturna** — lua, morcegos, abóboras, fantasma, céu roxo |
| Natal | `natal` | **Noturna** — neve, pinheiros decorados, boneco de neve, lua |

> ⚠️ **Grafia do arquivo do Natal.** O arquivo foi entregue como
> **`backgroung-natal.png`** — "backgrou**ng**", com **G** no lugar do **D**. As
> demais opções seguem o padrão `background-*`. **Ação recomendada:** renomear
> para `background-natal.png` e padronizar. Enquanto não for renomeado, o
> pipeline precisa tratar essa exceção explicitamente, ou o tema simplesmente
> não aparece (o recuo seguro de § 4.3 o ignoraria sem erro — falha silenciosa,
> difícil de diagnosticar).

> **Dois temas são cenas noturnas escuras** (Halloween e Natal), enquanto os
> outros três são diurnos e claros. Isso tem consequência de interface — ver
> § 4.2, "Legibilidade sobre fundos escuros".

#### Qual logo usar em cada lugar

A existência de duas versões é intencional e resolve um problema real: um logo
com muito detalhe fica ilegível reduzido a 48×48 px na gaveta de aplicativos.

| Contexto | Arquivo | Motivo |
|----------|---------|--------|
| Tela inicial, splash | `logo.png` | Exibido grande, comporta o detalhe |
| Ícone do app (todas as densidades) | `logo-simplificada.png` | Legível em tamanho pequeno |
| Ícone adaptativo Android | `logo-simplificada.png` | Safe zone de 66% corta as bordas |
| Ícone da Play Store (512, sem alpha) | `logo-simplificada.png` | Consistência com o ícone instalado |
| Favicon do WebView | `logo-simplificada.png` | 64 px |

> **Validar antes do build:** confirmar que `logo-simplificada.png` continua
> legível dentro da **safe zone de 66%** do ícone adaptativo — o Android corta
> as bordas em máscaras circulares e o elemento central precisa sobreviver ao
> corte.

Com **cinco temas entregues**, o seletor de background da tela principal fica
**visível** e a seleção sazonal automática (§ 4.3) está ativa.

> **Sobre `flaicon.ico`:** o formato `.ico` **não é suportado pelo Android** e
> não será embarcado no app. Fica disponível para build desktop ou favicon de
> site institucional. Para o WebView, o favicon usado é PNG derivado do
> `logo-simplificada.png`.

### 3.1.1 Origem única de logo e ícones

Os dois PNG de logo em `PROJECT/assets/` são a **fonte única** de todo logo e
ícone do aplicativo. Nada é desenhado à parte: `npm run icons` deriva tudo
deles, garantindo consistência visual.

| Destino | Formato gerado | Fonte | Observação |
|---------|----------------|-------|------------|
| Ícone do app Android | PNG mipmap, 5 densidades (48→192) | simplificada | Legado + foreground adaptativo |
| Ícone adaptativo | `ic_launcher_foreground.png` | simplificada | Safe zone de 66% |
| Logo da tela inicial | `assets/logo.webp` (512) | `logo.png` | |
| Favicon do WebView | `assets/icon/favicon.png` (64) | simplificada | |
| Apple touch icon / PWA | `icon-180.png`, `icon-512.png` | simplificada | Já preparado para o iOS futuro |
| Splash screen | `drawable/splash.png` + `splash_land.png` | `logo.png` | Logo sobre a cor sólida da marca |
| Ícone da Play Store | `DEPLOY/store-assets/icon-512.png` | simplificada | **Sem alpha** (exigência do Google) — achatar sobre cor sólida |

### 3.2 Animais

Cinco animais, cada um com `.png` 1024×1536 RGBA.

| Animal | Arquivo | Peso | Som |
|--------|---------|------|-----|
| Elefante | `elefante.png` | 2.418 KB | `elefante.mp3` |
| Leão | `leao.png` | 1.241 KB | `leao.mp3` |
| Lobo | `lobo.png` | 2.519 KB | `lobo.mp3` |
| Macaco | `macaco.png` | 2.352 KB | `macaco.mp3` |
| Sapo | `sapo.png` | 2.259 KB | `sapo.mp3` |

**Nomenclatura fixa:** a chave interna do animal é
`elefante | leao | lobo | macaco | sapo` — em português, minúscula e **sem
acento**. Ela nomeia o PNG, o MP3 e a chave de tradução. O nome exibido ao
usuário vem sempre do i18n, nunca da chave.

### 3.3 Pipeline de otimização

Antes de entrar em `APK/src/assets/`, todo asset passa por:

1. Conversão para **WebP** (qualidade ~85, alpha preservado).
2. Redimensionamento: animais para ~512×768; backgrounds para ~1080×1620.
3. Meta de peso: **app final abaixo de 30 MB**.

Estimativa: em WebP q85, imagens desse tipo ficam entre ~130 e ~330 KB cada. Os
5 animais + 5 backgrounds + logos devem somar **cerca de 2 a 3 MB**, contra
~26 MB em PNG — folga confortável na meta.

O pipeline deve **varrer o diretório por padrão de nome**, e não trabalhar com
uma lista fixa de arquivos: novos backgrounds entram sem alterar o script.

**Arquivos de `PROJECT/assets/` que o pipeline deve ignorar:**
`flaicon.ico` (formato não suportado no Android) e
`modelo-sugerido-posicao-animais.png` (guia de composição, não é asset do jogo).
O modelo tem 1024×1536, a mesma dimensão dos backgrounds — uma varredura por
dimensão o pegaria por engano.

### 3.4 Áudio (`PROJECT/sounds/`)

Estado atual dos arquivos entregues:

| Arquivo | Duração | Bitrate | Canais | Taxa | Peso | Situação |
|---------|---------|---------|--------|------|------|----------|
| `background-sound.mp3` | 61,70 s | **96 kbps** | mono | 48 kHz | **723 KB** | ✅ Comprimida |
| `elefante.mp3` | 2,12 s | 256 kbps | estéreo | 44,1 kHz | 66 KB | A processar |
| `leao.mp3` | 2,69 s | 256 kbps | estéreo | 48 kHz | 84 KB | A processar |
| `lobo.mp3` | **4,02 s** | 256 kbps | estéreo | 44,1 kHz | 126 KB | A processar |
| `macaco.mp3` | **4,00 s** | VBR | estéreo | 48 kHz | 80 KB | A processar |
| `sapo.mp3` | 1,75 s | 256 kbps | estéreo | 44,1 kHz | 55 KB | A processar |

Arquivos presentes em `PROJECT/sounds/` que **não são embarcados**:

| Arquivo | Motivo |
|---------|--------|
| `elefante02.mp3` | **Descartado por decisão do cliente** — o som usado é `elefante.mp3` |
| `ORIGINAL-background-sound.mp3` | Original a 256 kbps, preservado como fonte |
| `background-sound.wav` | Fonte não comprimida (30.357 Hz, mono, 3.656 KB) |

#### Música de fundo — compressão aplicada ✅

De **1.927 KB para 723 KB** (redução de 62%), mono a 96 kbps, sem perda audível
no alto-falante de um celular. O original fica preservado como
`ORIGINAL-background-sound.mp3`.

> **Verificar antes de embarcar:** o `.wav` de origem está a **30.357 Hz**, uma
> taxa de amostragem incomum que sugere reamostragem de material de origem já
> limitado em banda. Ouvir o resultado a 96 kbps em um aparelho real; se houver
> chiado ou abafamento, reencodar a partir do `.wav` com filtro passa-baixa
> explícito em vez de reencodar o MP3 de 256 kbps (evita perda em cascata).

#### Processamento a aplicar nos sons dos animais

**Os arquivos são editados na origem, e não cortados na reprodução.** Cortar via
`pause()` interromperia o som no meio, produzindo um clique audível, e não
reduziria o peso embarcado.

1. **Normalização de volume** (`loudnorm I=-16 TP=-1.5`) em todos. Sem isso, a
   criança leva um susto num animal e mal ouve outro. Alvo de RMS entre −16 e
   −19 dB.
2. **Mono, 96 kbps** — sem diferença audível no alto-falante de um celular.
   Estimativa: ~411 KB → ~100 KB no total.
3. **Sem corte de duração** — ver a decisão sobre a faixa abaixo. Caso algum som
   precise ser encurtado no futuro, o corte é feito em ponto de silêncio
   natural, com fade-out de 150 ms, nunca no meio de uma vocalização.

#### Duração da faixa: 4,5 s (decisão)

O som mais longo dura **4 s** (`lobo` e `macaco`). A faixa com o nome do animal
**nunca deve sumir antes do som terminar** — para uma criança em
pré-alfabetização, o nome escrito precisa continuar visível enquanto ela ouve o
som.

**Decisão: a faixa dura 4,5 s para todos os animais**, e os áudios não são
cortados. Justificativa:

- Preserva os sons como foram entregues, sem risco de corte artificial em uivo
  ou gritaria de macaco — vocalizações que não têm silêncio interno óbvio.
- Duração **uniforme** para todos os animais: comportamento previsível, sem um
  animal cujo nome some mais cedo que o dos outros.
- A margem de 0,5 s evita que a faixa desapareça no exato instante em que o som
  acaba, o que soaria abrupto.
- 4,5 s continua curto o bastante para não travar a criança que quer tocar no
  próximo animal — e um novo toque reinicia a faixa de qualquer forma (§ 4.2).

Nomenclatura final embarcada: `assets/sounds/<animal>.mp3` (`elefante`, `leao`,
`lobo`, `macaco`, `sapo`) e `assets/sounds/background-music.mp3`.

> **Pendência D — direitos autorais da música de fundo.** Confirmar que
> `background-sound.mp3` é livre de direitos ou devidamente licenciado, com o
> comprovante arquivado em `DEPLOY/`. É item de revisão da Play Store.

**Regras de áudio:**

- Um som por vez: tocar um novo animal interrompe o anterior.
- A música de fundo abaixa de volume (duck) enquanto um som de animal toca.
- A música de fundo toca em **loop contínuo**, sem emenda audível.
- O áudio respeita o botão de som; o estado é persistido.
- Todo o áudio é local — nenhum download em tempo de execução.

---

## 4. Telas

### 4.1 Tela inicial

- Logo do jogo.
- Mensagem de boas-vindas com campo editável para o **nome da criança**
  (persistido; se vazio, o jogo funciona normalmente sem nome).
- **Botão grande "Começar"** — alvo de toque generoso, adequado à idade.
- Seletor de idioma: PT, EN, ES, FR, IT, DE (bandeiras + rótulo).
- Ícone para ligar/desligar a música de fundo.

### 4.2 Tela principal (a floresta)

- **Fundo:** o background selecionado, cobrindo a tela.
- **Animais:** os 5 dispersos sobre o fundo, sem sobreposição de áreas de
  toque, com animação idle contínua.
- **Canto superior direito:** 3 ícones — Idioma, Background e Som.
- **Canto superior esquerdo:** avatar + nome da criança.
- **Rodapé:** banner de anúncio nativo ocupando 100% da largura.
- **Acima do banner:** texto/botão "Remover Anúncio".

#### Composição dos 5 animais

> **Modelo de referência:** `PROJECT/assets/modelo-sugerido-posicao-animais.png`
> — arte de composição fornecida pelo cliente, mostrando o arranjo pretendido
> dos cinco animais sobre o cenário. **Não é um asset do jogo** e não é
> embarcada: serve como guia visual para calibrar as posições. As duas faixas
> pretas horizontais delimitam a **zona útil** dos animais.

Posições em **percentuais** do palco, nunca em pixels.

**Zona útil:** dos **40% aos 79%** da altura da tela (≈ 39% da altura). Acima
fica o céu e as copas; abaixo, o rodapé do cenário (tronco, cogumelos) e o
banner de anúncio. Nenhum animal invade essas faixas.

O arranjo é **em duas fileiras, com sobreposição parcial em profundidade** —
não são cinco animais espalhados isoladamente. Isso cria a leitura de "grupo de
amigos" e aproveita melhor a zona útil, que é estreita:

| Animal | Centro (x, y) | Fileira | Observação |
|--------|---------------|---------|------------|
| Leão | ~42%, ~53% | Fundo (esquerda) | Parcialmente atrás do lobo |
| Elefante | ~72%, ~55% | Fundo (direita) | Maior de todos, ancora a cena |
| Lobo | ~34%, ~68% | Frente (esquerda) | Sobrepõe a base do leão |
| Macaco | ~68%, ~72% | Frente (direita) | Sobrepõe a base do elefante |
| Sapo | ~53%, ~75% | Frente (centro) | Menor de todos, à frente |

Valores medidos sobre o modelo, a ajustar no ajuste fino.

**A sobreposição é apenas visual.** As **áreas de toque não podem se
sobrepor** — cada animal precisa de uma região exclusiva e confortável para o
dedo de uma criança. Onde a arte se sobrepõe, a área tocável do animal de trás
é recortada para não competir com a do da frente. O animal da **frente sempre
vence** o toque na região disputada.

A escala relativa respeita a hierarquia natural de tamanho (elefante > leão ≈
lobo > macaco > sapo), sem que o sapo fique menor que o alvo mínimo de toque de
48 dp — como ele é o menor e fica no centro, é o que exige mais atenção.

Os cinco backgrounds compartilham a mesma composição — laterais com vegetação e
**centro livre** —, então **um único arranjo atende a todos os temas**. Ainda
assim, conferir visualmente o resultado em cada um: o rodapé do Halloween e do
Natal tem elementos maiores (tronco caído, cogumelos, arbustos com frutos), e a
zona útil termina justamente onde eles começam.

#### Legibilidade sobre fundos escuros

Halloween e Natal são cenas **noturnas**; os outros três temas são claros. A
interface precisa funcionar nos dois extremos:

- A **faixa do nome** é branca sólida (§ abaixo) — funciona bem sobre fundo
  escuro, mas sobre os temas claros precisa de contorno ou sombra sutil para não
  se dissolver no cenário.
- Os **ícones da barra superior** e o nome da criança devem ter contraste
  garantido em ambos os casos: usar sombra projetada suave ou um fundo
  semitransparente atrás dos ícones, em vez de depender da cor do cenário.
- A **cor sólida das sobras do palco** (§ 5) deve acompanhar o tema ativo — um
  verde diurno emoldurando a cena noturna do Natal ficaria evidente. Extrair uma
  cor de borda por tema.

#### Faixa do nome do animal

Ao tocar em um animal:

1. Toca o som do animal.
2. Dispara a animação de reação do animal tocado.
3. Exibe uma **faixa horizontal branca sólida**, posicionada **logo acima do
   banner de anúncio**, contendo:
   - o **rosto do animal dentro de um círculo**, alinhado à esquerda da faixa;
   - o **nome do animal com sílabas separadas por hífen**, no idioma ativo
     (ex.: `MA-CA-CO`), em caixa alta e fonte grande.
4. A faixa desaparece após **4,5 segundos** — duração uniforme para todos os
   animais, dimensionada pelos sons mais longos (lobo e macaco, 4 s). Ver a
   justificativa em § 3.4.
5. Se outro animal for tocado antes disso, a faixa atual some e a do novo animal
   é exibida (o timer reinicia).
6. Entrada e saída com efeito **fade in / fade out**.

O círculo com o rosto é obtido por recorte da região da cabeça do PNG do animal
(`object-fit: cover` + `object-position` calibrado por animal), sem necessidade
de assets adicionais.

#### Nomes com sílabas separadas

Tabela a preencher no i18n. As separações precisam ser **revisadas por falante
nativo** de cada idioma — separação silábica não é derivável mecanicamente.

| Animal | PT | EN | ES | FR | IT | DE |
|--------|----|----|----|----|----|----|
| elefante | E-LE-FAN-TE | E-LE-PHANT | E-LE-FAN-TE | É-LÉ-PHANT | E-LE-FAN-TE | E-LE-FANT |
| leao | LE-ÃO | LI-ON | LE-ÓN | LI-ON | LE-O-NE | LÖ-WE |
| lobo | LO-BO | WOLF | LO-BO | LOUP | LU-PO | WOLF |
| macaco | MA-CA-CO | MON-KEY | MO-NO | SIN-GE | SCIM-MI-A | AF-FE |
| sapo | SA-PO | FROG | RA-NA | GRE-NOUILLE | RA-NA | FROSCH |

> Palavras monossilábicas (WOLF, FROG, LOUP) são exibidas inteiras, sem hífen.

### 4.3 Backgrounds temáticos sazonais

O jogo seleciona automaticamente o background correspondente à época do ano,
mantendo **todos os temas disponíveis para troca manual a qualquer momento**.

Os **cinco temas foram entregues** (§ 3.1) e todos são de festas do calendário,
o que define a seleção automática por data como o mecanismo desta versão.

#### Registro de temas

O mecanismo é dirigido por dados: acrescentar um tema é acrescentar uma entrada,
sem tocar em lógica.

```ts
interface Tema {
  chave: string;          // 'standard', 'natal', 'pascoa', ...
  asset: string;          // 'background-<chave>.webp'
  janela?: JanelaSazonal; // ausente = nunca entra automaticamente
  idiomas?: string[];     // ausente = todos os idiomas
}
```

Registro desta versão:

| `chave` | `asset` | `janela` | `idiomas` |
|---------|---------|----------|-----------|
| `standard` | `background.webp` | — (recuo padrão) | todos |
| `pascoa` | `background-pascoa.webp` | Páscoa −7/+1 | todos |
| `festejunina` | `background-festejunina.webp` | 01–30/06 | **PT** |
| `halloween` | `background-halloween.webp` | 24–31/10 | todos |
| `natal` | `background-natal.webp` | 01–31/12 | todos |

> As chaves são **sem acento e sem hífen** (`pascoa`, `festejunina`),
> acompanhando a convenção das chaves de animal (§ 3.2). O nome exibido no
> seletor vem do i18n.

> **Thanksgiving não tem asset** e por isso não entra no registro. Se um
> background de Ação de Graças for produzido no futuro, basta somar a linha
> (janela: 4ª quinta de novembro, idioma EN) — a lógica já a suporta.

Regras do mecanismo:

- **Um tema cujo asset não exista é ignorado**, com recuo para `standard` —
  nunca gera erro nem tela em branco. Vale como proteção para temas futuros e
  para falhas de nomenclatura no pipeline.
- **A escolha manual do usuário sempre vence** a seleção automática.
  `SettingsService` guarda dois valores distintos: `background` (tema atual) e
  `backgroundEscolhidoManualmente` (booleano). O seletor manual liga o booleano;
  nada volta a alterá-lo sozinho.

  | Estado | Resultado |
  |--------|-----------|
  | Usuário nunca trocou de background | Automático (ou padrão, fora de época) |
  | Usuário escolheu qualquer background | A escolha dele, permanentemente |

  Essa regra evita que o cenário mude sozinho entre uma sessão e outra — para
  uma criança pequena, isso é confuso.
- **O seletor exibe os 5 temas**, em qualquer idioma e em qualquer época do ano.
  A sazonalidade afeta apenas qual é escolhido por padrão — ninguém perde acesso
  a nenhum cenário.

#### Janelas sazonais

A verificação ocorre na **abertura do app** e ao voltar do segundo plano, usando
a **data local do aparelho** — sem qualquer chamada de rede. Fora de todas as
janelas: `standard`.

| Tema | Janela | Cálculo | Idioma |
|------|--------|---------|--------|
| Páscoa | 7 dias antes até 1 dia depois do domingo de Páscoa | Data móvel — computus | Todos |
| Festa Junina | 1 a 30 de junho | Fixo | Somente PT |
| Halloween | 24 a 31 de outubro | Fixo | Todos |
| Natal | 1 a 31 de dezembro | Fixo | Todos |

Em caso de sobreposição, vale a janela de **menor duração** (a mais específica).
Com as janelas acima, nenhuma colide: a Páscoa cai entre março e abril, e as
demais são meses fixos distintos.

**Festa Junina é restrita ao português** por ser culturalmente específica —
exibi-la automaticamente para quem não a celebra não faz sentido para a criança.
Ela segue **disponível no seletor manual em todos os idiomas**. Se o usuário
mudar de idioma durante junho e ainda não tiver escolhido background
manualmente, o tema passa a valer na próxima verificação.

**Festa Junina é o tema que melhor combina com o cenário**: bandeirinhas
xadrez, fogueira e barraca de palha se integram naturalmente à clareira da
floresta.

##### Páscoa — data móvel

A Páscoa muda de data todo ano. O **algoritmo de Meeus/Jones/Butcher (computus
gregoriano)** roda offline e vale para qualquer ano, sem manutenção:

```ts
function domingoDePascoa(ano: number): Date {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}
```

Algoritmo **verificado** contra as datas reais de 2024 a 2032 (31/03/2024,
20/04/2025, 05/04/2026, 28/03/2027, 16/04/2028, 01/04/2029, 21/04/2030,
13/04/2031, 28/03/2032) — todas conferem.

### 4.4 Tela de pagamento

Acionada pelo botão "Remover Anúncio":

- Produto único não-consumível: **`remove_ads`**.
- Preço de referência: **US$ 1,90** — o valor exibido vem **sempre do Google
  Play** (moeda e conversão locais), nunca fixo no código.
- Após a compra, o banner é removido permanentemente e o botão deixa de ser
  exibido.
- Deve haver **"Restaurar compra"**, exigido para reinstalação/troca de
  aparelho.
- Falha ou cancelamento retorna ao jogo sem qualquer bloqueio.

---

## 5. Responsividade

O jogo será usado em celulares e tablets dos pais, em tamanhos variados.

- Orientação: **retrato**, coerente com os assets 1024×1536.
- O posicionamento dos animais é definido em **percentuais** do palco, não em
  pixels, preservando a composição em qualquer proporção de tela.
- O palco mantém a proporção do background; sobras recebem cor sólida harmônica
  **extraída do tema ativo** — verde nos temas diurnos, tons escuros no
  Halloween e no Natal (§ 4.2).
- Alvos de toque com no mínimo 48 dp, considerando a imprecisão do toque
  infantil.
- Faixa e banner nunca se sobrepõem.

---

## 6. Requisitos não funcionais

- **Offline-first:** nenhuma tela depende de rede. Sem conexão, o espaço do
  banner é simplesmente recolhido.
- **Desempenho:** 60 fps em Android de entrada; animações apenas em
  `transform`/`opacity` (aceleradas por GPU).
- **Tamanho:** app final abaixo de 30 MB.
- **Barreira parental:** a compra é uma ação de adulto — proteção simples antes
  da tela de pagamento.

### 6.1 Política para Famílias do Google Play (obrigatória)

O público-alvo declarado inclui crianças, o que sujeita o FLOREST BOOK à
**Política para Famílias** do Google Play. **Decisão do cliente:** exibir a
mensagem *"Compromisso com a Política para Famílias do Google Play"* na seção
**Segurança dos dados** da ficha da loja.

| Requisito | Como o app atende |
|-----------|-------------------|
| Não coletar dados pessoais de crianças | O nome fica **só no aparelho** (Capacitor Preferences); nada é enviado a servidor |
| Sem identificadores de publicidade para personalização | AdMob configurado com **anúncios não personalizados** e `tagForChildDirectedTreatment` |
| Anúncios de classificação apropriada | Filtro de conteúdo no AdMob restrito a público infantil |
| Sem links externos sem barreira parental | Compra protegida por barreira parental (§ 4.4) |
| Política de privacidade acessível | URL pública, obrigatória na Play Console |
| Questionário de Segurança dos Dados coerente | Declarar "nenhum dado coletado" — precisa ser verdade |

> **Consequência técnica direta:** a integração do AdMob **não pode** usar a
> configuração padrão. É obrigatório marcar o app como dirigido a crianças e
> desativar a personalização de anúncios — caso contrário o app é reprovado na
> revisão, mesmo funcionando.

A Política de Privacidade e o Termo de Uso devem declarar explicitamente esse
compromisso e a ausência de coleta de dados.

### 6.2 Preparação para iOS

O iOS está declarado como plataforma futura (§ 1). Nada nesta versão deve
impedi-lo:

- Manter o projeto Capacitor com a plataforma iOS adicionável sem refatoração.
- Não usar APIs exclusivas de Android fora de camadas isoladas (ads, billing).
- Gerar desde já os ícones `icon-180.png` e `icon-512.png` (§ 3.1.1).
- Na App Store, o equivalente à Política para Famílias é o **Kids Category** e o
  App Privacy — as mesmas restrições de anúncio se aplicam.

---

## 7. Dados do aplicativo

- **Nome do pacote:** `com.florestbook.app`
- **Nome de exibição:** Florest Book
- **Orientação:** retrato
- **AdMob** (fonte: [admob.MD](admob.MD)):
  1. Nome: `Florest Book`
  2. ID do aplicativo: `ca-app-pub-3480885465464323~9513221026`
  3. Formato: **Nativo avançado** — `FLORESTBOOK_NATIVE_RODAPE`
  4. ID do bloco de anúncios: `ca-app-pub-3480885465464323/8466632581`
- **Billing:** produto `remove_ads`, não-consumível, US$ 1,90 de referência.

> Durante o desenvolvimento, usar **sempre os IDs de teste do AdMob**
> (bloco público do Google: `ca-app-pub-3940256099942544/6300978111`). O App ID
> acima é sempre o de produção; só o bloco alterna. Clicar nos próprios
> anúncios de produção causa suspensão da conta.

> **Nota sobre o nome:** "Florest" não é a grafia inglesa de floresta
> ("forest"). Mantido conforme decisão do cliente. Vale checar disponibilidade
> do nome na Play Store antes da publicação.

---

## 8. Estrutura de pastas

```
FLORESTBOOK/
├── APK/                 Projeto Ionic/Angular + Capacitor (aplicativo)
├── DEPLOY/              Artefatos de publicação (.aab, termos, store assets)
├── DOC/                 Documentação (esta especificação, backlog, build)
└── PROJECT/
    ├── assets/          Imagens originais (fonte, nunca sobrescritas)
    └── sounds/          Áudios originais (fonte, nunca sobrescritos)
```

---

## 9. Escopo excluído desta versão

Registrado para evitar ambiguidade — não faz parte da primeira entrega:

- Renderização 3D em tempo real.
- Versão iOS (prevista, mas não nesta entrega — ver § 6.2).
- Variações de som por animal (mais de um som para o mesmo animal, alternando a
  cada toque).
- Animações avançadas por sprite (piscar, mexer orelha).
- Minigames, pontuação ou progressão.
- Backend, contas de usuário ou sincronização em nuvem.

---

## 10. Pendências

### Em aberto

| # | Pendência | Bloqueia | Seção |
|---|-----------|----------|-------|
| D | Licença da música de fundo | Publicação na loja | § 3.4 |
| H | Revisão nativa da separação silábica nos 6 idiomas | Conteúdo do i18n | § 4.2 |
| J | Validar `logo-simplificada.png` na safe zone de 66% | Build do ícone adaptativo | § 3.1 |
| K | Ouvir a música comprimida em aparelho real (origem 30.357 Hz) | Fechamento do áudio | § 3.4 |
| L | **Renomear `backgroung-natal.png` → `background-natal.png`** | Tema de Natal aparecer | § 3.1 |
| M | Nomes dos 5 temas traduzidos nos 6 idiomas | Rótulos do seletor | § 4.3 |

### Resolvidas

| # | Pendência | Resolução |
|---|-----------|-----------|
| A | `logo.png` sem canal alpha | ✅ Substituído por RGBA 1024×1024, mais `logo-simplificada.png` para ícones |
| B | `flaicon.ico` não embarcável no Android | ✅ Registrado — uso restrito a desktop/site |
| C | Escolher entre os dois sons de elefante | ✅ **`elefante02.mp3` descartado**; usar `elefante.mp3` |
| F | Duração real de `macaco.mp3` (VBR) | ✅ **4,00 s** (informado pelo cliente) |
| E | Criar IDs próprios no AdMob | ✅ **Entregues** em [admob.MD](admob.MD) — registrados em § 7 |
| G | Sons de 4 s excedem a faixa de 3 s | ✅ **Faixa passa a 4,5 s**, sem cortar os áudios |
| I | Entrega dos backgrounds temáticos | ✅ **Entregues** — Páscoa, Festa Junina, Halloween e Natal (§ 3.1) |
| — | Definir o eixo dos temas (ambiental ou sazonal) | ✅ Os 4 assets são de festa → **sazonal por data** |
| — | Música de fundo pesada (1.927 KB) | ✅ **Comprimida para 723 KB** (mono, 96 kbps) |

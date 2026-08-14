# Publicar o Florest Book na Play Console

Roteiro do que preencher, na ordem em que a Play Console pede. O que está
marcado com ⚠️ é onde a revisão costuma reprovar.

**Pacote:** `com.florestbook.app` · **Versão:** 1.3.0 (`versionCode` 5)
**Arquivo:** `DEPLOY/florestbook-release-v05.aab` (13,42 MB)

---

## 1. Antes de tudo: confirmar os links legais

A Play Console valida a URL da política de privacidade na submissão. Abra as
duas e confirme que carregam:

- https://bza.tec.br/florestbook-termos-de-uso
- https://bza.tec.br/florestbook-politica-privacidade

Estas são as URLs **oficiais desde 14/08/2026**, em domínio próprio, e são as
mesmas embutidas no app (`APK/src/app/core/legal.ts`). O conteúdo de origem
está em `DEPLOY/*.html` — publique esses arquivos nesses endereços.

> ⚠️ As URLs precisam bater **exatamente** com as do app: um link da ficha
> apontando para um endereço e o app abrindo outro é motivo de reprovação.

O GitHub Pages (`https://besaleel.github.io/florestbook/`) continua no ar como
espelho, servido por `docs/`, mas **não é mais o endereço oficial**.

---

## 2. Criar o app

| Campo | Valor |
|-------|-------|
| Nome | Florest Book |
| Idioma padrão | Português (Brasil) |
| Tipo | Aplicativo |
| Gratuito ou pago | **Gratuito** (a monetização é por anúncio e compra interna) |

> ⚠️ Um app criado como **gratuito nunca pode virar pago**. Como a receita vem
> de anúncio e da compra de remoção, gratuito é a escolha correta.

---

## 3. Ficha da loja

Textos prontos nos 6 idiomas em [store-listing.md](store-listing.md).

| Asset | Arquivo | Situação |
|-------|---------|----------|
| Ícone 512×512 | `store-assets/icon-512.png` | ✅ pronto, sem alpha |
| Feature graphic 1024×500 | `store-assets/feature-graphic.png` | ✅ pronto |
| Screenshots (mín. 2) | `store-assets/screenshot-*.png` | ✅ 5 prontas, 1080×1920 |

---

## 4. ⚠️ Política para Famílias

Esta é a seção que reprova apps infantis mal configurados.

### Público-alvo e conteúdo

| Pergunta | Resposta |
|----------|----------|
| Faixas etárias | **5 anos ou menos** e **6–8 anos** |
| O app é direcionado a crianças? | **Sim** |
| Apelo a crianças (arte, personagens) | Sim |

Marcar as duas faixas ativa o **programa Famílias** e exige que o app siga a
política — o que já foi implementado no código (anúncios não personalizados,
`tagForChildDirectedTreatment`, nenhuma coleta de dados).

### Anúncios

| Pergunta | Resposta |
|----------|----------|
| O app contém anúncios? | **Sim** |
| Rede de anúncios | Google AdMob |
| Anúncios personalizados para crianças? | **Não** |
| Formato | Banner |

> ⚠️ Declarar "não contém anúncios" é reprovação certa: o app exibe banner.

---

## 5. ⚠️ Segurança dos dados

O app **não coleta nada**. Responder assim:

| Pergunta | Resposta |
|----------|----------|
| O app coleta ou compartilha dados do usuário? | **Não** |
| Os dados são criptografados em trânsito? | *(não se aplica)* |
| O usuário pode pedir exclusão de dados? | *(não se aplica)* |

E marcar a exibição da mensagem **"Compromisso com a Política para Famílias do
Google Play"**.

> ⚠️ **A declaração precisa ser verdade.** O nome da criança fica só no
> aparelho (Capacitor Preferences) e nunca é transmitido — por isso "não
> coleta" está correto. Se um dia o app passar a enviar qualquer dado, esta
> resposta muda.

> O AdMob não conta como coleta a declarar aqui porque está configurado como
> não personalizado e dirigido a crianças, sem identificador de publicidade.

---

## 6. Classificação etária (IARC)

Questionário; responder **não** para tudo que for violência, sexo, drogas,
linguagem imprópria, jogos de azar e interação entre usuários.

| Pergunta | Resposta |
|----------|----------|
| Categoria | Aplicativo para crianças / Educação |
| Violência, medo, sexo, drogas, linguagem | **Não** para todas |
| Usuários interagem entre si? | **Não** |
| Compartilha localização? | **Não** |
| Permite compras? | **Sim** — remoção de anúncios |
| Exibe anúncios? | **Sim** |

Resultado esperado: **Livre / 3+**.

---

## 7. Produto de compra interna

Criar antes de publicar, para que o Play Billing (Fase 6) possa ser integrado
depois:

| Campo | Valor |
|-------|-------|
| ID do produto | `remove_ads` |
| Tipo | **Produto único, não consumível** |
| Nome | Remover anúncios |
| Descrição | Jogue sem anúncios, para sempre. |
| Preço | US$ 1,90 (o Google converte para as moedas locais) |

> O código ainda **não** integra o Play Billing — os itens 6.6–6.12 do backlog
> dependem deste produto existir. O botão "Remover Anúncio" já aparece na tela,
> mas ainda não abre o fluxo de compra.

---

## 8. Enviar o AAB

1. **Teste interno** (recomendado antes da produção aberta) › Criar versão
2. Enviar `DEPLOY/florestbook-release-v01.aab`
3. Notas da versão: `Primeira versão do Florest Book.`
4. Adicionar seu e-mail como testador e instalar pelo link

> ⚠️ **Ative o Play App Signing** quando solicitado. Sem ele, perder o
> `florestbook-release.jks` impede atualizar o app para sempre. Com ele, o
> Google guarda a chave final e o seu `.jks` vira chave de *upload*, que pode
> ser substituída em caso de perda.

---

## 9. Depois de aprovado no teste interno

- Conferir o banner de anúncio em aparelho real. **Em release ele é o bloco de
  produção** — não clique nele: o Google trata clique do próprio desenvolvedor
  como fraude e suspende a conta AdMob.
- Ouvir a música de fundo e confirmar o volume (backlog 1.11 e 5.11).
- Só então promover para produção aberta.

---

## Checklist final

- [ ] Os dois links legais em `bza.tec.br` abrem e batem com os do app
- [ ] Ficha preenchida nos 6 idiomas
- [ ] Ícone, feature graphic e screenshots enviados
- [ ] Público-alvo: 5 anos ou menos + 6–8 anos
- [ ] Anúncios declarados, **não personalizados**
- [ ] Segurança dos dados: **nenhum dado coletado**
- [ ] Mensagem "Compromisso com a Política para Famílias" marcada
- [ ] IARC respondido → Livre
- [ ] Produto `remove_ads` criado
- [ ] **Play App Signing ativado**
- [ ] AAB enviado ao teste interno
- [ ] Testado em aparelho real

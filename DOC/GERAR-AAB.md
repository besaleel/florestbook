# Como gerar o AAB de release (Florest Book)

Passo a passo para gerar o pacote `.aab` assinado, pronto para upload na Google
Play Console, e deixá-lo em `DEPLOY/`.

> Rode todos os comandos a partir da pasta `APK/` do projeto, exceto onde
> indicado.

---

## 1. Pré-requisitos (uma vez só)

- Node.js e npm instalados. *(verificado neste ambiente: Node v24.15.0)*
- JDK 17+ — o JDK embutido no Android Studio funciona:
  `C:\Program Files\Android\Android Studio\jbr` *(presente neste ambiente)*
- Android SDK instalado via Android Studio *(presente em
  `%LOCALAPPDATA%\Android\Sdk`)* e um arquivo `APK/android/local.properties`
  apontando para ele:
  ```properties
  sdk.dir=C:/Users/SEU_USUARIO/AppData/Local/Android/Sdk
  ```
  Use barras `/`, não `\`, senão o Gradle falha com `Invalid file path`.
  Esse arquivo é local e fica no `.gitignore`.

## 2. Criar o keystore de assinatura (uma vez só, e guardar para sempre)

O keystore é a identidade do app na Play Store. **Se ele for perdido, não é
possível publicar atualizações do `com.florestbook.app` — nunca.** Não existe
recuperação pelo Google.

> ⚠️ **O Florest Book precisa do seu próprio keystore.** Não reaproveite o
> keystore de outro aplicativo: cada `applicationId` tem a sua identidade de
> assinatura, e misturá-las cria uma dependência desnecessária entre projetos.

Gere-o com o `keytool` do JDK:

```powershell
Set-Item -Path Env:JAVA_HOME -Value "C:\Program Files\Android\Android Studio\jbr"
& "$Env:JAVA_HOME\bin\keytool.exe" -genkeypair -v `
  -keystore "C:\Sistemas\FLORESTBOOK\florestbook-release.jks" `
  -alias florestbook `
  -keyalg RSA -keysize 2048 -validity 10000
```

O comando pede, interativamente:

1. **Senha do keystore** (anote — é a `storePassword`).
2. Nome, organização, cidade, estado, código do país (ex.: `BR`).
   Podem ser dados pessoais/da empresa; não aparecem para o usuário final.
3. Confirmação (`sim`/`yes`).
4. **Senha da chave** — pressione Enter para usar a mesma do keystore
   (é o mais simples; então `keyPassword` = `storePassword`).

`-validity 10000` (~27 anos) é a recomendação do Google: a chave precisa
sobreviver a toda a vida do app.

> Este comando é **interativo** e precisa ser executado por você, num terminal
> onde dê para digitar as senhas. Não use um terminal não interativo.

### Conferir que o keystore foi criado

```powershell
& "$Env:JAVA_HOME\bin\keytool.exe" -list -v `
  -keystore "C:\Sistemas\FLORESTBOOK\florestbook-release.jks"
```

Deve listar uma entrada com o alias `florestbook`, o algoritmo `RSA` e a
validade até ~2053.

### Guardar o keystore com segurança

- **Não** versione o `.jks` no git (por isso o caminho acima está fora de
  `APK/`). Confirme que `*.jks` está no `.gitignore`.
- Faça backup em pelo menos **dois lugares** (ex.: cofre de senhas + drive
  privado), junto com as senhas e o alias.
- Registre o alias usado: `florestbook`.

> Recomendado ativar também o **Play App Signing** na Console. Nesse modelo o
> Google guarda a chave final de assinatura e o seu `.jks` passa a ser a chave
> de *upload* — se ela for perdida, dá para pedir substituição ao Google. Sem
> Play App Signing, a perda é definitiva.

## 3. Configurar as credenciais do keystore no projeto

Crie o arquivo `APK/android/keystore.properties` (também ignorado pelo git):

```properties
storeFile=C:/Sistemas/FLORESTBOOK/florestbook-release.jks
storePassword=SENHA_DO_KEYSTORE
keyAlias=florestbook
keyPassword=SENHA_DA_CHAVE
```

`storeFile` pode ser caminho absoluto (recomendado, mantendo o `.jks` fora do
repositório) ou relativo à pasta `APK/android`. Use barras `/`.

> Sem esse arquivo, o Gradle assina o release com a chave de **debug** — útil
> para testar o processo, mas esse AAB **não pode ser enviado à Play Store**.

`APK/android/app/build.gradle` precisa ler esse arquivo quando ele existir, e
avisar quando não existir. O bloco de assinatura fica assim:

```groovy
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
def hasKeystore = keystorePropertiesFile.exists()
if (hasKeystore) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
} else {
    println "AVISO: keystore.properties nao encontrado — o release sera " +
            "assinado com a chave de DEBUG e NAO pode ir para a Play Store."
}

android {
    signingConfigs {
        release {
            if (hasKeystore) {
                def caminho = keystoreProperties['storeFile']
                storeFile file(caminho.startsWith('/') || caminho.contains(':')
                        ? caminho
                        : "${rootDir}/${caminho}")
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            if (hasKeystore) {
                signingConfig signingConfigs.release
            }
        }
    }
}
```

Procure pela linha de `AVISO:` na saída do Gradle antes de subir qualquer
artefato.

## 4. Build de produção do Angular + sync Android

```powershell
Set-Location "C:\Sistemas\FLORESTBOOK\APK"
npm run assets
npm run icons
npm run build
npx cap sync android
```

Isso gera `APK/www` (build otimizado) e copia para
`APK/android/app/src/main/assets/public`.

> ### IDs do AdMob — produção em QUALQUER build nativo
>
> Desde 01/08/2026 (v03), o método `producao()` de
> `APK/src/app/core/services/ads.service.ts` retorna
> `Capacitor.isNativePlatform()`: **todo build instalado em aparelho (debug ou
> release) usa o bloco de produção**, para o teste no celular mostrar o banner
> real. O bloco de teste do Google fica reservado ao navegador (`ionic serve`).
>
> | Onde roda | Bloco usado | Clicar no anúncio |
> |-----------|-------------|-------------------|
> | Navegador (`ionic serve`) | teste (`…3940256099942544/6300978111`) | seguro |
> | Aparelho — **qualquer build** | **produção** (`…3480885465464323/8466632581`) | **NUNCA** |
>
> Para conferir num bundle já gerado — o código sai minificado, então procure
> em todos os chunks, não só no `main`:
> ```powershell
> Get-ChildItem APK\www -Recurse -Include *.js |
>   Select-String -Pattern "3480885465464323/8466632581" -SimpleMatch |
>   Select-Object -ExpandProperty Filename
> ```
>
> ⚠️ **Nunca clique nos próprios anúncios em aparelho — nem em build de
> debug.** O Google trata clique do desenvolvedor como fraude e suspende a
> conta AdMob. Ver o anúncio na tela é seguro; o clique não é.

## 5. Gerar o AAB assinado

```powershell
Set-Item -Path Env:JAVA_HOME -Value "C:\Program Files\Android\Android Studio\jbr"
Set-Item -Path Env:PATH -Value "$Env:JAVA_HOME\bin;$Env:PATH"
Set-Location "C:\Sistemas\FLORESTBOOK\APK\android"
.\gradlew bundleRelease
```

O arquivo assinado sai em:
```
APK\android\app\build\outputs\bundle\release\app-release.aab
```

### Conferir que não foi assinado com a chave de debug

Diferente do APK, o `.aab` **não guarda os arquivos de assinatura dentro do
zip** — por isso `keytool -printcert -jarfile` não retorna nada para bundles.
A verificação correta é observar a saída do Gradle:

- Se aparecer `AVISO: keystore.properties nao encontrado`, o bundle foi
  assinado com a chave de **debug** e será **rejeitado** pela Play Store.
- Sem esse aviso, o keystore de release foi usado.

Para inspecionar um **APK** (aí sim é possível):

```powershell
& "$Env:JAVA_HOME\bin\keytool.exe" -printcert -jarfile `
  "C:\Sistemas\FLORESTBOOK\APK\android\app\build\outputs\apk\release\app-release.apk"
```

## 6. Copiar para DEPLOY

```powershell
Copy-Item "C:\Sistemas\FLORESTBOOK\APK\android\app\build\outputs\bundle\release\app-release.aab" `
          "C:\Sistemas\FLORESTBOOK\DEPLOY\florestbook-release-v01.aab"
```

`DEPLOY/*.aab` fica no `.gitignore` — o binário permanece só local.

## 7. Antes de cada novo release

- **Suba a versão sempre que gerar um `.aab` que ainda não foi publicado** —
  `versionCode` e `versionName` em `APK/android/app/build.gradle`.
  `versionCode` é inteiro e deve **sempre aumentar**; `versionName` é o texto
  visível (ex.: `"1.0.0"`). O Google Play rejeita `versionCode` já usado.
- **Nome do arquivo em `DEPLOY/`:** padrão `florestbook-release-vNN.aab`
  (ex.: `-v02.aab`), incrementando a cada build.
- Repita os passos 4–6.
- Use **sempre o mesmo keystore** do passo 2 — nunca gere um novo para o
  `com.florestbook.app`.

### Histórico de releases

| Arquivo | versionCode | versionName | Observações |
|---------|-------------|-------------|-------------|
| `florestbook-release-v01.aab` | 1 | 1.0.0 | Primeiro release. 12,62 MB. Assinado com `florestbook-release.jks` (SHA-256 `12:4B:66:40:…:F7:31`, conferido contra o APK). R8 + `shrinkResources` ativos. AdMob no bloco de **produção**. |
| `florestbook-release-v02.aab` | 2 | 1.1.0 | 13,40 MB. **Google Play Billing** integrado (`@capgo/native-purchases`, Billing Library 8.3.0) — permissão `com.android.vending.BILLING` conferida no manifest mesclado; é o build que habilita cadastrar o produto `remove_ads` na Play Console. Tela inicial no padrão FarmBook, backgrounds novos + tema `thanksgiven`, correção do banner achatado em telas 16:9. Sem aviso de keystore no Gradle (chave de release). |
| `florestbook-release-v05.aab` | 5 | **1.3.0** | 13,42 MB. **É o build a subir na loja.** Banner de **divulgação cruzada do FarmBook** na tela inicial (rótulo "Publicidade" + barreira parental antes de sair do app), que **some com a compra `remove_ads`** — a tela inicial passou a chamar `billing.iniciar()` para cobrir a reinstalação. **URLs legais migradas para o domínio próprio** `bza.tec.br/florestbook-termos-de-uso` e `…-politica-privacidade`; conferido dentro do AAB que **não sobrou nenhuma referência ao GitHub Pages**. Termo de Uso e Política de Privacidade revisados para a Play Store. Assinado (`META-INF/FLORESTB.RSA`). |
| `florestbook-release-v04.aab` | 4 | 1.2.1 | 13,40 MB. Prévia de layout do espaço do anúncio desligada (`previaDeLayout = false`), para o espaço só aparecer com anúncio real. |
| `florestbook-release-v03.aab` | 3 | 1.2.0 | 13,40 MB. Tela da floresta no **padrão FarmBook**: cenário cobre a tela inteira (`cover` + caixa 2:3 sangrando nas bordas), rodapé sobreposto com faixa de sílabas, faixa escura "Remover Anúncio" + links legais e área do banner com fundo escurecido. **Dois controles de áudio separados** (🎵 música / 🔊 sons dos animais), persistidos de forma independente. AdMob passa a usar o **bloco de produção em qualquer build nativo** (nunca clicar no anúncio no aparelho). Sem aviso de keystore no Gradle (chave de release). |

---

## Checklist rápido (releases seguintes, keystore já existe)

```powershell
Set-Location "C:\Sistemas\FLORESTBOOK\APK"
npm run build
npx cap sync android

Set-Item -Path Env:JAVA_HOME -Value "C:\Program Files\Android\Android Studio\jbr"
Set-Item -Path Env:PATH -Value "$Env:JAVA_HOME\bin;$Env:PATH"
Set-Location "C:\Sistemas\FLORESTBOOK\APK\android"
.\gradlew bundleRelease

Copy-Item "app\build\outputs\bundle\release\app-release.aab" `
          "C:\Sistemas\FLORESTBOOK\DEPLOY\florestbook-release-vNN.aab"
```

## Assets de loja

A gerar em `DEPLOY/` (fora do repositório público) — ver Backlog, Fase 7:

- [ ] Ícone 512×512 **sem alpha** → `DEPLOY/store-assets/icon-512.png`
      (derivado de `logo-simplificada.png`)
- [ ] Feature graphic 1024×500 → `DEPLOY/store-assets/feature-graphic.png`
- [ ] Screenshots do celular (mínimo 2, recomendado 4) →
      `DEPLOY/store-assets/screenshot-*.png`
- [ ] Termo de uso e política de privacidade → `DEPLOY/termos-de-uso.html`,
      `DEPLOY/politica-privacidade.html`
- [ ] Texto da ficha da loja nos 6 idiomas → `DEPLOY/store-listing.md`

## Dados fixos do aplicativo

Referência rápida (fonte: [ESPECIFICATION.md](ESPECIFICATION.md) § 7):

| Item | Valor |
|------|-------|
| Pacote | `com.florestbook.app` |
| Nome de exibição | Florest Book |
| Keystore | `florestbook-release.jks`, alias `florestbook` |
| AdMob — App ID | `ca-app-pub-3480885465464323~9513221026` |
| AdMob — bloco (produção) | `ca-app-pub-3480885465464323/8466632581` |
| AdMob — bloco (teste) | `ca-app-pub-3940256099942544/6300978111` |
| Billing | `remove_ads`, não-consumível |

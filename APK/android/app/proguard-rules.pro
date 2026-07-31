# Regras do R8 para o Florest Book.
#
# O Capacitor liga JavaScript e Java por REFLEXAO: o WebView chama metodos
# anotados com @PluginMethod pelo nome, em tempo de execucao. O R8 nao ve
# essas chamadas e removeria ou renomearia tudo, quebrando os plugins em
# silencio — o app compila, instala e falha so ao tocar um botao.
#
# Por isso as regras abaixo nao sao opcionais quando `minifyEnabled true`.

# --- Capacitor: nucleo e plugins ---
-keep public class com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public <methods>;
    @com.getcapacitor.annotation.CapacitorPlugin <fields>;
}
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep @com.getcapacitor.NativePlugin class * { *; }

# Plugins usados por este app (ads, browser, preferences, app, keyboard...).
-keep class com.capacitorjs.plugins.** { *; }
-keep class com.getcapacitor.community.admob.** { *; }

# --- Interface JavaScript do WebView ---
# Sem isto, `window.Capacitor` perde os metodos expostos ao JS.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- Google Mobile Ads (AdMob) ---
# O SDK carrega classes por nome; o proprio Google recomenda preserva-las.
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.internal.ads.** { *; }
-dontwarn com.google.android.gms.**

# --- Anotacoes e assinaturas usadas por reflexao ---
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod

# --- Rastreabilidade de falhas ---
# Mantem numero de linha nas stack traces, escondendo o nome do arquivo.
# Sem isto, um relatorio de erro da Play Console vem ilegivel.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

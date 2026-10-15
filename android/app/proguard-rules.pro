# ProGuard / R8 Rules for Stay Q Release Build

# Suppress all optional dependency missing class warnings
-dontwarn **
-ignorewarnings

# Google ML Kit Text Recognition
-keep class com.google.mlkit.vision.text.** { *; }
-keep class com.google_mlkit_text_recognition.** { *; }

# Google Play Core & Deferred Components
-keep class com.google.android.play.core.** { *; }

# Flutter Engine & Plugins
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-keep class io.flutter.plugin.common.** { *; }

# Firebase & Google Play Services
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

# Cashfree PG SDK
-keep class com.cashfree.** { *; }
-dontwarn com.cashfree.**
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.cashfree.pg.** { *; }
-keep class com.cashfree.pg.core.** { *; }
-keep class com.cashfree.pg.ui.** { *; }


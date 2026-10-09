#!/data/data/com.termux/files/usr/bin/bash
set -eu

GRADLE_USER_HOME="${GRADLE_USER_HOME:-$HOME/.gradle}"
GRADLE_PROPERTIES="$GRADLE_USER_HOME/gradle.properties"
AAPT2="$PREFIX/bin/aapt2"
JAVA_HOME_TERMUX="$PREFIX/lib/jvm/java-21-openjdk"

mkdir -p "$GRADLE_USER_HOME"
touch "$GRADLE_PROPERTIES"

# Rimuove solo le precedenti copie di queste proprietà per evitare duplicati.
sed -i '/^android\.aapt2FromMavenOverride=/d' "$GRADLE_PROPERTIES"
sed -i '/^org\.gradle\.java\.home=/d' "$GRADLE_PROPERTIES"
sed -i '/^org\.gradle\.java\.installations\.auto-detect=/d' "$GRADLE_PROPERTIES"

if [ ! -x "$AAPT2" ]; then
  echo "ERRORE: aapt2 non trovato in $AAPT2"
  exit 1
fi

if [ ! -d "$JAVA_HOME_TERMUX" ]; then
  echo "ERRORE: Java 21 non trovato in $JAVA_HOME_TERMUX"
  exit 1
fi

{
  echo "android.aapt2FromMavenOverride=$AAPT2"
  echo "org.gradle.java.home=$JAVA_HOME_TERMUX"
  echo "org.gradle.java.installations.auto-detect=false"
} >> "$GRADLE_PROPERTIES"

echo "Configurazione Gradle locale Termux completata."
echo "File aggiornato: $GRADLE_PROPERTIES"

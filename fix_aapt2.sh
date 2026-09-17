cd ~/inventario

# Troviamo e rimuoviamo l'aapt2 corrotto dalla cache di gradle per forzarne il rimpiazzo o evitiamo il crash
find ~/.gradle/caches/ -name "aapt2" -type d -exec rm -rf {} + 2>/dev/null

# Forza l'uso di una versione precedente di buildToolsVersion nel progetto Android se necessario, 
# oppure inseriamo una regola per il fix nel file build.gradle principale di android
BUILD_GRADLE="android/build.gradle"
if [ -f "$BUILD_GRADLE" ]; then
  echo "Verifica build.gradle..."
fi

cd android
./gradlew clean assembleDebug

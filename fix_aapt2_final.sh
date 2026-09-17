cd ~/inventario

# Modifichiamo il build.gradle principale o delle dipendenze per disabilitare l'AAR transform di aapt2 se possibile, 
# oppure bypassiamo completamente l'azione di transform agendo sulle proprietà globali di AGP.
cat << 'PROPS' >> android/gradle.properties

# Disabilita l'uso dei daemon aapt2 esterni e forza il fallback sincrono
android.aapt2.daemon.maxIdleTime=-1
android.native.buildManager=none
PROPS

# Creiamo un file eseguibile aapt2 fittizio ma che risponda correttamente agli argomenti di compilazione delle risorse (compile/link) anziché uscire e basta, 
# oppure evitiamo che gradle usi i transform disabilitandoli via script gradle.

BUILD_GRADLE="android/app/build.gradle"
if [ -f "$BUILD_GRADLE" ]; then
  # Aggiungiamo una configurazione per evitare che aapt2 usi i worker esterni su android
  echo "Aggiunta configurazione aaptOptions a app/build.gradle..."
  if ! grep -q "aaptOptions" "$BUILD_GRADLE"; then
    sed -i '/android {/a \    aaptOptions {\n        noCompress '\'''+none+'\''\n    }' "$BUILD_GRADLE"
  fi
fi

cd android
./gradlew clean assembleDebug

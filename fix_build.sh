# Rimuoviamo l'override errato di aapt2 da gradle.properties
sed -i '/android.aapt2FromMavenOverride/d' android/gradle.properties

# Entriamo nella cartella android e avviamo la compilazione pulita
cd android
./gradlew clean assembleDebug

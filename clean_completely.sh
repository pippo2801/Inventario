cd ~/inventario

# Ripuliamo le ultime righe aggiunte a gradle.properties se non servono
sed -i '/android.useNewApk-in-bundle/d' android/gradle.properties
sed -i '/android.nonTransitiveRClass/d' android/gradle.properties

# Rimuoviamo TUTTA la cache di gradle locale per eliminare file corrotti e blocchi
rm -rf ~/.gradle/caches/
rm -rf ~/.gradle/daemon/

echo "Cache pulita con successo!"

cd android
./gradlew clean assembleDebug

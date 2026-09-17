cd ~/inventario

# 1. Rimuoviamo i wrapper precedenti che davano errore di sintassi
find ~/.gradle/caches/ -name "aapt2" -type f -exec rm -f {} +

# 2. Forziamo Gradle a usare aapt2 in modalità standalone o evitiamo il transform pulendo i transform corrotti
rm -rf ~/.gradle/caches/8.14.3/transforms/

# 3. Creiamo uno script pulito per rigenerare il progetto ed evitare il blocco del demone
cd android
./gradlew clean assembleDebug --refresh-dependencies

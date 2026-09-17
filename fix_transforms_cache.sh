cd ~/inventario

# Rimuoviamo i file di blocco e la cache corrotta dei transform
rm -rf ~/.gradle/caches/8.14.3/transforms/
rm -rf ~/.gradle/caches/transforms-3/
rm -rf ~/.gradle/caches/transforms-4/

echo "Cache dei transform ripulita con successo."

cd android
./gradlew clean assembleDebug

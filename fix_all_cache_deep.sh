cd ~/inventario

# 1. Fermiamo eventuali demoni Gradle attivi che tengono aperti i file lockati
cd android
./gradlew --stop
cd ..

# 2. Cancelliamo completamente la cartella caches per rimuovere ogni traccia di file binari corrotti
rm -rf ~/.gradle/caches/

echo "Cache globale di Gradle completamente eliminata."

# 3. Entriamo nella cartella android e rieseguiamo la build rigenerando tutto da zero
cd android
./gradlew clean assembleDebug

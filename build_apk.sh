# Rimuoviamo il pacchetto assets che fallisce su Termux
npm uninstall @capacitor/assets

# Eseguiamo la build web
npm run build

# Sincronizziamo con Capacitor
npx cap sync android

# Entriamo in android e compiliamo forzando la compatibilità Java se necessario
cd android
./gradlew clean assembleDebug
echo "Build terminata!"

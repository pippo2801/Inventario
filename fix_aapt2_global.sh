cd ~/inventario

# Modifichiamo il gradle.properties globale del progetto per forzare l'uso di aapt2 in modalità compatibile o disabilitare i transform se possibile, 
# oppure impostiamo una proprietà gradle per evitare che aapt2 usi i daemon binari esterni.
cat << 'PROPS' >> android/gradle.properties

# Disabilita l'ottimizzazione dei transform aapt2 paralleli che causano il fallimento dei demoni su Termux
android.useNewApk-in-bundle=false
android.nonTransitiveRClass=true
PROPS

# Svuotiamo e rimuoviamo completamente la cache dei transform affinché Gradle rigeneri i file senza richiamare aapt2 esterno dove possibile, 
# o puntiamo a un file eseguibile vuoto ma valido se intercettato.
find ~/.gradle/caches/ -type d -name "transforms" -exec rm -rf {} + 2>/dev/null

cd android
./gradlew clean assembleDebug

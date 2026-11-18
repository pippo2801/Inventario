# Studio Ottico Di Pietro

Gestionale per l'ottica, attualmente in preparazione per l'utilizzo **su un solo smartphone Android**.

## Modalità attuale: locale e dispositivo singolo

- I dati di inventario, clienti, prescrizioni, vendite, categorie, notifiche e impostazioni vengono salvati localmente nell'archivio dell'app.
- Non è attiva la sincronizzazione cloud né la condivisione automatica con altri telefoni.
- Non è previsto un accesso online Firebase: i profili presenti sono profili locali, non account autenticati.
- Il backup è manuale: da Impostazioni si esporta un file JSON e lo si conserva in una posizione protetta. Il ripristino è disponibile dalla stessa schermata.
- Il backup contiene anche dati personali e sanitari: non inviarlo a terzi e proteggere il dispositivo con blocco schermo.

**Nota sulla protezione dei dati:** l'app usa lo storage privato del dispositivo tramite WebView/localStorage. Non è ancora stata implementata una cifratura applicativa dedicata né un sistema di autenticazione forte. Prima di usare l'app come archivio operativo di dati reali dei clienti è necessaria una verifica specifica della protezione dei dati sul dispositivo.

## Funzioni presenti nel progetto

- Inventario occhiali, schede prodotto, posizioni fisiche e vetrina.
- Clienti e codice fiscale.
- Vendite, storico, ripristino dello stock e statistiche.
- Prescrizioni con parametri OD/OS, PD e altezza di montaggio.
- Notifiche, categorie, registro modifiche e cestino.
- Ricerca testuale locale con interpretazione euristica.
- Backup e ripristino JSON.

La presenza di una funzione nel codice non equivale a una verifica completa sul telefono: fotocamera, salvataggio persistente e flussi operativi devono ancora essere provati sul dispositivo reale.

## Funzioni IA: limiti dichiarati

- **OCR tessera sanitaria/codice fiscale:** usa ML Kit nativo su Android; la lettura va verificata sul dispositivo e i dati estratti devono essere controllati dall'operatore.
- **OCR prescrizione:** al momento non è disponibile in modalità locale; inserire i valori manualmente e verificarli sulla ricetta originale.
- **Analisi foto con IA:** richiede un servizio IA raggiungibile e configurato; l'app Android locale non deve mostrare risultati simulati.
- **Ricerca video:** disattivata finché non sarà implementata l'estrazione reale dei fotogrammi.
- In assenza di un servizio, l'app deve mostrare un errore esplicito e non inventare dati clinici o caratteristiche del prodotto.

## Stack

- React 19, TypeScript, Tailwind CSS
- Vite
- Capacitor 8 per Android
- ML Kit Text Recognition per OCR locale
- Node.js / Express per le API di sviluppo e le funzionalità server

## Sviluppo e build

Requisiti: Node.js compatibile con le versioni dichiarate nel progetto, npm e JDK 21 per Android.

```bash
npm ci
npm run lint
npm test
npm run build
```

Per sincronizzare e compilare Android:

```bash
npx cap sync android
cd android
./gradlew assembleDebug
```

L'APK di debug viene generato in:

`android/app/build/outputs/apk/debug/app-debug.apk`

## Stato di verifica

- CI: lint, test unitari, regole Firestore e build vengono eseguiti tramite GitHub Actions.
- Build verde non significa collaudo su smartphone.
- Restano obbligatori i test sul dispositivo Android: avvio, riapertura e persistenza dei dati, fotocamera/ML Kit, backup e ripristino, vendita e ripristino prodotto.
- Non effettuare merge su `main` finché l'audit e i test sul telefono non sono completati.

---

Progetto: `pippo2801/Inventario`
Branch di lavoro: `audit/complete-project-fixes`


## Supporto iPhone / iOS

Il progetto usa React + Capacitor e può essere compilato anche per iOS. Il supporto iOS è in preparazione e **non è ancora una versione pronta per l'uso operativo**.

Prerequisiti: macOS, Xcode aggiornato, Node.js e CocoaPods (normalmente gestito dagli strumenti Xcode). Da macOS:

```bash
npm ci
npm install --no-save --package-lock=false @capacitor/ios@^8.5.2
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

Per creare un build simulatore senza firma:

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug -derivedDataPath build/ios CODE_SIGNING_ALLOWED=NO build
```

La build per simulatore non è installabile su un iPhone reale. Per distribuire su iPhone serve una build firmata con un certificato/profilo Apple Developer e, per App Store/TestFlight, un account Apple Developer. Non sono incluse credenziali o certificati nel repository.

### Verifiche iOS ancora necessarie

- Permessi fotocamera e libreria foto e flusso di acquisizione.
- OCR: la lettura tessera sanitaria attualmente documentata usa ML Kit nativo Android; su iOS va implementata/verificata una soluzione compatibile (non considerare disponibile l'OCR iOS finché non è collaudato).
- Backup/ripristino e condivisione file tramite iOS Files/Share Sheet.
- Persistenza localStorage nella WKWebView, gestione sospensione/ripresa e rotazione.
- Layout con safe area/notch e tastiera.
- Test su iPhone reale prima di usare dati reali.

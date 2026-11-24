# Piano tecnico: Android + iPhone con archivio sincronizzato

## Obiettivo
Un solo gestionale Studio Ottico Di Pietro, con due app native basate sullo stesso progetto React/Capacitor:
- Android (telefono Android principale)
- iOS (iPhone 18 Pro)

Entrambi i dispositivi accedono allo stesso archivio dello Studio tramite un'identità autenticata. I dati devono restare disponibili offline e sincronizzarsi quando la connessione torna disponibile.

## Stato verificato nel codice
- Il database applicativo attuale è basato su localStorage.
- `src/services/firebase.ts` esporta attualmente `dbFirestore = null`: Firebase è disattivato.
- Sono presenti dipendenza Firebase e regole Firestore, ma la presenza delle regole nel repository non significa che siano pubblicate o che l'app le stia usando.
- Le regole Firestore richiedono documenti utente e organizationId coerenti; il modello locale attuale non dimostra ancora un flusso di autenticazione cloud completo.
- La sincronizzazione non è quindi implementata né verificata tra dispositivi.

## Architettura richiesta
1. **Identità e accesso**
   - Firebase Authentication (o provider equivalente) con account individuali autorizzati.
   - Stesso account dello Studio sui due telefoni, con sessione separata per dispositivo.
   - Ruoli e appartenenza allo Studio assegnati dal backend, mai scelti liberamente dal client.
   - Possibilità di revocare un dispositivo o una sessione.

2. **Archivio centrale**
   - Firestore per organizzazione, prodotti, clienti, prescrizioni, vendite, impostazioni e notifiche.
   - Ogni documento appartiene a un organizationId verificato.
   - Regole di accesso testate con emulatori e utenti di ruoli diversi.
   - Non usare account condivisi senza identità di dispositivo/audit: le operazioni devono poter essere attribuite.

3. **Offline-first**
   - Cache locale e coda di operazioni pendenti.
   - Ogni modifica ha ID stabile, autore, deviceId, timestamp server/client e versione.
   - Retry idempotenti: la stessa operazione non deve creare due vendite o due clienti.
   - Stato visibile: sincronizzato, in attesa, errore.
   - Le operazioni finanziarie e di magazzino devono essere transazionali o gestite con backend affidabile.

4. **Conflitti**
   - Non affidarsi soltanto all'orario del telefono.
   - Modifiche concorrenti a cliente/prodotto: rilevare la versione modificata e chiedere/gestire la risoluzione, senza sovrascrittura silenziosa.
   - Vendite: creare record immutabili con ID univoco e aggiornare la disponibilità in transazione.
   - Cancellazioni: tombstone/versione per propagare l'eliminazione anche all'altro dispositivo.

5. **Protezione dei dati**
   - HTTPS/TLS in transito, regole Firestore con minimo privilegio e autenticazione obbligatoria.
   - Valutare cifratura locale dei dati sensibili e gestione sicura delle chiavi.
   - Backup protetti, retention e procedure di ripristino.
   - Audit log non modificabile dal client.
   - Verifica privacy/GDPR prima dell'uso con dati reali di clienti e prescrizioni.

## Piano di implementazione e collaudo
- Fase A: definire schema cloud e migrazione controllata dei dati locali esistenti.
- Fase B: autenticazione, ruoli, associazione dispositivi e regole Firestore.
- Fase C: sincronizzazione prodotti/clienti e test offline/online.
- Fase D: prescrizioni, vendite, annullamenti e transazioni senza duplicati.
- Fase E: backup/ripristino, revoca dispositivi, test di sicurezza.
- Fase F: build Android e iOS, test su entrambi i dispositivi reali.

## Criteri di accettazione
- Un prodotto inserito su Android appare su iPhone e viceversa.
- Una modifica concorrente non cancella dati senza avviso.
- Una vendita offline viene sincronizzata una sola volta.
- Riavvio/aggiornamento app non perde la coda pendente.
- Un utente non autorizzato non può leggere dati di un'altra organizzazione.
- Revocare un dispositivo impedisce ulteriori accessi.
- Backup e ripristino sono verificati su entrambi i sistemi.

## Limiti e prerequisiti
- Non dichiarare la sincronizzazione attiva finché Firebase non è configurato, le regole non sono pubblicate e i test end-to-end non sono verdi.
- La build iOS richiede macOS/Xcode; installazione su iPhone reale e distribuzione richiedono firma Apple appropriata.
- La build di simulatore non dimostra il funzionamento su iPhone reale.
- Nessuna credenziale, chiave privata o certificato deve essere salvato nel repository.

## Avanzamento verifiche iPhone (18 novembre 2026)

- Branch di lavoro: `ios/iphone-support`.
- Il branch iOS include integralmente il branch `audit/complete-project-fixes` alla baseline `701885cb41653d006210533609dbcdf970aef9da`; le 14 commit iOS risultano in avanti e zero indietro rispetto a tale baseline.
- Il workflow `.github/workflows/build-ios.yml` compila il target simulatore e ora esegue anche una compilazione non firmata per `generic/platform=iOS`, così da controllare la compilazione per il target dispositivo.
- La compilazione non firmata non produce un'app installabile su iPhone e non sostituisce firma Apple, installazione e collaudo su iPhone 18 Pro.
- Non sono ancora certificati sul dispositivo reale fotocamera, OCR Apple Vision, selezione/condivisione file, persistenza, notifiche, sospensione/ripresa e layout safe-area/tastiera.
- Firebase e sincronizzazione tra dispositivi restano disattivati/non verificati: non dichiararli disponibili.

## Audit tecnico approfondito - 24 novembre 2026

### Verifiche CI
- Pipeline principale sul commit `4d144dd2dc24831225f9d2bd9b4124c51ad95908`: Firestore Rules Tests, Unit Tests, Lint & TypeScript, Build Web Assets e Build Android APK completati con esito positivo.
- Workflow iOS `45386361726`: completato con esito positivo per simulatore e compilazione non firmata del target iOS.
- Questi risultati attestano la compilazione e i test automatizzati, non l'attivazione di Firebase, la sincronizzazione reale o il funzionamento su dispositivi fisici.

### Disallineamenti bloccanti per Firebase
- `src/services/firebase.ts` esporta ancora `dbFirestore = null`; il backup contiene solo configurazione segnaposto e non deve essere ripristinato.
- Il file `android/app/google-services.json.firebase-incompleto` appartiene al progetto Firebase `inventario-studio`, ma registra il package Android `com.example.react_example`. Il package effettivo in `capacitor.config.ts` è `com.studiodipietro.inventario`. Non rinominare il package né usare il file attuale come configurazione valida: serve registrare/verificare l'app Android corretta nel progetto Firebase esistente.
- `src/types.ts` non include `organizationId` nei modelli principali (Organization, User, Eyeglass, Client, Prescription, Sale). Le regole Firestore richiedono invece `organizationId` per autorizzare letture e scritture sulle collezioni dati. Il modello locale e il modello cloud non sono quindi allineati.
- Il modello User locale usa un ID applicativo e non dimostra il collegamento a Firebase Auth UID. Non esiste nel codice esaminato un servizio di autenticazione cloud o una procedura di provisioning iniziale.
- Le regole consentono la creazione di documenti `users` solo a un admin già autenticato e presente nella collezione `users`: il bootstrap del primo amministratore deve essere gestito da una procedura backend fidata, non dal client.
- `src/services/db.ts` continua a usare localStorage e dichiara esplicitamente la sincronizzazione disattivata. Le notifiche sono locali e non raggiungono l'altro dispositivo.

### Sicurezza API server
- Le route `/api/ai/*` in `server.ts` non mostrano middleware di autenticazione/autorizzazione o rate limiting. Non esporre questo server a Internet con dati reali prima di introdurre controlli server-side, limiti di dimensione e frequenza, validazione dei payload e protezione dei log.
- L'endpoint health espone solo la presenza booleana della chiave IA; mantenerlo privo di segreti e dati personali.
- Le route OCR elaborano codice fiscale e prescrizioni: le richieste devono essere autorizzate e i dati non devono finire nei log.

### Vendite e consistenza multi-dispositivo
- La vendita attuale viene salvata localmente con due scritture localStorage e rollback best-effort. Non è una transazione atomica distribuita.
- L'ID vendita usa timestamp e componente casuale locale; non esiste ancora una chiave di idempotenza persistente condivisa tra dispositivi.
- La sincronizzazione non deve limitarsi a copiare gli array localStorage su Firestore: prima occorrono schema cloud versionato, migrazione con anteprima e backup, operazioni idempotenti, transazioni per vendita/stock e gestione esplicita dei conflitti.

### Ordine di lavoro obbligatorio
1. Definire schema cloud e mapping esplicito tra ID locali e Firebase Auth UID / organizationId.
2. Progettare bootstrap amministratore e inviti utenti con backend fidato; mai assegnare ruoli dal client.
3. Correggere e testare le regole con query reali, inclusi isolamento organizzazioni e bootstrap.
4. Aggiungere autenticazione e protezione delle API IA.
5. Implementare migrazione locale -> cloud con anteprima, backup verificato e rollback.
6. Implementare sincronizzazione offline, idempotenza vendite e risoluzione conflitti.
7. Collaudare su Android e iPhone fisici prima di dichiarare la sincronizzazione disponibile.

Nessuna credenziale è stata aggiunta o modificata e Firebase resta disattivato.

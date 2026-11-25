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

### Ulteriori verifiche sul database locale e sulle vendite
- Il costruttore di `DatabaseService` carica dati e utente corrente da `localStorage`; in assenza di dati salva i dataset dimostrativi iniziali. Questo è un comportamento demo, non un'identità autenticata.
- `setCurrentUser(userId)` cambia l'operatore locale selezionando un elemento dell'array utenti e salva la scelta in `localStorage`. Non è un login e non prova l'identità della persona. Il campo ruolo non deve essere usato come autorizzazione di sicurezza.
- `getSettings()` forza sempre `sync.enabled: false`, anche se il valore salvato è true. La UI e il codice confermano quindi che il toggle non può attivare una sincronizzazione reale.
- Il metodo `executeFastSale` crea ID e numero vendita sul dispositivo usando timestamp/contatore locale, quindi aggiorna prodotto e vendita in due persistenze locali separate. Due dispositivi offline potrebbero generare numeri/operazioni concorrenti; questa implementazione non può essere riutilizzata come transazione cloud.
- I log audit e le notifiche sono memorizzati in locale; il fatto che vengano creati quando cambia un prodotto non significa che siano recapitati all'altro telefono.
- Il componente Header visualizza correttamente lo stato “Locale” e il tooltip dichiara che i dati restano sul dispositivo: mantenere questa trasparenza fino al collaudo end-to-end.

### Decisione architetturale
- Non attivare un semplice “sync toggle” né copiare direttamente gli array locali su Firestore.
- Prima versione cloud: account individuali Firebase Auth, appartenenza allo Studio assegnata da backend, cache locale con coda operazioni persistente e ID operazione idempotente.
- Per le vendite, usare una Cloud Function o una transazione Firestore server-side che verifichi disponibilità e prezzo, crei una sola vendita e aggiorni lo stock atomicamente. L'operatore non deve poter cambiare il ruolo o l'organizzazione tramite payload client.
- Il provisioning iniziale dell'organizzazione e del primo amministratore deve essere eseguito da procedura amministrativa/backend protetta, non da un client anonimo.
- Prima della migrazione: esportazione cifrata, verifica integrità, conteggio record per collezione e anteprima delle differenze; nessuna sovrascrittura automatica e nessuna cancellazione dell'archivio locale finché il confronto non è verificato.

## Proposta schema cloud v1 (24 novembre 2026)

Questa sezione è una specifica preparatoria: non abilita Firebase e non modifica i dati. Le collezioni attuali restano flat per compatibilità con le Security Rules già presenti; ogni documento aziendale deve avere `organizationId` obbligatorio. Gli ID locali come `OPT-001` non sono ID cloud globali: salvare `legacyId` e assegnare al documento cloud un ID univoco generato, mantenendo un indice di migrazione per organizzazione.

### Identità e appartenenza
- Firebase Authentication identifica la persona tramite UID; il documento `users/{uid}` è il profilo applicativo autorevole.
- Campi profilo minimi: `uid`, `organizationId`, `role`, `displayName`, `email`, `active`, `createdAt`, `updatedAt`, `schemaVersion`.
- Il client può aggiornare solo campi profilo non privilegiati; `organizationId`, `role` e `active` sono assegnati dal backend.
- Non collegare automaticamente un account a uno studio basandosi solo sull'email, né importare ruoli dal vecchio array locale.
- Il primo studio e il primo amministratore si creano con una procedura di provisioning autenticata e amministrativa, usando Admin SDK fuori dal client. Gli inviti successivi hanno token monouso, scadenza e ruolo assegnato dal backend.

### Record aziendali
| Collezione | Identificativo e campi aggiuntivi richiesti |
| --- | --- |
| organizations | ID cloud dello studio; dati anagrafici; `schemaVersion`, `createdAt`, `updatedAt` |
| eyeglasses | `organizationId`, `legacyId`, `createdByUid`, `updatedByUid`, `version`, `createdAt`, `updatedAt`, `deletedAt` |
| clients | stessi campi tenant/audit; codice fiscale trattato come dato personale ad accesso ristretto |
| prescriptions | stessi campi tenant/audit; immagini in Storage privato, mai URL pubblici permanenti |
| sales | `organizationId`, `legacyId`, `operationId`, `operatorUid`, `createdAt`, `deletedAt`; documento immutabile salvo flusso amministrativo di storno |
| auditLogs | `organizationId`, `actorUid`, timestamp server, azione e riferimento record; sola scrittura backend |
| customCategories/settings/syncStatus | `organizationId`, `updatedAt`, `updatedByUid`; validazione e permessi per ruolo |

Tutti i timestamp canonici cloud devono essere Firestore Timestamp/server timestamp; l'app può convertirli in ISO string nel livello repository per non riscrivere subito tutte le viste. Il campo `version` serve per rilevare modifiche concorrenti, non per risolverle sovrascrivendo automaticamente.

### Migrazione locale -> cloud
1. Verificare autenticazione e appartenenza allo studio.
2. Creare snapshot cifrato e manifest con conteggi per collezione.
3. Mappare ogni ID locale con coppia `organizationId + legacyId`; segnalare duplicati SKU, riferimenti orfani e record incompleti.
4. Mostrare anteprima importazione e conflitti; non scegliere automaticamente quale dato prevale.
5. Importare in batch idempotenti con stato di avanzamento persistente e log tecnico senza dati personali.
6. Rileggere i dati cloud, confrontare conteggi e hash normalizzati; solo dopo dichiarare migrazione verificata.
7. Conservare intatto il database locale e il backup finché l'utente non conferma la verifica.

### Vendita atomica
La vendita deve passare da un endpoint backend autenticato. Il backend verifica membership/ruolo, disponibilità del prodotto, prezzo e sconto; usa `operationId` generato dal client e univoco per organizzazione per rendere i retry idempotenti; crea vendita, marca il prodotto venduto e registra audit nello stesso flusso transazionale. Se il prodotto è già venduto o l'operazione è stata già elaborata, restituisce esito deterministico senza creare una seconda vendita. Le vendite non si cancellano fisicamente: annullamento e reso sono eventi/storni espliciti.

### Query e regole
- Ogni query alle collezioni tenant deve includere filtro `organizationId == membership.organizationId`; le Rules non filtrano i risultati, li autorizzano o negano.
- I test esistenti preparano utenti e record con Rules disabilitate: verificano le regole di accesso, ma non il bootstrap amministrativo né il flusso reale di provisioning.
- Prima di riattivare Firebase aggiungere test per query multi-tenant, campi obbligatori, cambio ruolo/org, utenti disattivati, inviti scaduti, ID duplicati, retry vendita e transazioni concorrenti.
- La specifica non autorizza ancora l'aggiunta di `organizationId` ai tipi TypeScript: prima occorre implementare adapter e migrazione compatibili con i backup legacy, quindi testare i vecchi dati.

### Ordine implementativo autorizzato
1. Definire adapter/mapping e test puri senza rete.
2. Implementare provisioning backend e test emulator, senza segreti nel repository.
3. Integrare Firebase Auth mantenendo una modalità demo esplicita e non confondibile con login reale.
4. Integrare lettura cloud in ambiente di test, poi migrazione preview/import.
5. Integrare scritture e vendita atomica solo dopo test di concorrenza e regole.
6. Test Android e iOS su dispositivi reali prima di dichiarare supporto completo.


## Verifiche migrazione e identità - 25 novembre 2026

- Il preparatore locale `migrationAdapter.ts` verifica campi obbligatori, tipi, campi testuali essenziali, date analizzabili (con controllo calendario rigoroso per date ISO), versioni positive intere, valori ammessi per genere/stato/metodo di pagamento, asse ottico (0–180), PD positivo, prezzi non negativi e coerenza aritmetica delle vendite.
- I controlli ottici restano volutamente limitati a vincoli oggettivi già presenti nell'interfaccia: non vengono imposti limiti clinici inventati a sfera/cilindro/addizione. I record incompleti ammessi dal modello (ad esempio cliente senza codice fiscale/telefono e prodotto senza foto) non vengono scartati per quei soli campi.
- I record che non superano i controlli non entrano nell'elenco dei record preparati; conteggi e diagnostica mantengono visibili gli elementi sorgente rifiutati. La verifica è pura e non scrive su Firebase.
- La preview non autorizza l'importazione: resta necessaria una revisione umana dei record segnalati e dei casi semanticamente ambigui.
- Confermato il disallineamento identità: `initialData.ts` crea un profilo locale `user-1`, mentre `db.setCurrentUser()` seleziona un profilo locale e `createdBy/updatedBy/operatorId` sono valorizzati con identificativi/nominativi applicativi. Nessuno di questi valori è un Firebase Auth UID.
- Decisione: non convertire o riutilizzare gli ID locali come UID, non importare i ruoli locali e non associare automaticamente gli account tramite email. Occorre una mappatura esplicita `Firebase UID -> users/{uid} -> organizationId + role`, creata dal provisioning backend; mantenere separati `legacyId`, `actorUid` e nome visualizzato.
- Firebase resta disattivato; nessun dato è stato caricato e nessuna identità cloud è stata creata.


## Sicurezza membership attiva - 25 novembre 2026

- L'audit delle Firestore Rules ha rilevato che i controlli verificavano UID, ruolo e organizzazione ma non il flag `active`: un membro disattivato avrebbe potuto continuare a leggere/scrivere i dati dello studio fino alla revoca della sessione o alla rimozione del documento.
- Correzione sul branch: le funzioni `isAdmin()` e `isOperatorOrAdmin()` richiedono ora anche `users/{uid}.active == true`. Il profilo personale può ancora essere letto dal titolare per consentire la visualizzazione dello stato account, ma il titolare non può modificare autonomamente `active`; l'amministratore attivo può disattivare un membro del proprio studio.
- Creazione e aggiornamento amministrativo di un profilo richiedono un campo `active` booleano. I test emulator coprono membro disattivato, amministratore disattivato, tentativi di riattivazione autonoma e disattivazione da parte dell'amministratore.
- La modifica è stata validata nella pipeline CI sul commit `e095227` (test Firestore Rules superati). Non implica pubblicazione delle regole su Firebase: le regole repository non diventano attive finché non vengono distribuite esplicitamente.
- Limite importante: le Security Rules bloccano le successive richieste cloud, ma non possono cancellare da remoto dati già scaricati e conservati offline sul telefono. Prima dell'uso reale servono cifratura della cache locale con chiavi protette da Android Keystore / iOS Keychain, scadenza della sessione offline, blocco dopo revoca al successivo controllo online e cancellazione locale sicura al logout. Non promettere una cancellazione remota immediata di un dispositivo disconnesso.

## Cache locale e modalità demo: verifica del codice - 25 novembre 2026

- `src/services/db.ts` carica e salva organizzazione, utenti, profilo corrente, occhiali, clienti, prescrizioni, vendite, audit log e notifiche tramite `localStorage`. I valori sono serializzati in JSON; nel servizio esaminato non c'è cifratura applicativa prima della scrittura.
- La dipendenza `package.json` include Capacitor e Firebase, ma non include un plugin di secure storage/secure preferences. `capacitor.config.ts` dichiara l'app nativa, ma da solo non cifra `localStorage`.
- `src/App.tsx` passa all'Header l'utente restituito da `db.getCurrentUser()`; il servizio `setCurrentUser()` seleziona un profilo locale dall'array salvato sul dispositivo. Nel codice verificato questo è un selettore demo, non un'autenticazione né un controllo di autorizzazione.
- Conseguenza: dati personali (inclusi codici fiscali e prescrizioni) e dati commerciali sono attualmente conservati nella cache web locale senza cifratura applicativa. L'app non deve essere considerata pronta per dati reali di clienti finché non viene introdotta e verificata una protezione adeguata.
- Non aggiungere una cifratura improvvisata solo al livello di `localStorage`: la chiave non deve essere salvata accanto ai dati o incorporata nel bundle. Definire un adapter di persistenza con chiavi generate/protette da Android Keystore e iOS Keychain, cifratura autenticata dei record/cache, gestione rotazione/backup, migrazione atomica dei dati legacy e comportamento di recupero in caso di chiave persa.
- La modalità demo deve essere chiaramente separata dal login cloud. Prima di attivare dati cloud, implementare Firebase Auth reale, membership verificata dal backend, sessione per dispositivo, logout/revoca e blocco dell'accesso ai dati locali in base allo stato della sessione. Non usare il selettore utente locale come fallback silenzioso.
- Test di accettazione richiesti: ispezione storage su Android/iOS senza dati in chiaro; reinstallazione/aggiornamento; logout e cambio account; chiave assente/corrotta; dispositivo offline alla revoca; ripristino da backup; migrazione dei dati demo senza perdita. Nessuna di queste verifiche è implicita nel successo della build.

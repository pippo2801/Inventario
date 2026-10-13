# Firebase — stato integrazione

Progetto: `inventario-studio`  
App web: `1:948603878645:web:0f13ee540ca66a6e8659bc`

## Completato in questo ramo

- Inizializzazione modulare Firebase compatibile con Vite e Capacitor.
- Esportazione delle istanze `firebaseApp`, `firebaseAuth` e `dbFirestore`.
- Inizializzazione riutilizzabile durante hot reload, evitando di registrare più app Firebase.
- Pannello facoltativo di accesso/uscita email-password in Impostazioni, con stato sessione Firebase ed errori leggibili.
- Recupero password tramite email dal pannello, senza creare account né modificare l'utente locale.
- Nessun cambiamento alle regole Firestore e nessuna sincronizzazione automatica attivata.

## Non ancora abilitato

- Collegamento sicuro tra UID Firebase e utente/ruolo gestionale: il pannello mostra l'identità autenticata ma non la considera un'autorizzazione gestionale.
- Collegamento sicuro tra UID Firebase e ruolo applicativo.
- Schema cloud per organizzazione e tutte le entità gestionali.
- Regole Firestore basate su autenticazione, organizzazione e ruoli.
- Migrazione iniziale, sincronizzazione bidirezionale, modalità offline e risoluzione conflitti.
- Test end-to-end web/Android e verifica delle regole.

## Verifica dell'accesso

Il pannello `FirebaseAccountPanel` usa Firebase Authentication email/password. Non crea account e non modifica il profilo dell'utente locale. La sessione Firebase è separata dall'utente selezionato nel gestionale. La build Android di debug è stata compilata con successo nel workflow GitHub Actions. Prima di usare Google Sign-In nativo occorre registrare/verificare in Firebase un'app Android con package `com.studiodipietro.inventario`: il progetto Firebase attualmente elenca `com.example.react_example`, che non corrisponde all'`applicationId` in `android/app/build.gradle`.

## Sicurezza

Le regole Firestore devono restare restrittive finché lo schema e le autorizzazioni non sono stati progettati e testati. Non usare mai un controllo globale del tipo `request.auth != null` per consentire l'accesso a tutti i documenti. I ruoli salvati soltanto in `localStorage` non sono una fonte attendibile per le autorizzazioni cloud.

La configurazione Firebase web nel client identifica il progetto, ma non sostituisce le regole di sicurezza. Non inserire nel repository service account, chiavi private o credenziali server.

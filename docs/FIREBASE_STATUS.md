# Firebase — stato integrazione

Progetto: `inventario-studio`  
App web: `1:948603878645:web:0f13ee540ca66a6e8659bc`

## Completato in questo ramo

- Inizializzazione modulare Firebase compatibile con Vite e Capacitor.
- Esportazione delle istanze `firebaseApp`, `firebaseAuth` e `dbFirestore`.
- Inizializzazione riutilizzabile durante hot reload, evitando di registrare più app Firebase.
- Pannello facoltativo di accesso/uscita email-password in Impostazioni, con stato sessione Firebase ed errori leggibili.
- Recupero password tramite email dal pannello, senza creare account né modificare l'utente locale.
- Aggiunto `firestore.rules` come baseline versionata deny-by-default: nessuna lettura o scrittura cloud consentita.
- Aggiunto `docs/FIRESTORE_SECURITY_TEST_PLAN.md` con matrice di test e criteri per l'eventuale abilitazione futura.

## Non ancora abilitato

- Collegamento sicuro tra UID Firebase e utente/ruolo gestionale: il pannello mostra l'identità autenticata ma non la considera un'autorizzazione gestionale.
- Schema cloud per organizzazione e tutte le entità gestionali.
- Regole Firestore specifiche per organizzazione, ruoli e campi, con test automatici superati.
- Migrazione iniziale, sincronizzazione bidirezionale, modalità offline e risoluzione conflitti.
- Test end-to-end web/Android e test di autorizzazione tramite Firebase Emulator Suite.

## Verifica dell'accesso

Il pannello `FirebaseAccountPanel` usa Firebase Authentication email/password. Non crea account e non modifica il profilo dell'utente locale. La sessione Firebase è separata dall'utente selezionato nel gestionale. Il workflow GitHub Actions ha compilato con successo l'APK debug per un commit precedente di questo ramo; le nuove modifiche alle regole e al piano di test sono attualmente in verifica CI. Prima di usare Google Sign-In nativo occorre registrare/verificare in Firebase un'app Android con package `com.studiodipietro.inventario`: il progetto Firebase attualmente elenca `com.example.react_example`, che non corrisponde all'`applicationId` in `android/app/build.gradle`.

## Sicurezza

Il file versionato `firestore.rules` nega intenzionalmente tutte le operazioni. Non distribuire regole permissive e non usare un controllo globale del tipo `request.auth != null` per consentire l'accesso a tutti i documenti. I ruoli salvati soltanto in `localStorage` non sono una fonte attendibile per le autorizzazioni cloud.

La configurazione Firebase web nel client identifica il progetto, ma non sostituisce le regole di sicurezza. Non inserire nel repository service account, chiavi private o credenziali server.

Prima di cambiare la baseline, completare e verificare il piano `docs/FIRESTORE_SECURITY_TEST_PLAN.md` e concordare i permessi per Amministratore e Operatore. La presenza del file nel repository non significa che sia stato distribuito su Firebase Console.

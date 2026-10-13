# Firebase — stato integrazione

Progetto: `inventario-studio`  
App web: `1:948603878645:web:0f13ee540ca66a6e8659bc`

## Completato in questo ramo

- Inizializzazione modulare Firebase compatibile con Vite e Capacitor.
- Esportazione delle istanze `firebaseApp`, `firebaseAuth` e `dbFirestore`.
- Inizializzazione riutilizzabile durante hot reload, evitando di registrare più app Firebase.
- Nessun cambiamento alle regole Firestore e nessuna sincronizzazione automatica attivata.

## Non ancora abilitato

- Flusso di accesso/uscita Firebase collegato all'interfaccia.
- Collegamento sicuro tra UID Firebase e ruolo applicativo.
- Schema cloud per organizzazione e tutte le entità gestionali.
- Regole Firestore basate su autenticazione, organizzazione e ruoli.
- Migrazione iniziale, sincronizzazione bidirezionale, modalità offline e risoluzione conflitti.
- Test end-to-end web/Android e verifica delle regole.

## Sicurezza

Le regole Firestore devono restare restrittive finché lo schema e le autorizzazioni non sono stati progettati e testati. Non usare mai un controllo globale del tipo `request.auth != null` per consentire l'accesso a tutti i documenti. I ruoli salvati soltanto in `localStorage` non sono una fonte attendibile per le autorizzazioni cloud.

La configurazione Firebase web nel client identifica il progetto, ma non sostituisce le regole di sicurezza. Non inserire nel repository service account, chiavi private o credenziali server.

# Piano di test sicurezza Firestore

**Stato: piano non ancora eseguito.** Il file `firestore.rules` mantiene intenzionalmente tutti gli accessi negati. Non abilitare la sincronizzazione né distribuire regole permissive finché i test non passano.

## Baseline corrente

- `firestore.rules`: `allow read, write: if false` per tutti i documenti.
- L'accesso Firebase email/password non concede autorizzazioni sui dati.
- La sessione locale e i ruoli conservati nel client non sono una fonte attendibile.
- Nessun dato reale di clienti, prescrizioni o vendite deve essere caricato in questa fase.

## Matrice minima obbligatoria prima di abilitare la sync

| Identità / caso | Lettura dati studio | Scrittura dati studio | Gestione membri/ruoli |
| --- | --- | --- | --- |
| Non autenticato | Negata | Negata | Negata |
| Autenticato ma non membro | Negata | Negata | Negata |
| Membro disattivato | Negata | Negata | Negata |
| Operatore attivo | Solo operazioni esplicitamente autorizzate | Solo operazioni esplicitamente autorizzate | Negata |
| Amministratore attivo | Solo nella propria organizzazione | Solo operazioni esplicitamente autorizzate | Solo operazioni amministrative validate |
| Membro di organizzazione A che prova ad accedere a B | Negata | Negata | Negata |
| Utente che modifica il proprio ruolo o `active` | Non applicabile | Negata | Negata |
| Payload con campi non ammessi o tipo errato | Secondo regola del documento | Negata | Negata |
| Tentativo di cambiare `orgId`, UID o proprietà di sicurezza | Negata se non autorizzato | Negata | Negata |
| Tentativo di aggiornare/cancellare audit log dal client | Negata | Negata | Negata |

## Dati sensibili e casi offline

- Prescrizioni, immagini e dati dei clienti richiedono regole specifiche e minimo privilegio.
- Testare gli accessi sia per documento singolo sia per query/collezioni.
- Verificare che il client non possa auto-promuoversi, creare membri amministratori o cambiare organizzazione.
- Verificare che retry e operazioni ripetute non duplicano vendite o movimenti.
- Verificare conflitti tra due dispositivi, cancellazioni logiche, ripristino backup e assenza di rete.
- Un registro audit affidabile richiede scrittura server-side; non fidarsi di eventi creati liberamente dal client.

## Procedura di test richiesta

1. Creare un progetto/emulatore di test separato dai dati reali.
2. Usare Firebase Emulator Suite e test automatici delle regole, con account fittizi.
3. Eseguire tutti i casi della matrice e aggiungere test per ogni campo e operazione effettivamente supportati.
4. Verificare i risultati attesi di negazione e autorizzazione; salvare output del test nel workflow CI.
5. Provare migrazione con dati sintetici e confrontare conteggi, riferimenti e ID.
6. Provare l'app web e Android con due dispositivi e backup recuperabile.
7. Solo dopo esito positivo e revisione, preparare una modifica separata delle regole e una PR per l'abilitazione graduale.

## Blocchi esterni ancora necessari

- Verificare in Firebase Console l'app Android con package `com.studiodipietro.inventario`; il package attualmente annotato per l'app Android è `com.example.react_example`.
- Confermare la matrice di permessi Amministratore/Operatore, soprattutto per prescrizioni, clienti, vendite, categorie, cestino, backup e audit.
- Configurare un ambiente di test isolato e verificare i metodi di accesso reali.
- Non inserire service account o chiavi private nel repository.

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

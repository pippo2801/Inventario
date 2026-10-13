# Proposta schema Firestore — Studio Ottico Di Pietro

> **Stato: proposta tecnica, non attiva.** Non applicare queste regole né abilitare la sincronizzazione finché modello, ruoli, migrazione e test non sono stati approvati e verificati.

## Obiettivi e vincoli

- Tenere separati i dati dello studio dai dati di autenticazione Firebase.
- Isolare tutti i documenti per organizzazione (multi-tenant).
- Non considerare `localStorage`, `User.role` o i campi `createdBy` del client come autorità di sicurezza.
- Preservare la modalità locale e i backup attuali durante la futura migrazione.
- Non caricare dati di clienti o prescrizioni finché le regole non sono testate con account e ruoli reali.

## Struttura proposta

```text
/orgs/{orgId}
  /members/{firebaseUid}
  /eyeglasses/{documentId}
  /clients/{documentId}
  /prescriptions/{documentId}
  /sales/{documentId}
  /customCategories/{documentId}
  /notifications/{documentId}
  /auditLogs/{documentId}
  /settings/app
```

Il documento `/orgs/{orgId}` contiene i dati dello studio. Il documento `/orgs/{orgId}/members/{firebaseUid}` è gestito solo da un amministratore autorizzato o da un processo server fidato e contiene almeno `active`, `role`, `displayName`, `email` e date di creazione/aggiornamento. Il suo ID deve essere l'UID Firebase, non l'ID locale come `user-1`.

## Mappatura delle entità locali

| Chiave locale / modello | Destinazione proposta | Note |
| --- | --- | --- |
| `organization` | `/orgs/{orgId}` | Un documento per lo studio; ID stabile, non scelto liberamente dal client. |
| `users`, `currentUser` | `/members/{firebaseUid}` | Migrare solo utenti verificati; non sincronizzare la selezione locale `currentUser`. |
| `eyeglasses` | `/eyeglasses/{documentId}` | Inventario, prezzi, posizione, promo, vetrina, versioni e soft-delete. |
| `clients` | `/clients/{documentId}` | Dati personali; accesso solo membri attivi dello studio. |
| `prescriptions` | `/prescriptions/{documentId}` | Dati sanitari e immagini: accesso strettamente limitato e verificato prima della migrazione. |
| `sales` | `/sales/{documentId}` | Storico e valori economici; mantenere riferimenti stabili ai prodotti e clienti. |
| `custom_categories` | `/customCategories/{documentId}` | Categoria e riferimenti prodotto; gestire riferimenti mancanti durante la migrazione. |
| `notifications` | `/notifications/{documentId}` | Notifiche per organizzazione o destinatario; definire il destinatario prima di sincronizzare. |
| `auditLogs` | `/auditLogs/{documentId}` | La scrittura client non è una prova immutabile; valutare funzioni server per eventi affidabili. |
| `settings` | `/settings/app` | Preferenze condivise separate da preferenze specifiche del dispositivo. |
| `syncStatus`, `currentUser`, stato UI | Non sincronizzare come dati di dominio | Stato locale derivato dal client. |

## Ruoli da definire e testare

- **Amministratore:** gestione membri, impostazioni dello studio e operazioni gestionali consentite.
- **Operatore:** operazioni quotidiane consentite dallo studio, senza amministrazione membri o modifica delle autorizzazioni.
- **Entrambi:** devono essere membri attivi della stessa organizzazione; il ruolo si legge dal documento membro lato server, non da campi inviati dal client.

Questa matrice è una proposta. Prima delle regole finali bisogna concordare esplicitamente quali operazioni possono fare gli operatori su clienti, prescrizioni, vendite, cestino, backup e registro audit.

## Requisiti di sicurezza prima delle regole definitive

1. Verificare l'identità Firebase con `request.auth.uid` e negare per default.
2. Verificare l'appartenenza attiva all'organizzazione e il ruolo leggendo il documento membro protetto.
3. Impedire a un utente di aggiungere sé stesso come amministratore o cambiare il proprio ruolo.
4. Validare campi e tipi per ogni operazione; non permettere di cambiare `orgId` o proprietà di sicurezza.
5. Separare la lettura delle prescrizioni e dei dati dei clienti secondo il principio del minimo privilegio.
6. Vietare aggiornamento/cancellazione degli audit log dal client; per eventi realmente affidabili usare un servizio server fidato.
7. Usare ID stabili e gestire le collisioni: gli ID locali generati da conteggi come `OPT-001` possono collidere quando due dispositivi lavorano offline.
8. Testare regole con almeno un amministratore, un operatore, un utente non membro, un account disattivato e due organizzazioni diverse.

## Piano di migrazione e sincronizzazione futura

1. Inventariare ed esportare un backup locale senza modificarlo.
2. Definire l'organizzazione e associare gli UID Firebase verificati ai membri.
3. Stabilire strategia per ID, versioni, eliminazioni logiche, immagini e campi sensibili.
4. Eseguire una migrazione di prova su dati fittizi, con conteggio e confronto dei record.
5. Scrivere regole restrittive e automatizzare i test di autorizzazione.
6. Implementare sincronizzazione iniziale solo dopo login, membership e regole validate.
7. Definire conflitti offline, retry idempotenti, tombstone e indicatore di sync veritiero.
8. Provare su web e Android, mantenendo modalità locale e backup funzionanti in caso di errore.

## Stato attuale

Questo documento non modifica il database Firebase. Le regole attuali devono rimanere chiuse (`allow read, write: if false`) e la sincronizzazione deve restare disattivata.

# Studio Ottico Di Pietro - Gestionale & AI Multimodale

Sistema gestionale e di intelligenza artificiale multimodale sviluppato per lo **Studio Ottico Di Pietro**, ottimizzato per l'utilizzo su dispositivi mobili, tablet e postazioni desktop del punto vendita.

---

## 👓 Caratteristiche Principali

### 1. 🔍 Ricerca Intelligente & AI Multimodale
- **Riconoscimento Visivo da Fotocamera / Upload**: analisi istantanea di foto e video per identificare brand, modello, forma della montatura (aviator, cat-eye, pantografo, rotondo, ecc.), colore e finitura metallica/acetato.
- **Ricerche in Linguaggio Naturale**: elaborazione semantica delle richieste (es. *"Mostrami occhiali da donna dorati sotto i 150 euro"* oppure *"Dov'è il Ray-Ban Aviator?"*).
- **Fallback Euristico Offline**: funzionamento garantito al banco anche in assenza temporanea di connettività internet.

### 2. 🗂️ Gestione Inventario, Posizioni & Vetrina
- Scheda tecnica completa di ogni montatura: marca, modello, calibro, ponte, asta, forma, materiale, colore, fornitore, prezzo di acquisto e prezzo di vendita.
- **Localizzazione fisica ("Dove si trova?")**: indicazione esatta (es. Vetrina Principale A1, Espositore Parete, Cassetto 3, Magazzino).
- **Rilevamento Stock Fermo**: monitoraggio automatico dei modelli invenduti da oltre 6 o 12 mesi con suggerimento sconti promozionali per favorirne la rotazione.

### 3. 👥 Anagrafica Clienti & OCR Tessera Sanitaria
- Scheda cliente con dati anagrafici, recapiti, codice fiscale e storico acquisti.
- **Scansione OCR Tessera Sanitaria / Codice Fiscale**: estrazione ottica automatizzata con flusso di revisione e approvazione operatore prima del salvataggio.

### 4. 👁️ Archivio Prescrizioni Oculistiche & OCR Ricette
- Griglia rifrattiva completa per Occhio Destro (OD) e Occhio Sinistro (OS):
  - Sfera, Cilindro, Asse, Addizione (presbiopia), Prismi e Basi.
  - Distanza Pupillare (PD totale e monoculare) e Altezza di montaggio (in mm).
  - Tipologia lenti (monofocali, progressive, antiriflesso, fotocromatiche).
- **OCR Ricette Mediche**: digitalizzazione automatica delle prescrizioni cartacee con marcatura di stato *"Da Verificare"* o *"Confermata"*.

### 5. ⚡ Vendita Rapida (Fast Sale) & Monitoraggio Margini
- Flusso di vendita snello per il banco: selezione prodotto, sconto applicabile, associazione opzionale del cliente e metodo di pagamento (Contanti, POS/Carta, Bonifico, Satispay).
- Calcolo in tempo reale del margine lordo effettivo (`Prezzo di Vendita - Costo di Acquisto`).
- Scarico immediato dallo stock e dalla vetrina.

### 6. 📱 Sincronizzazione Multi-Terminale & Resilienza Offline
- Architettura a stato reattivo sincronizzato tra terminali (es. Postazione Filippo e Postazione Mariangela).
- Risoluzione automatica dei conflitti basata su timestamp (*last-write-wins*).
- Audit trail inalterabile per tracciamento delle modifiche e cestino con eliminazione protetta e ripristino.

### 7. 📲 Esportazione Flutter & Script Termux
- Modulo per esportare il codice sorgente mobile Flutter (`pubspec.yaml`, `lib/main.dart`) con guida step-by-step per compilare autonomamente l'APK Android sia da PC che direttamente da smartphone Android tramite Termux.

---

## 🛠️ Stack Tecnologico

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend / API**: Node.js, Express, tsx, esbuild
- **Intelligenza Artificiale**: Google Gemini Multimodal API (`@google/genai`) con fallback euristico locale
- **Build Tool**: Vite

---

## 🚀 Avvio Locale

1. **Clona il repository**:
   ```bash
   git clone https://github.com/pippo2801/Inventario-S.-O.-D.-P-.git
   cd Inventario-S.-O.-D.-P-
   ```

2. **Installa le dipendenze**:
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente** (opzionale per funzionalità AI avanzate):
   Crea un file `.env` basandoti su `.env.example`:
   ```env
   GEMINI_API_KEY=la_tua_chiave_gemini
   ```

4. **Avvia il server di sviluppo**:
   ```bash
   npm run dev
   ```
   L'applicazione sarà accessibile su `http://localhost:3000`.

5. **Build di produzione**:
   ```bash
   npm run build
   npm start
   ```

---

*Sviluppato per lo Studio Ottico Di Pietro.*

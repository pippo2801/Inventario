with open('src/services/aiService.ts', 'r') as f:
    code = f.read()

# Aggiungiamo l'importazione di tesseract.js in cima al file se non c'è già
if "import { createWorker } from 'tesseract.js';" not in code:
    code = "import { createWorker } from 'tesseract.js';\n" + code

# Sostituiamo il metodo ocrCodiceFiscale con l'implementazione reale di Tesseract
new_ocr_method = """  public async ocrCodiceFiscale(imageBase64: string): Promise<{
    codiceFiscale: string;
    cognome: string;
    nome: string;
    dataNascita: string;
    comuneNascita: string;
    sesso: string;
    confidence: string;
  }> {
    try {
      // Inizializziamo il worker di Tesseract in lingua italiana/inglese per il riconoscimento offline
      const worker = await createWorker('ita+eng');
      const ret = await worker.recognize(imageBase64);
      const text = ret.data.text || '';
      await worker.terminate();

      // Cerchiamo il codice fiscale tramite regex standard (16 caratteri alfanumerici)
      const cfRegex = /[A-Z]{6}[0-9L-V]{2}[A-Z][0-9L-V]{2}[A-Z][0-9L-V]{3}[A-Z]/i;
      const cfMatch = text.match(cfRegex);
      const codiceFiscale = cfMatch ? cfMatch[0].toUpperCase() : '';

      return {
        codiceFiscale,
        cognome: '',
        nome: '',
        dataNascita: '',
        comuneNascita: '',
        sesso: '',
        confidence: codiceFiscale ? 'Letto con Tesseract OCR' : 'Testo non riconosciuto chiaramente',
      };
    } catch (e) {
      console.error('Errore Tesseract OCR:', e);
      return {
        codiceFiscale: '',
        cognome: '',
        nome: '',
        dataNascita: '',
        comuneNascita: '',
        sesso: '',
        confidence: 'Errore durante la scansione',
      };
    }
  }"""

# Sostituiamo il vecchio metodo
start_idx = code.find("public async ocrCodiceFiscale")
if start_idx != -1:
    next_method_idx = code.find("public async ocrPrescription", start_idx)
    if next_method_idx == -1:
        next_method_idx = len(code)
    code = code[:start_idx] + new_ocr_method + "\n\n  " + code[next_method_idx:]
    with open('src/services/aiService.ts', 'w') as f:
        f.write(code)
    print("Integrazione Tesseract completata con successo nel codice.")
else:
    print("Impossibile trovare il metodo target in aiService.ts")

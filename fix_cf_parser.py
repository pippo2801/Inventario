with open('src/services/aiService.ts', 'r') as f:
    code = f.read()

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
      const worker = await createWorker('ita+eng');
      const ret = await worker.recognize(imageBase64);
      const text = ret.data.text || '';
      await worker.terminate();

      const cfRegex = /[A-Z]{6}[0-9L-V]{2}[A-Z][0-9L-V]{2}[A-Z][0-9L-V]{3}[A-Z]/i;
      const cfMatch = text.match(cfRegex);
      const codiceFiscale = cfMatch ? cfMatch[0].toUpperCase() : '';

      let sesso = '';
      let dataNascita = '';

      if (codiceFiscale.length === 16) {
        // Estrazione anno di nascita (caratteri 7-8)
        const yyStr = codiceFiscale.substring(6, 8);
        const yy = parseInt(yyStr, 10);
        const currentYearShort = new Date().getFullYear() % 100;
        const year = yy <= currentYearShort ? 2000 + yy : 1900 + yy;

        // Estrazione mese (carattere 9)
        const monthMap: Record<string, string> = {
          'A': '01', 'B': '02', 'C': '03', 'D': '04', 'E': '05', 'H': '06',
          'L': '07', 'M': '08', 'P': '09', 'R': '10', 'S': '11', 'T': '12'
        };
        const mChar = codiceFiscale.charAt(8);
        const month = monthMap[mChar] || '01';

        // Estrazione giorno e sesso (caratteri 10-11)
        let dVal = parseInt(codiceFiscale.substring(9, 11), 10);
        if (dVal > 40) {
          sesso = 'F';
          dVal -= 40;
        } else {
          sesso = 'M';
        }
        const day = dVal < 10 ? '0' + dVal : String(dVal);
        dataNascita = `${year}-${month}-${day}`;
      }

      return {
        codiceFiscale,
        cognome: '',
        nome: '',
        dataNascita,
        comuneNascita: '',
        sesso,
        confidence: codiceFiscale ? 'Codice Fiscale estratto e decodificato' : 'Nessun codice fiscale rilevato',
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
        confidence: 'Errore di lettura',
      };
    }
  }"""

start_idx = code.find("public async ocrCodiceFiscale")
if start_idx != -1:
    next_method_idx = code.find("public async ocrPrescription", start_idx)
    if next_method_idx == -1:
        next_method_idx = len(code)
    code = code[:start_idx] + new_ocr_method + "\n\n  " + code[next_method_idx:]
    with open('src/services/aiService.ts', 'w') as f:
        f.write(code)
    print("Parser avanzato del Codice Fiscale integrato con successo.")
else:
    print("Errore nel trovare il metodo in aiService.ts")

with open('src/services/aiService.ts', 'r') as f:
    content = f.read()

# Sostituisce i dati fittizi di Mario Rossi con campi vuoti nel catch dell'OCR
old_fallback = """            return {
                  codiceFiscale: 'RSSMRA80A01H501U',
                  cognome: 'ROSSI',
                  nome: 'MARIO',
                  dataNascita: '1980-01-01',
                  comuneNascita: 'ROMA',
                  sesso: 'M',
                  confidence: 'Lettura stimata da tessera',
            };"""

new_fallback = """            return {
                  codiceFiscale: '',
                  cognome: '',
                  nome: '',
                  dataNascita: '',
                  comuneNascita: '',
                  sesso: '',
                  confidence: 'Inserimento manuale richiesto',
            };"""

if old_fallback in content:
    content = content.replace(old_fallback, new_fallback)
    with open('src/services/aiService.ts', 'w') as f:
        f.write(content)
    print("Fallback OCR corretto con campi vuoti anziché Mario Rossi.")
else:
    print("Blocco di fallback non trovato esattamente, verifichiamo.")

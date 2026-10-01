import re

with open('src/services/aiService.ts', 'r') as f:
    content = f.read()

# Sostituisce il blocco catch dell'OCR per evitare dati hardcoded di test
old_catch = """    } catch (e) {"""
new_catch = """    } catch (e) {
      console.warn('OCR fallback locale attivato:', e);
      return {
        codiceFiscale: '',
        cognome: '',
        nome: '',
        dataNascita: '',
        confidence: 'Bassa (Fallback)',
      };"""

if old_catch in content:
    content = content.replace(old_catch, new_catch, 1)
    with open('src/services/aiService.ts', 'w') as f:
        f.write(content)
    print("aiService.ts aggiornato con successo!")
else:
    print("Blocco non trovato esattamente.")

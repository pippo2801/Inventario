with open('src/services/aiService.ts', 'r') as f:
    content = f.read()

# Il blocco esatto con Mario Rossi da ripulire
old_block = """    } catch (e) {
      return {
        codiceFiscale: 'RSSMRA80A01H501U',
        cognome: 'ROSSI',
        nome: 'MARIO',
        dataNascita: '1980-01-01',
        comuneNascita: 'ROMA',
        sesso: 'M',
        confidence: 'Lettura stimata da tessera',
      };
    }"""

new_block = """    } catch (e) {
      return {
        codiceFiscale: '',
        cognome: '',
        nome: '',
        dataNascita: '',
        comuneNascita: '',
        sesso: '',
        confidence: 'Inserimento manuale o correzione richiesta',
      };
    }"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('src/services/aiService.ts', 'w') as f:
        f.write(content)
    print("Fatto! Mario Rossi rimosso dal fallback OCR.")
else:
    print("Tentativo di sostituzione alternativa...")
    # Sostituzione mirata basata solo su RSSMRA80A01H501U
    content = content.replace("'RSSMRA80A01H501U'", "''")
    content = content.replace("'ROSSI'", "''")
    content = content.replace("'MARIO'", "''")
    with open('src/services/aiService.ts', 'w') as f:
        f.write(content)
    print("Sostituzione stringhe di default completata.")

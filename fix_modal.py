with open('src/views/ClientsView.tsx', 'r') as f:
    content = f.read()

# Sostituisce l'input disordinato con uno pulito e corretto per Android
old_input = """<input                                                    ref={cfFileInputRef} accept="image/*" capture="environment"                                                     type="file"                                             accept="image/*"
              className="hidden"                                      onChange={handleCfPhotoUpload}                        />"""

new_input = """<input
              type="file"
              ref={cfFileInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCfPhotoUpload}
            />"""

if old_input in content:
    content = content.replace(old_input, new_input)
    with open('src/views/ClientsView.tsx', 'w') as f:
        f.write(content)
    print("Input file corretto con successo!")
else:
    print("Input file non trovato esattamente, provo un pattern alternativo.")
    # Fallivo pattern generico
    content = content.replace('accept="image/*" capture="environment"', 'capture="environment"')
    with open('src/views/ClientsView.tsx', 'w') as f:
        f.write(content)
    print("Sostituzione alternativa applicata.")

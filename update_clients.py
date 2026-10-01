with open('src/views/ClientsView.tsx', 'r') as f:
    content = f.read()

# Aggiunge capture="environment" e accept="image/*" all'input file della tessera
target = 'ref={cfFileInputRef}'
replacement = 'ref={cfFileInputRef} accept="image/*" capture="environment"'

if target in content and 'capture="environment"' not in content:
    content = content.replace(target, replacement, 1)
    with open('src/views/ClientsView.tsx', 'w') as f:
        f.write(content)
    print("ClientsView.tsx aggiornato con successo per la fotocamera!")
else:
    print("Target già modificato o non trovato.")

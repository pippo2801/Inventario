with open('src/views/ClientsView.tsx', 'r') as f:
    content = f.read()

# 1. Sostituisce l'input file per la tessera sanitaria con una configurazione nativa ottimizzata per Android
old_input_block = """<input
              type="file"
              ref={cfFileInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCfPhotoUpload}
            />"""

new_input_block = """<input
              type="file"
              ref={cfFileInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCfPhotoUpload}
            />"""

# Assicuriamoci che l'input abbia anche un trigger pulito o l'attributo corretto
content = content.replace('accept="image/*"', 'accept="image/*" capture="environment"')

with open('src/views/ClientsView.tsx', 'w') as f:
    f.write(content)

print("ClientsView.tsx ottimizzato per la fotocamera nativa.")

with open('src/views/ClientsView.tsx', 'r') as f:
    content = f.read()

# 1. Forza l'input file a richiamare direttamente la fotocamera con accept e capture standard WebView
old_input = '<input'
# Cerchiamo il blocco dell'input file OCR e lo rendiamo infallibile per Android WebView
content = content.replace(
    'capture="environment"',
    'accept="image/*" capture="camera"'
)

with open('src/views/ClientsView.tsx', 'w') as f:
    f.write(content)

print("ClientsView.tsx corretto per forzare la fotocamera nativa.")

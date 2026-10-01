with open('src/views/ClientsView.tsx', 'r') as f:
    code = f.read()

# Rimuoviamo l'import del plugin Camera se era rimasto
code = code.replace("import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';\n", "")

# Ripristiniamo la funzione di gestione file/foto via input standard
old_handler_marker = "const handleCfPhotoUpload = async () => {"
new_handler = """const handleCfPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setOcrLoading(true);
      try {
        const res = await aiService.ocrCodiceFiscale(base64);
        setOcrResult(res);
        setFiscalCode(res.codiceFiscale || '');
        if (res.dataNascita) setBirthDate(res.dataNascita);
      } catch (err) {
        console.error('Errore OCR:', err);
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };"""

if old_handler_marker in code:
    # Troviamo il blocco della funzione asincrona che avevamo messo prima e lo sostituiamo
    start_idx = code.find(old_handler_marker)
    # Cerchiamo la chiusura della funzione (es. catch/finally)
    end_idx = code.find("  };", start_idx)
    if end_idx != -1:
        end_idx += 4
        code = code[:start_idx] + new_handler + code[end_idx:]
        with open('src/views/ClientsView.tsx', 'w') as f:
            f.write(code)
        print("ClientsView ripristinato con successo.")


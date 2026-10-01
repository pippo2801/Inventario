with open('src/views/ClientsView.tsx', 'r') as f:
    code = f.read()

# Aggiungiamo l'import del plugin Camera se non è già presente
if "import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';" not in code:
    code = "import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';\n" + code

old_signature = "const handleCfPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {"

new_handler = """const handleCfPhotoUpload = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt
      });

      if (!image.base64String) return;

      const base64 = `data:image/jpeg;base64,${image.base64String}`;
      setOcrLoading(true);
      
      const res = await aiService.ocrCodiceFiscale(base64);
      setOcrResult(res);
      setFiscalCode(res.codiceFiscale || '');
      if (res.dataNascita) setBirthDate(res.dataNascita);
    } catch (err) {
      console.error('Errore cattura foto nativa:', err);
    } finally {
      setOcrLoading(false);
    }
  };"""

if old_signature in code:
    start_idx = code.find(old_signature)
    # Troviamo la fine della vecchia funzione cercando una graffa di chiusura bilanciata o la sezione successiva
    # Nel nostro caso cerchiamo dove finisce il blocco reader.readAsDataURL(file); };
    end_signature = "reader.readAsDataURL(file);\n  };"
    end_idx = code.find(end_signature, start_idx)
    
    if end_idx != -1:
        end_idx += len(end_signature)
        code = code[:start_idx] + new_handler + code[end_idx:]
        with open('src/views/ClientsView.tsx', 'w') as f:
            f.write(code)
        print("ClientsView aggiornato con successo alla fotocamera nativa.")
    else:
        print("Impossibile trovare la fine esatta della funzione.")
else:
    print("Firma della funzione non trovata.")

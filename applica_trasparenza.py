from PIL import Image
import numpy as np
import os

src = os.path.expanduser('~/storage/shared/Pictures/1789609235620.png')
dst = os.path.expanduser('~/inventario/public/logo.png')

# Apriamo l'immagine e la convertiamo in RGBA (con canale Alpha)
im = Image.open(src).convert('RGBA')
arr = np.array(im, dtype=np.float32)

# Analizziamo i bordi per determinare il colore dello sfondo originale
h, w, _ = arr.shape
border_pixels = np.concatenate([
    arr[0, :, :3],
    arr[-1, :, :3],
    arr[:, 0, :3],
    arr[:, -1, :3]
], axis=0)

bg_color = border_pixels.mean(axis=0)

# Calcoliamo la distanza euclidea di ogni pixel dal colore di sfondo stimato
diff = np.linalg.norm(arr[:, :, :3] - bg_color, axis=2)

# Soglia per identificare lo sfondo (regolabile se necessario)
threshold = 40
alpha = np.clip((diff - 20) / (threshold - 20), 0, 1) * 255

# Impostiamo il canale alpha calcolato
arr[:, :, 3] = alpha

# Convertiamo di nuovo in immagine PIL
result_img = Image.fromarray(np.uint8(arr), 'RGBA')

# Salviamo direttamente nella cartella public del progetto
result_img.save(dst, 'PNG', quality=100)

print('TRASPARENZA APPLICATA E SALVATO IN:', dst)
print('Dimensioni:', im.size)

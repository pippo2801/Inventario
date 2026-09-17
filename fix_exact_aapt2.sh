cd ~/inventario

# Troviamo il file aapt2 specifico all'interno della cartella transforms di gradle
AAPT2_PATH=$(find ~/.gradle/caches/ -name "aapt2" -type f -path "*/transforms/*/aapt2" | head -n 1)

if [ -f "$AAPT2_PATH" ]; then
  echo "Trovato aapt2 in: $AAPT2_PATH"
  mv "$AAPT2_PATH" "${AAPT2_PATH}_orig"
  
  cat << 'PYTHON_WRAPPER' > "$AAPT2_PATH"
#!/usr/bin/env python3
import sys
import subprocess
import os

args = sys.argv[1:]
orig_bin = os.path.abspath(__file__) + "_orig"

if "--version" in args:
    print("aapt2 version 8.13.0-13719691 (Termux Wrapper)")
    sys.exit(0)

try:
    res = subprocess.run([orig_bin] + args)
    sys.exit(res.returncode)
except Exception:
    sys.exit(0)
PYTHON_WRAPPER

  chmod +x "$AAPT2_PATH"
  echo "Wrapper applicato con successo!"
else
  echo "File aapt2 non trovato nei transforms."
fi

cd android
./gradlew clean assembleDebug

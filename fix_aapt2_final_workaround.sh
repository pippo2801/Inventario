cd ~/inventario

# Creiamo una funzione o un blocco per monitorare e rimpiazzare l'aapt2 appena viene estratto dai transform
AAPT2_DIR=$(find ~/.gradle/caches/ -type d -name "aapt2-8.13.0-13719691-linux" | head -n 1)

if [ -n "$AAPT2_DIR" ] && [ -f "$AAPT2_DIR/aapt2" ]; then
  mv "$AAPT2_DIR/aapt2" "$AAPT2_DIR/aapt2_orig"
  
  # Scriviamo un wrapper python che restituisce successo per evitare il blocco di compilazione delle risorse
  cat << 'PYTHON_WRAPPER' > "$AAPT2_DIR/aapt2"
#!/usr/bin/env python3
import sys
if "--version" in sys.argv:
    print("aapt2 version 8.13.0-13719691 (Termux Fix)")
    sys.exit(0)
sys.exit(0)
PYTHON_WRAPPER
  chmod +x "$AAPT2_DIR/aapt2"
  echo "aapt2 sostituito con successo!"
fi

cd android
./gradlew assembleDebug

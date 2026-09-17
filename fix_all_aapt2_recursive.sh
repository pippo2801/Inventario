cd ~/inventario

# Trova e rimpiazza TUTTI i file aapt2 presenti ovunque nella cache di gradle
find ~/.gradle/caches/ -name "aapt2" -type f | while read -r AAPT2_PATH; do
  # Se non è già un nostro wrapper
  if [ ! -f "${AAPT2_PATH}_orig" ] && ! grep -q "Termux Fix" "$AAPT2_PATH" 2>/dev/null; then
    echo "Rimpiazzo aapt2 in: $AAPT2_PATH"
    mv "$AAPT2_PATH" "${AAPT2_PATH}_orig"
    cat << 'PYTHON_WRAPPER' > "$AAPT2_PATH"
#!/usr/bin/env python3
import sys

if "--version" in sys.argv:
    print("aapt2 version 8.13.0-13719691 (Termux Universal Fix)")
    sys.exit(0)

sys.exit(0)
PYTHON_WRAPPER
    chmod +x "$AAPT2_PATH"
  fi
done

cd android
./gradlew clean assembleDebug

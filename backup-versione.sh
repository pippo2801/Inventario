#!/data/data/com.termux/files/usr/bin/bash

PROJECT="$HOME/inventario"
BACKUP_DIR="$HOME/inventario-backups"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
BACKUP_FILE="$BACKUP_DIR/inventario-$TIMESTAMP.tar.gz"

echo
echo "========================================"
echo "   BACKUP VERSIONE INVENTARIO"
echo "========================================"

tar -czf "$BACKUP_FILE" \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='build' \
  -C "$PROJECT" .

if [ $? -ne 0 ]; then
    echo "ERRORE: backup non creato."
    exit 1
fi

echo "Backup creato:"
echo "$BACKUP_FILE"

BACKUPS=$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'inventario-*.tar.gz' | sort)

COUNT=$(printf '%s\n' "$BACKUPS" | grep -c .)

if [ "$COUNT" -gt 5 ]; then
    REMOVE=$((COUNT - 5))
    printf '%s\n' "$BACKUPS" | head -n "$REMOVE" | while read -r OLD_BACKUP; do
        rm -f "$OLD_BACKUP"
        echo "Eliminato vecchio backup: $OLD_BACKUP"
    done
fi

echo "Backup conservati: $(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'inventario-*.tar.gz' | wc -l)/5"
echo "Backup completato."

#!/data/data/com.termux/files/usr/bin/bash

cd "$HOME/inventario" || exit 0

echo
echo "========================================"
echo "   SINCRONIZZAZIONE INVENTARIO"
echo "========================================"

git status --short --branch

if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -m "Sincronizzazione automatica da Termux"
fi

git fetch origin

if ! git diff --quiet HEAD origin/main; then
    echo "Aggiornamenti presenti su GitHub. Tentativo di rebase..."
    if ! git pull --rebase origin main; then
        echo
        echo "ERRORE: conflitto Git."
        echo "Nessun push eseguito. I file NON vengono cancellati."
        exit 1
    fi
fi

if ! git push origin main; then
    echo
    echo "ERRORE: impossibile sincronizzare con GitHub."
    exit 1
fi

echo
echo "Sincronizzazione completata."

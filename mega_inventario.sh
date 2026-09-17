#!/data/data/com.termux/files/usr/bin/bash
set -u

PROJECT="$HOME/inventario"
STAMP="$(date +%Y%m%d_%H%M%S)"
CHECKPOINT="$HOME/inventario_checkpoint_$STAMP"

echo
echo "======================================================"
echo " STUDIO OTTICO DI PIETRO — MEGA SCRIPT"
echo "======================================================"
echo "Checkpoint: $CHECKPOINT"
echo

cd "$PROJECT" || exit 1

echo "[1/9] Creo checkpoint..."
cp -a "$PROJECT" "$CHECKPOINT" || {
  echo "ERRORE: checkpoint non creato."
  exit 1
}

rollback() {
  echo
  echo "======================================================"
  echo " ERRORE — RIPRISTINO AUTOMATICO"
  echo "======================================================"

  cd "$HOME" || exit 1
  rm -rf "$PROJECT"
  cp -a "$CHECKPOINT" "$PROJECT"

  echo "Ripristino completato:"
  echo "$CHECKPOINT"
  exit 1
}

run_step() {
  "$@" || rollback
}

echo "[2/9] Verifico i file principali..."

for f in \
  src/App.tsx \
  src/components/Sidebar.tsx \
  src/views/SettingsView.tsx \
  src/views/FastSaleModal.tsx \
  src/services/db.ts \
  src/types.ts
do
  test -f "$f" || {
    echo "ERRORE: file mancante: $f"
    rollback
  }
done

echo "[3/9] Creo copie locali di sicurezza..."

cp src/App.tsx "src/App.before-mega-$STAMP.tsx"
cp src/components/Sidebar.tsx "src/components/Sidebar.before-mega-$STAMP.tsx"
cp src/views/SettingsView.tsx "src/views/SettingsView.before-mega-$STAMP.tsx"
cp src/views/FastSaleModal.tsx "src/views/FastSaleModal.before-mega-$STAMP.tsx"

echo "[4/9] Correggo App.tsx..."

python3 <<'PY'
from pathlib import Path

p = Path("src/App.tsx")
s = p.read_text()

old = """      <FastSaleModal
        eyeglass={saleTargetEyeglass}
        onClose={() => setSaleTargetEyeglass(null)}
        onCompleted={() => setSaleTargetEyeglass(null)}
      />"""

new = """      <FastSaleModal
        isOpen={!!saleTargetEyeglass}
        preselectedEyeglass={saleTargetEyeglass}
        onClose={() => setSaleTargetEyeglass(null)}
        onSaleSuccess={() => {
          setSaleTargetEyeglass(null);
          setSelectedEyeglass(null);
        }}
      />"""

if old in s:
    s = s.replace(old, new)
else:
    print("Nota: blocco FastSaleModal già diverso; non modificato.")

old_sidebar = """          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />"""

new_sidebar = """          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
            onOpenAddProduct={() => setIsAddProductOpen(true)}
            onOpenFastSale={() => setSaleTargetEyeglass(null)}
          />"""

if old_sidebar in s:
    s = s.replace(old_sidebar, new_sidebar)
else:
    print("Nota: blocco Sidebar già diverso; non modificato.")

p.write_text(s)
PY

echo "[5/9] Correggo Sidebar..."

python3 <<'PY'
from pathlib import Path

p = Path("src/components/Sidebar.tsx")
s = p.read_text()

old_interface = """interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
}"""

new_interface = """interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenAddProduct?: () => void;
  onOpenFastSale?: () => void;
}"""

if old_interface in s:
    s = s.replace(old_interface, new_interface)

old_destructure = """  activeView,
  onNavigate,
}) => {"""

new_destructure = """  activeView,
  onNavigate,
  onOpenAddProduct,
  onOpenFastSale,
}) => {"""

if old_destructure in s:
    s = s.replace(old_destructure, new_destructure)

# Venduti e storico devono usare la route reale "sales".
s = s.replace(
    "id: 'sales-history',\n                label: 'Venduti'",
    "id: 'sales',\n                label: 'Venduti'"
)

s = s.replace(
    "id: 'sales-history',\n                label: 'Storico vendite'",
    "id: 'sales',\n                label: 'Storico vendite'"
)

# Nuovo paziente porta all'archivio pazienti.
s = s.replace(
    "id: 'add-client', label: 'Nuovo paziente'",
    "id: 'clients', label: 'Nuovo paziente'"
)

# Render item: modal per vendita rapida e aggiunta prodotto.
old_click = """onClick={() => handleItemClick(item.id)}"""

new_click = """onClick={() => {
          if (item.id === 'add-product') {
            onOpenAddProduct?.();
            onClose();
            return;
          }

          if (item.id === 'fast-sale') {
            onOpenFastSale?.();
            onClose();
            return;
          }

          if (item.id === 'flutter-export') {
            onNavigate('flutter');
            onClose();
            return;
          }

          handleItemClick(item.id);
        }}"""

if old_click in s:
    s = s.replace(old_click, new_click, 1)

# Anche il pulsante "Nuova vendita rapida" superiore deve usare il callback.
old_quick = "onClick={() => handleItemClick('fast-sale')}"
new_quick = """onClick={() => {
              onOpenFastSale?.();
              onClose();
            }}"""

if old_quick in s:
    s = s.replace(old_quick, new_quick)

p.write_text(s)
PY

echo "[6/9] Sistemo il tipo CustomCategory..."

python3 <<'PY'
from pathlib import Path

p = Path("src/services/db.ts")
s = p.read_text()

s = s.replace(
    "public getCustomCategories(): AppSettings extends never ? never : import('../types').CustomCategory[] {",
    "public getCustomCategories(): import('../types').CustomCategory[] {"
)

p.write_text(s)
PY

echo "[7/9] Verifico TypeScript e struttura..."

grep -n "interface SidebarProps" src/components/Sidebar.tsx
grep -n "FastSaleModal" src/App.tsx | tail -n 5
grep -n "getCustomCategories" src/services/db.ts

echo "[8/9] Eseguo LINT..."

if ! npm run lint; then
  rollback
fi

echo "[9/9] Eseguo BUILD..."

if ! npm run build; then
  rollback
fi

echo
echo "======================================================"
echo " MEGA SCRIPT COMPLETATO"
echo "======================================================"
echo
echo "LINT : OK"
echo "BUILD: OK"
echo
echo "Checkpoint:"
echo "$CHECKPOINT"
echo
echo "Il progetto NON è stato ripristinato."
echo

import os
import sys
import glob
import zipfile
import subprocess
from datetime import datetime

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKUPS_DIR = os.path.join(PROJECT_ROOT, ".backups")
MAX_BACKUPS = 5

def create_backup():
    if not os.path.exists(BACKUPS_DIR):
        os.makedirs(BACKUPS_DIR)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"inventario_backup_{timestamp}.zip"
    backup_filepath = os.path.join(BACKUPS_DIR, backup_filename)

    print(f"📦 Creazione backup in locale: {backup_filename}...")

    exclude_dirs = {".git", "node_modules", "dist", ".backups", ".idea"}

    with zipfile.ZipFile(backup_filepath, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(PROJECT_ROOT):
            # Exclude specified folders
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            for file in files:
                if file.endswith(".zip") or file == "backup_and_sync.py.log":
                    continue
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, PROJECT_ROOT)
                zipf.write(abs_path, rel_path)

    print(f"✅ Backup creato con successo: {backup_filepath}")

    # Maintain strictly the last 5 backups
    cleanup_old_backups()
    return backup_filepath

def cleanup_old_backups():
    backups = sorted(
        glob.glob(os.path.join(BACKUPS_DIR, "inventario_backup_*.zip")),
        key=os.path.getmtime
    )

    while len(backups) > MAX_BACKUPS:
        oldest = backups.pop(0)
        try:
            os.remove(oldest)
            print(f"🗑️ Rimosso vecchio backup superato: {os.path.basename(oldest)}")
        except Exception as e:
            print(f"⚠️ Impossibile rimuovere {oldest}: {e}")

def git_sync():
    print("🚀 Sincronizzazione con GitHub in corso...")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Add changes
    subprocess.run(["git", "add", "-A"], cwd=PROJECT_ROOT, check=True)

    # Commit
    commit_msg = f"Auto-backup & sync: {timestamp}"
    res = subprocess.run(["git", "commit", "-m", commit_msg], cwd=PROJECT_ROOT, capture_output=True, text=True)
    if "nothing to commit" in res.stdout or "nothing to commit" in res.stderr:
        print("ℹ️ Nessuna nuova modifica da committare su Git.")
    else:
        print(f"📝 Commit creato: {commit_msg}")

    # Pull remote changes first
    subprocess.run(["git", "pull", "origin", "main", "--rebase"], cwd=PROJECT_ROOT, capture_output=True)

    # Push to GitHub
    push_res = subprocess.run(["git", "push", "origin", "main"], cwd=PROJECT_ROOT, capture_output=True, text=True)
    if push_res.returncode == 0:
        print("🌐 Push completato con successo su GitHub (origin/main)!")
    else:
        print(f"❌ Errore durante il push su GitHub:\n{push_res.stderr}")

if __name__ == "__main__":
    create_backup()
    git_sync()

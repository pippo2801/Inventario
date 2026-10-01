import re
import subprocess
import os

gradle_path = 'app/build.gradle'

with open(gradle_path, 'r') as f:
    content = f.read()

# Incrementa versionCode
match_code = re.search(r'versionCode\s+(\d+)', content)
if match_code:
    old_code = int(match_code.group(1))
    new_code = old_code + 1
    content = content.replace(f'versionCode {old_code}', f'versionCode {new_code}')
    print(f"Auto-incremento versionCode: {old_code} -> {new_code}")

major = 1
minor = new_code - 1
new_version_name = f'"{major}.{minor}"'
content = re.sub(r'versionName\s+"[^"]+"', f'versionName {new_version_name}', content)
print(f"Nuovo versionName impostato a: {major}.{minor}")

with open(gradle_path, 'w') as f:
    f.write(content)

# Esegue clean e assembleDebug per evitare problemi di risorse aapt2
print("Pulizia e avvio della compilazione APK...")
result = subprocess.run(['./gradlew', 'clean', 'assembleDebug'])

if result.returncode == 0:
    # Percorso assoluto corretto per la cartella Download di Android
    home_dir = os.path.expanduser('~')
    dest_path = f"{home_dir}/storage/shared/Download/studio-ottico-v{major}.{minor}.apk"
    
    src_apk = 'app/build/outputs/apk/debug/app-debug.apk'
    subprocess.run(['cp', src_apk, dest_path])
    print(f"\nCOMPILAZIONE RIUSCITA! APK salvato in Download come: studio-ottico-v{major}.{minor}.apk")
else:
    print("\nErrore durante la compilazione.")

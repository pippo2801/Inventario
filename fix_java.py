import re

gradle_path = "android/capacitor-android/build.gradle"
try:
    with open(gradle_path, "r") as f:
        content = f.read()
    
    content = re.sub(r'JavaVersion\.VERSION_21', 'JavaVersion.VERSION_17', content)
    content = re.sub(r"'21'", "'17'", content)
    content = re.sub(r'"21"', '"17"', content)
    
    with open(gradle_path, "w") as f:
        f.write(content)
    print("Aggiornato build.gradle di capacitor-android con successo!")
except Exception as e:
    print(f"Errore durante la patch: {e}")

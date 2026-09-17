import os
import re

for root, dirs, files in os.walk("."):
    # Salva le cartelle di git o build pesanti inutili
    if ".git" in root or "node_modules/.cache" in root:
        continue
    for file in files:
        if file.endswith(".gradle"):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = content
                new_content = re.sub(r'JavaVersion\.VERSION_21', 'JavaVersion.VERSION_17', new_content)
                new_content = re.sub(r'sourceCompatibility\s*=\s*1\.21', 'sourceCompatibility = JavaVersion.VERSION_17', new_content)
                new_content = re.sub(r'targetCompatibility\s*=\s*1\.21', 'targetCompatibility = JavaVersion.VERSION_17', new_content)
                new_content = re.sub(r"([sS]ourceCompatibility\s*=\s*)['\"]21['\"]", r"\1JavaVersion.VERSION_17", new_content)
                new_content = re.sub(r"([tT]argetCompatibility\s*=\s*)['\"]21['\"]", r"\1JavaVersion.VERSION_17", new_content)
                new_content = re.sub(r"(['\"]?)21(['\"]?)", lambda m: "'17'" if m.group(1) or m.group(2) else "17", new_content) if "sourceCompatibility" in new_content or "targetCompatibility" in new_content or "compileSdkVersion" not in new_content else new_content
                
                # Sostituzioni mirate più sicure per gradle
                new_content = new_content.replace("JavaVersion.VERSION_21", "JavaVersion.VERSION_17")
                new_content = new_content.replace("'21'", "'17'")
                new_content = new_content.replace('"21"', '"17"')

                if new_content != content:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Aggiornato file gradle: {path}")
            except Exception as e:
                pass

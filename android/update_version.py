import re

with open('app/build.gradle', 'r') as f:
    content = f.read()

content = re.sub(r'versionCode\s+\d+', 'versionCode 2', content)
content = re.sub(r'versionName\s+"[^"]+"', 'versionName "1.1"', content)

with open('app/build.gradle', 'w') as f:
    f.write(content)
print("Versione aggiornata a 1.1 (Code 2) con successo!")

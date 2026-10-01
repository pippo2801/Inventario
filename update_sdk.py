with open('android/app/build.gradle', 'r') as f:
    content = f.read()

# Sostituiamo compileSdk ed eventuale targetSdk da 34 a 35
content = content.replace("compileSdk 34", "compileSdk 35")
content = content.replace("targetSdkVersion 34", "targetSdkVersion 35")
content = content.replace("compileSdkVersion 34", "compileSdkVersion 35")

with open('android/app/build.gradle', 'w') as f:
    f.write(content)

print("build.gradle di Android aggiornato a SDK 35.")

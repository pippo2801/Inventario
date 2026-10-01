with open('build.gradle', 'r') as f:
    content = f.read()

subproject_fix = """
subprojects {
    afterEvaluate { project ->
        if (project.hasProperty("android")) {
            project.android {
                compileSdkVersion 34
                defaultConfig {
                    minSdkVersion 22
                    targetSdkVersion 34
                }
                compileOptions {
                    sourceCompatibility JavaVersion.VERSION_17
                    targetCompatibility JavaVersion.VERSION_17
                }
            }
        }
    }
}
"""

if "subprojects {" not in content:
    content += subproject_fix
else:
    # Sostituiamo o aggiungiamo la configurazione pulita dei subprojects
    start = content.find("subprojects {")
    # Troviamo la chiusura approssimativa o sovrascriviamo in coda
    content = content + "\n" + subproject_fix

with open('build.gradle', 'w') as f:
    f.write(content)

print("build.gradle patchato con successo.")

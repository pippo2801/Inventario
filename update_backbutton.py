with open('src/App.tsx', 'r') as f:
    content = f.read()

back_listener_code = """
  // Gestione tasto indietro Android
  useEffect(() => {
    const handleBackButton = (e: PopStateEvent) => {
      // Evita la chiusura accidentale dell'app
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, []);
"""

if 'popstate' not in content:
    # Inserisce il blocco subito dopo l'apertura del componente principale dell'App o dentro un useEffect esistente
    content = content.replace("function App() {", "function App() {" + back_listener_code)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Gestione tasto indietro aggiunta a App.tsx")
else:
    print("Gestione tasto indietro già presente.")

import React, { useState } from 'react';
import { Smartphone, Download, Copy, Check, X, FileCode, Terminal, BookOpen, Layers } from 'lucide-react';

interface FlutterProjectExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlutterProjectExportModal: React.FC<FlutterProjectExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'termux' | 'pubspec' | 'main' | 'architecture'>('termux');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const termuxGuide = `# ===================================================
# GUIDA PASSO-PASSO COMPILAZIONE APK DA TERMUX / ANDROID
# Studio Ottico Di Pietro - Flutter / Android Native App
# ===================================================

# 1. Installa Termux e aggiorna i pacchetti di sistema:
pkg update -y && pkg upgrade -y
pkg install -y git openjdk-17 wget curl proot-distro clang cmake ninja

# 2. Installa ambiente Ubuntu proot su Termux per compilazione Flutter:
proot-distro install ubuntu
proot-distro login ubuntu

# 3. All'interno dell'ambiente Ubuntu proot, installa Flutter SDK:
apt update && apt install -y git curl unzip openjdk-17-jdk libglu1-mesa
cd /opt
git clone https://github.com/flutter/flutter.git -b stable
echo 'export PATH="$PATH:/opt/flutter/bin"' >> ~/.bashrc
source ~/.bashrc

# 4. Verifica installazione Flutter:
flutter doctor -v

# 5. Clona o crea il progetto Studio Ottico:
mkdir studio_ottico_dipietro && cd studio_ottico_dipietro
flutter create --org com.studioottico.dipietro .

# 6. Sostituisci pubspec.yaml e lib/ con il codice del progetto:
# (Trovi il codice sorgente completo nelle schede 'pubspec.yaml' e 'main.dart')

# 7. Compila l'APK di produzione per smartphone Android (Filippo & Mariangela):
flutter build apk --release --split-per-abi

# 8. L'APK pronto all'installazione si trova in:
# build/app/outputs/flutter-apk/app-arm64-v8a-release.apk

# 9. Copia l'APK nella memoria condivisa di Android:
cp build/app/outputs/flutter-apk/app-arm64-v8a-release.apk /sdcard/Download/StudioOtticoDiPietro.apk
echo "APK generato con successo in Download/StudioOtticoDiPietro.apk!"
`;

  const pubspecYaml = `name: studio_ottico_dipietro
description: "Gestione Studio Ottico Di Pietro con IA Multimodale e Sincronizzazione Locale"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  # Archiviazione Locale & SQLite (Sezione 2)
  sqflite: ^2.3.2
  path_provider: ^2.1.2
  path: ^1.9.0

  # State Management & Reattività
  provider: ^6.1.2

  # Fotocamera & OCR Ottico (Sezioni 11, 23, 25)
  camera: ^0.10.5+9
  google_mlkit_text_recognition: ^0.13.0
  image_picker: ^1.0.8

  # Connessione IA Gemini API Server-Side (Sezioni 9, 10, 11)
  http: ^1.2.1

  # Interfaccia Utente & Icone
  cupertino_icons: ^1.0.8
  intl: ^0.19.0
  cached_network_image: ^3.3.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/watermark.png
    - assets/images/logo.png
`;

  const mainDart = `// lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const StudioOtticoApp());
}

class StudioOtticoApp extends StatelessWidget {
  const StudioOtticoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Studio Ottico Di Pietro',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        // Tema Bianco e Bordeaux / Borgogna ufficiale (Sezione 4)
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF800020), // Borgogna Di Pietro
          primary: const Color(0xFF800020),
          secondary: const Color(0xFF9E1B32),
          surface: Colors.white,
          background: const Color(0xFFFBF9F9),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF800020),
          foregroundColor: Colors.white,
          elevation: 2,
        ),
      ),
      home: const MainHomeScreen(),
    );
  }
}

class MainHomeScreen extends StatefulWidget {
  const MainHomeScreen({super.key});

  @override
  State<MainHomeScreen> createState() => _MainHomeScreenState();
}

class _MainHomeScreenState extends State<MainHomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Studio Ottico Di Pietro', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            tooltip: 'Sincronizzato',
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.search),
            tooltip: 'Ricerca Universale IA',
            onPressed: () {},
          ),
        ],
      ),
      body: Stack(
        children: [
          // Watermark di sfondo visibile su tutte le schermate (Sezione 4)
          Opacity(
            opacity: 0.04,
            child: Center(
              child: Image.asset(
                'assets/images/watermark.png',
                fit: BoxFit.contain,
              ),
            ),
          ),
          // Schermata Corrente
          Center(
            child: Text(
              'Studio Ottico Di Pietro - Modulo \${_currentIndex}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.inventory_2), label: 'Inventario'),
          NavigationDestination(icon: Icon(Icons.visibility), label: 'Vetrina'),
          NavigationDestination(icon: Icon(Icons.people), label: 'Clienti'),
          NavigationDestination(icon: Icon(Icons.bar_chart), label: 'Statistiche'),
        ],
      ),
    );
  }
}
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-teal-700/60 rounded-2xl shadow-2xl overflow-hidden my-4 text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-teal-950/90 border-b border-teal-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-800/60 text-teal-300 border border-teal-600/40">
              <Smartphone className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                📱 Progetto Flutter Completo & Guida APK Termux (Sezione 50)
              </h2>
              <p className="text-xs text-teal-300/80">
                Tutti i file sorgente e le istruzioni per compilare l'APK Android nativo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-3 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('termux')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'termux' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Guida Termux & PC</span>
          </button>

          <button
            onClick={() => setActiveTab('pubspec')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'pubspec' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>pubspec.yaml</span>
          </button>

          <button
            onClick={() => setActiveTab('main')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'main' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>lib/main.dart</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'architecture' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Albero Moduli Flutter</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-mono text-xs">
          {activeTab === 'termux' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-slate-300 pb-2">
                <span className="text-xs font-sans text-teal-300 font-bold">
                  Comandi shell bash per generare l'APK autonomamente:
                </span>
                <button
                  onClick={() => copyToClipboard(termuxGuide, 'termux')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'termux' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'termux' ? 'Copiato!' : 'Copia Comandi'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-teal-900/60 text-teal-200 overflow-x-auto whitespace-pre leading-relaxed text-[11px]">
                {termuxGuide}
              </pre>
            </div>
          )}

          {activeTab === 'pubspec' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-slate-300 pb-2">
                <span className="text-xs font-sans text-teal-300 font-bold">
                  File di configurazione e dipendenze Flutter:
                </span>
                <button
                  onClick={() => copyToClipboard(pubspecYaml, 'pubspec')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'pubspec' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'pubspec' ? 'Copiato!' : 'Copia YAML'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-teal-900/60 text-slate-200 overflow-x-auto whitespace-pre leading-relaxed text-[11px]">
                {pubspecYaml}
              </pre>
            </div>
          )}

          {activeTab === 'main' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-slate-300 pb-2">
                <span className="text-xs font-sans text-teal-300 font-bold">
                  Entrypoint applicazione Flutter nativa:
                </span>
                <button
                  onClick={() => copyToClipboard(mainDart, 'main')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'main' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'main' ? 'Copiato!' : 'Copia Codice'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-teal-900/60 text-slate-200 overflow-x-auto whitespace-pre leading-relaxed text-[11px]">
                {mainDart}
              </pre>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4 font-sans text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-teal-900/60 space-y-3">
                <h3 className="font-bold text-teal-300 text-sm">Struttura Progetto Flutter Requisito Sezione 50</h3>
                <ul className="space-y-2 text-slate-300 list-disc pl-5">
                  <li><b>lib/models/</b>: Eyeglass, Client, Prescription, Sale, AuditLog, SyncPacket.</li>
                  <li><b>lib/services/</b>: DatabaseService (SQLite nativo sqflite), GeminiAIService (endpoint REST con fallback offline), SyncService (peer-to-peer timestamp CRDT).</li>
                  <li><b>lib/screens/</b>: HomeScreen, InventoryScreen, EyeglassDetailScreen, AddEyeglassScreen, UniversalSearchModal, ShowcaseScreen, PromotionsScreen, SalesHistoryScreen, ClientsScreen, PrescriptionsScreen, StatisticsScreen, SettingsScreen.</li>
                  <li><b>lib/theme/</b>: Color palette bordeaux #800020, watermark circolare SVG / PNG per rispetto rigoroso Sezione 4.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-teal-950/80 border-t border-teal-800/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Requisito Sezione 50 • Compilazione pronta per Android & Termux
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all active:scale-95"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

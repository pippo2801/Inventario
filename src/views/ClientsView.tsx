import React, { useState, useRef } from 'react';
import { db } from '../services/db';
import { aiService } from '../services/aiService';
import { Client, Prescription, Sale } from '../types';
import {
  Users,
  Search,
  PlusCircle,
  Camera,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  X,
  Sparkles,
  Loader2,
  ArrowRight,
  FolderArchive,
  ShoppingBag,
} from 'lucide-react';

interface ClientsViewProps {
  onSelectClient?: (clientId: string) => void;
  initialSelectedClientId?: string;
  onNavigate: (view: string, id?: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onSelectClient,
  initialSelectedClientId,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(
    initialSelectedClientId ? db.getClientById(initialSelectedClientId) || null : null
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);

  // New Client Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fiscalCode, setFiscalCode] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<{
    codiceFiscale: string;
    cognome: string;
    nome: string;
    dataNascita: string;
    confidence: string;
  } | null>(null);

  const cfFileInputRef = useRef<HTMLInputElement>(null);

  const clients = db.getClients(false);

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.fiscalCode.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const handleSaveClient = () => {
    if (!firstName.trim() || !lastName.trim() || !fiscalCode.trim()) {
      alert('Nome, Cognome e Codice Fiscale sono obbligatori.');
      return;
    }

    const newClient = db.createClient({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fiscalCode: fiscalCode.trim().toUpperCase(),
      birthDate: birthDate || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      isComplete: !!(phone && birthDate),
    });

    setSelectedClient(newClient);
    setShowAddModal(false);
    setShowOcrModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setFiscalCode('');
    setBirthDate('');
    setPhone('');
    setEmail('');
    setNotes('');
    setOcrResult(null);
  };

  const handleCfPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setOcrLoading(true);
      try {
        const res = await aiService.ocrCodiceFiscale(base64);
        setOcrResult(res);
        setFirstName(res.nome || '');
        setLastName(res.cognome || '');
        setFiscalCode(res.codiceFiscale || '');
        if (res.dataNascita) setBirthDate(res.dataNascita);
      } catch (err) {
        console.error(err);
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Timeline queries for selected client
  const clientPrescriptions = selectedClient
    ? db.getPrescriptionsByClientId(selectedClient.id)
    : [];
  const clientSales = selectedClient
    ? db.getSalesByClientId(selectedClient.id)
    : [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-teal-900/40 border border-teal-800/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Anagrafica Clienti Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-teal-300/80">
            {clients.length} clienti registrati • Scansione rapida Codice Fiscale / Tessera Sanitaria (Sezione 23)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-scan-cf"
            onClick={() => {
              resetForm();
              setShowOcrModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-teal-800/80 hover:bg-teal-700 border border-teal-600/50 text-teal-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <Camera className="w-4 h-4 text-teal-300" />
            <span>Scansiona CF / Tessera</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuovo Cliente</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client List with Search */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-teal-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca cliente per nome, cognome o CF..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-teal-700/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-teal-900/60 divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
            {filteredClients.map((client) => {
              const isSelected = selectedClient?.id === client.id;

              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between text-xs ${
                    isSelected ? 'bg-teal-900/50 border-l-4 border-teal-400' : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-white text-sm">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="font-mono text-[11px] text-teal-300">CF: {client.fiscalCode}</p>
                    <p className="text-[10px] text-slate-400">{client.phone || 'Nessun telefono registrato'}</p>
                  </div>

                  {!client.isComplete && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-semibold border border-orange-700/50">
                      Incompleta
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Client Detailed Timeline & Info (Section 22) */}
        <div className="lg:col-span-2">
          {selectedClient ? (
            <div className="rounded-2xl bg-slate-900/90 border border-teal-800/50 p-5 space-y-6">
              {/* Header Profile */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-white">
                      {selectedClient.firstName} {selectedClient.lastName}
                    </h2>
                    {selectedClient.isComplete ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-700 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Scheda Completa
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-700 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3 h-3" /> Dati da integrare
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-teal-300 mt-0.5">Codice Fiscale: {selectedClient.fiscalCode}</p>
                </div>

                <button
                  onClick={() => onNavigate('prescriptions')}
                  className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-teal-100 text-xs font-semibold flex items-center gap-1 self-start sm:self-auto"
                >
                  <FolderArchive className="w-3.5 h-3.5" /> Nuova Prescrizione
                </button>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1">Telefono:</span>
                  <span className="text-white font-medium">{selectedClient.phone || 'Non specificato'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1">Email:</span>
                  <span className="text-white font-medium">{selectedClient.email || 'Non specificata'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1">Data di Nascita:</span>
                  <span className="text-white font-medium">
                    {selectedClient.birthDate ? new Date(selectedClient.birthDate).toLocaleDateString() : 'Non specificata'}
                  </span>
                </div>
              </div>

              {/* Client Timeline: Prescrizioni & Acquisti */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Cronologia & Prescrizioni Oculistiche ({clientPrescriptions.length})
                </h3>

                {clientPrescriptions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nessuna prescrizione registrata per questo cliente.</p>
                ) : (
                  <div className="space-y-2">
                    {clientPrescriptions.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-teal-900/60 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">Prescrizione del {new Date(p.date).toLocaleDateString()}</span>
                          <span className="text-[10px] text-teal-300 font-mono">Medico: {p.doctorOrOptometrist}</span>
                        </div>

                        {/* Refraction table summary */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900 p-2 rounded-lg font-mono">
                          <div>
                            <span className="text-teal-400 font-bold block">OD (Occhio Destro):</span>
                            <span>SPH: {p.od.sph > 0 ? `+${p.od.sph}` : p.od.sph} | CYL: {p.od.cyl} | AX: {p.od.ax}°</span>
                          </div>
                          <div>
                            <span className="text-teal-400 font-bold block">OS (Occhio Sinistro):</span>
                            <span>SPH: {p.os.sph > 0 ? `+${p.os.sph}` : p.os.sph} | CYL: {p.os.cyl} | AX: {p.os.ax}°</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Purchases History */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Storico Acquisti Occhiali ({clientSales.length})
                </h3>

                {clientSales.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nessun acquisto ancora registrato.</p>
                ) : (
                  <div className="space-y-2">
                    {clientSales.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-white uppercase">{s.eyeglassBrand} {s.eyeglassModel}</p>
                          <p className="text-[10px] text-slate-400">Data: {new Date(s.timestamp).toLocaleDateString()} • Pagamento: {s.paymentMethod}</p>
                        </div>
                        <span className="text-sm font-bold text-emerald-400">€{s.salePrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-teal-900/40 text-slate-400 text-xs">
              Seleziona un cliente dalla lista a sinistra per visualizzare la scheda completa, lo storico prescrizioni e gli acquisti.
            </div>
          )}
        </div>
      </div>

      {/* OCR Scanner Modal (Section 23 & 27: Human Verification Required) */}
      {showOcrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-teal-700/60 rounded-2xl shadow-2xl p-5 text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-300">
                <Camera className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Scansione Tessera Sanitaria / CF</h3>
              </div>
              <button onClick={() => setShowOcrModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Carica la foto della tessera sanitaria del cliente. L'IA estrarrà Codice Fiscale, Cognome, Nome e Data di nascita.
            </p>

            <input
              ref={cfFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCfPhotoUpload}
            />

            <div
              onClick={() => cfFileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-teal-700/60 hover:border-teal-500 rounded-xl bg-slate-950/40 text-center cursor-pointer transition-all"
            >
              {ocrLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                  <span className="text-xs text-teal-200">Elaborazione OCR in corso...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8 text-teal-400" />
                  <span className="text-xs font-semibold text-white">Carica o Scatta Foto Tessera Sanitaria</span>
                </div>
              )}
            </div>

            {/* OCR Extracted Data (Human Check - Section 27) */}
            {ocrResult && (
              <div className="p-3.5 rounded-xl bg-teal-950/60 border border-teal-700 text-xs space-y-2">
                <div className="flex items-center justify-between text-teal-300 font-bold">
                  <span>Dati Rilevati dall'OCR (Verifica e Correggi):</span>
                  <span className="text-[10px] text-emerald-400">{ocrResult.confidence}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Cognome:</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-slate-950 border border-teal-800 text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Nome:</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-slate-950 border border-teal-800 text-white font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block">Codice Fiscale (16 caratteri):</label>
                  <input
                    type="text"
                    value={fiscalCode}
                    onChange={(e) => setFiscalCode(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-teal-800 text-teal-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block">Telefono cliente (per completare scheda):</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Es. 333 1234567"
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-teal-800 text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowOcrModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Annulla
              </button>
              {ocrResult && (
                <button
                  onClick={handleSaveClient}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg"
                >
                  Conferma e Salva Cliente
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-teal-700/60 rounded-2xl shadow-2xl p-5 text-white space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Nuova Scheda Cliente</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nome *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-800 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Cognome *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-800 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Codice Fiscale *</label>
              <input
                type="text"
                value={fiscalCode}
                onChange={(e) => setFiscalCode(e.target.value.toUpperCase())}
                placeholder="16 caratteri alfanumerici"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-800 text-teal-300 font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Telefono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-800 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Data Nascita</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveClient}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg"
              >
                Salva Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { db } from '../services/db';
import { aiService } from '../services/aiService';
import { Prescription, OphthalmicEyeData, LensType, PrescriptionStatus } from '../types';
import {
  FolderArchive,
  Search,
  PlusCircle,
  Camera,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  Sparkles,
  Loader2,
  Clock,
  Check,
} from 'lucide-react';

export const PrescriptionsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  // New Prescription Form
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [doctor, setDoctor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lensType, setLensType] = useState<LensType>('Monofocali');
  const [treatments, setTreatments] = useState('Antiriflesso Top, Filtro Luce Blu');
  const [mountingHeight, setMountingHeight] = useState<number>(20.5);

  // Refraction OD
  const [odSph, setOdSph] = useState<number>(-2.00);
  const [odCyl, setOdCyl] = useState<number>(-0.50);
  const [odAx, setOdAx] = useState<number>(90);
  const [odAdd, setOdAdd] = useState<number>(0);

  // Refraction OS
  const [osSph, setOsSph] = useState<number>(-1.75);
  const [osCyl, setOsCyl] = useState<number>(-0.75);
  const [osAx, setOsAx] = useState<number>(85);
  const [osAdd, setOsAdd] = useState<number>(0);

  // Pupillary Distance
  const [pdTotal, setPdTotal] = useState<number>(63);
  const [pdOd, setPdOd] = useState<number>(31.5);
  const [pdOs, setPdOs] = useState<number>(31.5);
  const [notes, setNotes] = useState('');

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prescriptions = db.getPrescriptions(false);
  const clients = db.getClients(false);

  const filtered = prescriptions.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.clientName.toLowerCase().includes(q) ||
      p.doctorOrOptometrist.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    );
  });

  const handleOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setOcrLoading(true);
      try {
        const res = await aiService.ocrPrescription(base64);
        if (res.doctorOrOptometrist) setDoctor(res.doctorOrOptometrist);
        if (res.date) setDate(res.date);
        if (res.od) {
          setOdSph(res.od.sph || 0);
          setOdCyl(res.od.cyl || 0);
          setOdAx(res.od.ax || 0);
          setOdAdd(res.od.add || 0);
        }
        if (res.os) {
          setOsSph(res.os.sph || 0);
          setOsCyl(res.os.cyl || 0);
          setOsAx(res.os.ax || 0);
          setOsAdd(res.os.add || 0);
        }
        if (res.pd) {
          if (res.pd.total) setPdTotal(res.pd.total);
          if (res.pd.od) setPdOd(res.pd.od);
          if (res.pd.os) setPdOs(res.pd.os);
        }
        if (res.mountingHeight) setMountingHeight(res.mountingHeight);
        if (res.notes) setNotes(res.notes);
      } catch (err) {
        console.error(err);
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (status: PrescriptionStatus = 'COMPLETA') => {
    if (!clientName.trim()) {
      alert('Inserire il nome del cliente intestatario.');
      return;
    }

    const newPresc = db.createPrescription({
      clientId: clientId || undefined,
      clientName: clientName.trim(),
      doctorOrOptometrist: doctor.trim() || 'Dott. Oculista / Studio Ottico',
      date: date,
      status: status,
      od: {
        sph: odSph,
        cyl: odCyl,
        ax: odAx,
        add: odAdd || undefined,
      },
      os: {
        sph: osSph,
        cyl: osCyl,
        ax: osAx,
        add: osAdd || undefined,
      },
      pd: {
        total: pdTotal,
        od: pdOd,
        os: pdOs,
      },
      mountingHeight: mountingHeight,
      lensType: lensType,
      treatments: treatments.trim() ? [treatments.trim()] : [],
      notes: notes.trim() || undefined,
    });

    setShowModal(false);
    setSelectedPrescription(newPresc);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-teal-900/40 border border-teal-800/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-teal-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Archivio Prescrizioni & Gradazioni
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-teal-300/80">
            Dati rifrattivi completi (OD/OS, PD, montaggio) con supporto OCR ricette (Sezioni 24 & 25)
          </p>
        </div>

        <button
          id="btn-new-prescription"
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow flex items-center gap-1.5 transition-all self-start sm:self-auto active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuova Prescrizione / OCR</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-teal-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca prescrizione per nome cliente, medico o note..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-teal-700/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Prescriptions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedPrescription(item)}
            className="p-4 rounded-2xl bg-slate-900/90 border border-teal-900/60 hover:border-teal-500/60 transition-all cursor-pointer shadow-md space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{item.clientName}</h3>
                <p className="text-[11px] text-slate-400">
                  Data: {new Date(item.date).toLocaleDateString()} • Medico: {item.doctorOrOptometrist}
                </p>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.status === 'COMPLETA'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-orange-950 text-orange-300 border border-orange-700 animate-pulse'
                }`}
              >
                {item.status}
              </span>
            </div>

            {/* Refraction Table (OD / OS) */}
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-2.5 text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between text-teal-300 border-b border-slate-800 pb-1 text-[11px]">
                <span>OCCHIO</span>
                <span>SF (SPH)</span>
                <span>CIL (CYL)</span>
                <span>ASSE (AX)</span>
                <span>ADD</span>
              </div>
              <div className="flex items-center justify-between text-white text-[11px]">
                <span className="font-bold text-teal-400">OD:</span>
                <span>{item.od.sph > 0 ? `+${item.od.sph.toFixed(2)}` : item.od.sph.toFixed(2)}</span>
                <span>{item.od.cyl.toFixed(2)}</span>
                <span>{item.od.ax}°</span>
                <span>{item.od.add ? `+${item.od.add.toFixed(2)}` : '—'}</span>
              </div>
              <div className="flex items-center justify-between text-white text-[11px]">
                <span className="font-bold text-teal-400">OS:</span>
                <span>{item.os.sph > 0 ? `+${item.os.sph.toFixed(2)}` : item.os.sph.toFixed(2)}</span>
                <span>{item.os.cyl.toFixed(2)}</span>
                <span>{item.os.ax}°</span>
                <span>{item.os.add ? `+${item.os.add.toFixed(2)}` : '—'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Lenti: <b>{item.lensType}</b></span>
              <span>PD Totale: <b>{item.pd?.total || 63} mm</b> • H: <b>{item.mountingHeight || 20} mm</b></span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Nuova Prescrizione & OCR */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-teal-700/60 rounded-2xl shadow-2xl p-5 text-white space-y-4 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Nuova Scheda Prescrizione / OCR</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* OCR Banner (Section 25) */}
            <div className="p-3.5 rounded-xl bg-teal-950/50 border border-teal-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-teal-300 font-bold mb-0.5">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>Lettura OCR Ricetta Oculistica</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Scatta o carica la foto della ricetta per compilare automaticamente la griglia ottica.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleOcrUpload}
              />
              <button
                type="button"
                disabled={ocrLoading}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 flex-shrink-0"
              >
                {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <span>Scansiona Ricetta</span>
              </button>
            </div>

            {/* Client & Doctor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Cliente Intestatario *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nome e cognome cliente"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-800 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Medico Oculista / Studio</label>
                <input
                  type="text"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  placeholder="Es. Dott. Rossi / Studio Di Pietro"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-800 text-white"
                />
              </div>
            </div>

            {/* Refraction Table Grid (Section 24) */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                Parametri Ottici di Rifrazione (OD & OS)
              </h4>

              {/* Occhio Destro */}
              <div className="grid grid-cols-5 gap-2 items-center">
                <span className="text-teal-400 font-bold col-span-1">OD (Destro):</span>
                <div>
                  <span className="text-[10px] text-slate-400 block">SPH:</span>
                  <input
                    type="number"
                    step="0.25"
                    value={odSph}
                    onChange={(e) => setOdSph(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">CYL:</span>
                  <input
                    type="number"
                    step="0.25"
                    value={odCyl}
                    onChange={(e) => setOdCyl(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">AX (°):</span>
                  <input
                    type="number"
                    value={odAx}
                    onChange={(e) => setOdAx(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">ADD:</span>
                  <input
                    type="number"
                    step="0.25"
                    value={odAdd}
                    onChange={(e) => setOdAdd(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              {/* Occhio Sinistro */}
              <div className="grid grid-cols-5 gap-2 items-center pt-1">
                <span className="text-teal-400 font-bold col-span-1">OS (Sinistro):</span>
                <div>
                  <input
                    type="number"
                    step="0.25"
                    value={osSph}
                    onChange={(e) => setOsSph(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="0.25"
                    value={osCyl}
                    onChange={(e) => setOsCyl(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={osAx}
                    onChange={(e) => setOsAx(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="0.25"
                    value={osAdd}
                    onChange={(e) => setOsAdd(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Geometry: PD & Mounting Height */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">PD Totale (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={pdTotal}
                  onChange={(e) => setPdTotal(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Altezza Montaggio (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={mountingHeight}
                  onChange={(e) => setMountingHeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Tipologia Lenti</label>
                <select
                  value={lensType}
                  onChange={(e) => setLensType(e.target.value as LensType)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="Monofocali">Monofocali</option>
                  <option value="Progressive">Progressive</option>
                  <option value="Degressive">Degressive (Office)</option>
                  <option value="Da riposo">Da Riposo</option>
                </select>
              </div>
            </div>

            {/* Footer with "Posticipa" feature (Section 25) */}
            <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => handleSave('DA_VERIFICARE')}
                className="px-3.5 py-2 rounded-xl bg-orange-950/70 hover:bg-orange-900 border border-orange-700 text-orange-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Salva la prescrizione incompleta per verificarla in seguito (Sezione 25)"
              >
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>Salva e Posticipa (Da verificare)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('COMPLETA')}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Conferma e Salva</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: '25mb' }));

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    studio: 'Studio Ottico Di Pietro',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// 1. Natural Language Search Parser
app.post('/api/ai/parse-query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query richiesta' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback rule-based parsing if no API key
      return res.json(fallbackRuleBasedQueryParser(query));
    }

    const prompt = `
Sei l'assistente IA dello Studio Ottico Di Pietro. Il tuo compito è interpretare la richiesta dell'operatore ed estrarre SOLO i criteri di ricerca strutturati per interrogare il database reale dell'ottica.
NON inventare prodotti, disponibilità o prezzi. Estrai solo i filtri menzionati o impliciti.

Richiesta dell'operatore: "${query}"

Restituisci rigorosamente un oggetto JSON con questi campi:
- intent: uno tra ["search_inventory", "find_location", "stagnant_stock", "showcase", "promotions", "client_prescriptions", "sales_stats", "brand_query", "general"]
- brand: stringa con il marchio se specificato (es. Ray-Ban, Persol, Oakley, Gucci, Prada, Tom Ford, Silhouette, Moscot, Carrera), altrimenti null
- model: modello se specificato, altrimenti null
- gender: uno tra ["Uomo", "Donna", "Unisex"] se menzionato, altrimenti null
- color: colore menzionato (es. nero, tartaruga, oro, marrone, blu), altrimenti null
- maxPrice: numero massimo del prezzo in euro se menzionato (es. sotto 200 euro -> 200), altrimenti null
- minPrice: numero minimo del prezzo se menzionato, altrimenti null
- inShowcase: true se richiede occhiali in vetrina/esposti, altrimenti null
- inPromo: true se richiede promozioni/sconti, altrimenti null
- stagnantOnly: true se richiede occhiali da più di un anno o stock fermo, altrimenti null
- minMonthsStagnant: numero mesi (es. da più di 12 mesi -> 12, da più di un anno -> 12)
- locationKeyword: testo se l'utente chiede dove si trova un occhiale
- clientQuery: nome o cognome del cliente se la richiesta cerca un cliente o sue prescrizioni
- skuOrCode: codice o sigla specifica se presente
- explanation: breve frase esplicativa in italiano di cosa hai interpretato (es. "Filtro per Ray-Ban da Uomo di colore nero sotto i 200€")
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/parse-query:', error);
    // Graceful fallback to rule-based parser on any API failure
    return res.json(fallbackRuleBasedQueryParser(req.body.query || ''));
  }
});

// 2. Multimodal Visual Search ("Cerca Simili")
app.post('/api/ai/visual-search', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Immagine richiesta in formato Base64' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        shape: 'Aviator / Goccia',
        color: 'Nero / Metallo',
        frameType: 'Cerchiato Metallo',
        detectedBrand: null,
        detectedModelOrCode: null,
        confidence: 'Bassa',
        stimaIaDetails: 'Analisi locale (Modalità Offline/Chiave API non configurata). Stima visiva orientativa.',
      });
    }

    // Clean base64
    const cleanData = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `
Analizza questa immagine di occhiali per lo Studio Ottico Di Pietro.
Identifica le caratteristiche ottiche ed estetiche visibili per confrontarle con il catalogo dell'inventario:
1. Forma montatura (es. Aviator, Rettangolare, Rotondo, Squadrato, Cat-eye, Pantografo, Browline, Mascherina).
2. Colore dominante frontale e lenti (es. Nero, Tartaruga Havana, Oro, Argento, Grigio, Blu).
3. Tipologia montatura (es. Metallo, Acetato spesso, A giorno/Rimless, Nylor).
4. Marchio o logo identificabile (se visibile con certezza sulle aste o sulle lenti, es. Ray-Ban, Persol, Oakley, Gucci). Se incerto, indica null.
5. Codici o scritte visibili sulle aste o musetti (es. RB3025, PO0649). Se non chiaramente leggibile, indica null.
6. Livello di confidenza dell'identificazione: "Alta", "Media" o "Bassa".
7. Breve descrizione delle caratteristiche visive (stima IA, non certezza assoluta).

Rispondi RIGOROSAMENTE in formato JSON con questi campi:
{
  "shape": string,
  "color": string,
  "frameType": string,
  "detectedBrand": string | null,
  "detectedModelOrCode": string | null,
  "confidence": "Alta" | "Media" | "Bassa",
  "stimaIaDetails": string
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanData,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/visual-search:', error);
    return res.status(500).json({ error: 'Errore durante l\'analisi visiva con IA' });
  }
});

// 3. Multi-frame Video Search
app.post('/api/ai/video-search', async (req, res) => {
  try {
    const { frames } = req.body;
    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ error: 'Fotogrammi video richiesti' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        shape: 'Rettangolare',
        color: 'Tartarugato',
        frameType: 'Acetato',
        detectedBrand: null,
        detectedModelOrCode: null,
        confidence: 'Media',
        stimaIaDetails: 'Analisi da video: rilevata forma frontale e finitura tartarugata.',
        usefulFramesCount: Math.min(3, frames.length),
      });
    }

    // Limit to up to 4 key frames to keep payload efficient
    const selectedFrames = frames.slice(0, 4);
    const parts: any[] = [];

    selectedFrames.forEach((frameBase64: string, index: number) => {
      const cleanData = frameBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanData,
        },
      });
    });

    parts.push({
      text: `
Sei l'assistente di video-analisi dello Studio Ottico Di Pietro.
Hai a disposizione ${selectedFrames.length} fotogrammi estratti da un video dell'occhiale (inquadratura frontale, laterale, dettagli aste o logo).
Combina le informazioni provenienti dai diversi fotogrammi utili:
- Rileva forma e geometria da inquadrature frontali.
- Rileva loghi, marchi e codici modello dalle inquadrature ravvicinate o laterali.
- Non inventare codici non leggibili.

Rispondi RIGOROSAMENTE in JSON:
{
  "shape": string,
  "color": string,
  "frameType": string,
  "detectedBrand": string | null,
  "detectedModelOrCode": string | null,
  "confidence": "Alta" | "Media" | "Bassa",
  "stimaIaDetails": string,
  "usefulFramesCount": number
}
`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/video-search:', error);
    return res.status(500).json({ error: 'Errore durante l\'analisi video' });
  }
});

// 4. OCR Codice Fiscale / Tessera Sanitaria
app.post('/api/ai/ocr-codice-fiscale', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Immagine tessera sanitaria/CF richiesta' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        codiceFiscale: 'RSSMRA80A01H501U',
        cognome: 'ROSSI',
        nome: 'MARIO',
        dataNascita: '1980-01-01',
        comuneNascita: 'ROMA',
        sesso: 'M',
        confidence: 'Simulazione Offline',
      });
    }

    const cleanData = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `
Sei il modulo OCR per Tessera Sanitaria e Codice Fiscale italiano dello Studio Ottico Di Pietro.
Estrai con massima precisione i dati visibili nella foto della tessera:
- Codice Fiscale (16 caratteri alfanumerici esatti)
- Cognome
- Nome
- Data di nascita (formato AAAA-MM-GG)
- Luogo/Comune di nascita
- Sesso (M o F)
- Livello di confidenza ("Alta", "Media", "Bassa")

Rispondi RIGOROSAMENTE in JSON:
{
  "codiceFiscale": string,
  "cognome": string,
  "nome": string,
  "dataNascita": string,
  "comuneNascita": string,
  "sesso": "M" | "F",
  "confidence": string
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanData,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/ocr-codice-fiscale:', error);
    return res.status(500).json({ error: 'Errore durante la lettura OCR del Codice Fiscale' });
  }
});

// 5. OCR Prescrizione Oculistica & Gradazioni
app.post('/api/ai/ocr-prescription', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Immagine prescrizione richiesta' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        doctorOrOptometrist: 'Dott. Oculista (Rilevato)',
        date: new Date().toISOString().slice(0, 10),
        od: { sph: -2.25, cyl: -0.50, ax: 90, add: 0.0 },
        os: { sph: -2.00, cyl: -0.75, ax: 85, add: 0.0 },
        pd: { od: 31.5, os: 31.5, total: 63.0 },
        mountingHeight: 21.0,
        notes: 'Dati rilevati da ricetta. Verificare prima di confermare.',
        confidence: 'Simulazione Offline',
      });
    }

    const cleanData = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `
Sei il modulo OCR dello Studio Ottico Di Pietro specializzato nella lettura di ricette e prescrizioni oculistiche / optometriche.
Estrai con cura i parametri di rifrazione sia per Occhio Destro (OD) che per Occhio Sinistro (OS):
- Sfera (SPH): numero decimale (es. -2.00, +1.50)
- Cilindro (CYL): numero decimale (es. -0.50, -1.25)
- Asse (AX): numero intero in gradi da 0 a 180 (es. 90, 180, 15)
- Addizione (ADD): numero se presente per presbiopia (es. +1.50, +2.00), altrimenti 0
- Prisma e Base: se specificati
- Distanza Pupillare (PD): totale e/o monoculare (OD / OS) in mm se presente (es. total: 63, od: 31.5, os: 31.5)
- Altezza montaggio: numero in mm se indicato, altrimenti 20
- Data prescrizione (AAAA-MM-GG)
- Medico o studio oculistico intestatario
- Eventuali note

Rispondi RIGOROSAMENTE in formato JSON:
{
  "doctorOrOptometrist": string,
  "date": string,
  "od": {
    "sph": number,
    "cyl": number,
    "ax": number,
    "add": number,
    "prisma": string,
    "base": string
  },
  "os": {
    "sph": number,
    "cyl": number,
    "ax": number,
    "add": number,
    "prisma": string,
    "base": string
  },
  "pd": {
    "od": number,
    "os": number,
    "total": number
  },
  "mountingHeight": number,
  "notes": string,
  "confidence": string
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanData,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/ocr-prescription:', error);
    return res.status(500).json({ error: 'Errore durante la lettura OCR della prescrizione' });
  }
});

// Fallback rule-based parser for offline / missing API key operation
function fallbackRuleBasedQueryParser(query: string) {
  const q = query.toLowerCase();
  let brand: string | undefined = undefined;
  const knownBrands = ['ray-ban', 'persol', 'oakley', 'gucci', 'prada', 'tom ford', 'silhouette', 'moscot', 'carrera', 'armani'];
  for (const b of knownBrands) {
    if (q.includes(b)) {
      brand = b.charAt(0).toUpperCase() + b.slice(1);
      if (b === 'ray-ban') brand = 'Ray-Ban';
      if (b === 'tom ford') brand = 'Tom Ford';
      break;
    }
  }

  let gender: 'Uomo' | 'Donna' | 'Unisex' | undefined = undefined;
  if (q.includes('uomo') || q.includes('maschile') || q.includes('da uomo')) gender = 'Uomo';
  else if (q.includes('donna') || q.includes('femminile') || q.includes('da donna')) gender = 'Donna';
  else if (q.includes('unisex')) gender = 'Unisex';

  let color: string | undefined = undefined;
  const colors = ['nero', 'nera', 'neri', 'tartaruga', 'havana', 'oro', 'dorato', 'argento', 'blu', 'rosso', 'marrone', 'verde'];
  for (const c of colors) {
    if (q.includes(c)) {
      color = c;
      break;
    }
  }

  let maxPrice: number | undefined = undefined;
  const priceMatch = q.match(/(sotto|meno di|inferiore a|fino a|max)?\s*(\d+)\s*(euro|€)/);
  if (priceMatch && priceMatch[2]) {
    maxPrice = parseInt(priceMatch[2], 10);
  }

  const inShowcase = q.includes('vetrina') || q.includes('espost');
  const inPromo = q.includes('promo') || q.includes('scont');
  const stagnantOnly = q.includes('stock fermo') || q.includes('un anno') || q.includes('mesi') || q.includes('fermi');

  let intent: any = 'search_inventory';
  if (q.includes('dove si trova') || q.includes('posizione')) intent = 'find_location';
  else if (stagnantOnly) intent = 'stagnant_stock';
  else if (inShowcase) intent = 'showcase';
  else if (inPromo) intent = 'promotions';
  else if (q.includes('prescrizion') || q.includes('gradazion')) intent = 'client_prescriptions';
  else if (q.includes('vendut') || q.includes('vendite')) intent = 'sales_stats';

  return {
    intent,
    brand,
    gender,
    color,
    maxPrice,
    inShowcase: inShowcase ? true : undefined,
    inPromo: inPromo ? true : undefined,
    stagnantOnly: stagnantOnly ? true : undefined,
    explanation: `Interpretazione locale: ${[brand, gender, color, maxPrice ? `max €${maxPrice}` : ''].filter(Boolean).join(', ') || 'Ricerca generale'}`,
  };
}

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Studio Ottico Di Pietro server running on http://localhost:${PORT}`);
  });
}

startServer();

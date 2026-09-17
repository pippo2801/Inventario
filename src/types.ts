// Studio Ottico Di Pietro - Types & Domain Models
// Respecting architectural principles: Modularity, Non-lockin, Real Database Integrity

export type UserRole = 'Amministratore' | 'Operatore';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  email: string;
  avatarColor: string;
  deviceName: string;
  active: boolean;
}

export interface Organization {
  id: string;
  name: string;
  tagline: string;
  vatNumber: string; // Partita IVA
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
}

export type Gender = 'Uomo' | 'Donna' | 'Unisex';

export type FrameShape = 'Aviator' | 'Rettangolare' | 'Rotondo' | 'Squadrato' | 'Cat-eye' | 'Pantografo' | 'Browline' | 'Ovale' | 'Altro';
export type FrameMaterial = 'Metallo' | 'Acetato' | 'Titanio' | 'Misto' | 'A giorno' | 'Legno' | 'Altro';
export type LensType = 'Monofocali' | 'Progressive' | 'Degressive' | 'Da riposo' | 'Solari Graduati';
export type PrescriptionStatus = 'CONFERMATA' | 'DA_VERIFICARE' | 'COMPLETA';

export type ProductStatus = 'Disponibile' | 'Venduto';

export interface Eyeglass {
  id: string;
  sku: string; // Codice interno / SKU
  supplierCode: string; // Codice fornitore (es. RB3025-001)
  barcode?: string;
  brand: string; // Es. Ray-Ban, Persol, Oakley, Gucci
  model: string; // Es. Aviator Classic, 649, Holbrook
  color: string; // Es. Nero Opaco, Tartaruga Havana, Oro Lucido
  gender: Gender;
  purchasePrice: number; // Prezzo di acquisto (€)
  salePrice: number; // Prezzo di vendita al pubblico (€)
  promoPrice?: number | null; // Prezzo promozionale (€)
  isPromo: boolean; // Flag promozione
  promoStartDate?: string;
  promoEndDate?: string;
  promoNote?: string;
  isShowcase: boolean; // Esposto in Vetrina
  showcasePosition?: string; // Es. "Vetrina Ingresso - Ripiano 2"
  location: string; // Posizione fisica nel negozio o magazzino
  status: ProductStatus;
  stockDate: string; // Data di inserimento in magazzino (ISO)
  notes?: string;
  material?: string; // Opzionale (es. Acetato, Titanio, Metallo)
  shape?: string; // Opzionale (es. Aviator, Rettangolare, Tondo, Squadrato, Cat-eye)
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  version: number;
  deletedAt: string | null; // Soft delete (Cestino)
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  fiscalCode: string; // Codice Fiscale (16 caratteri)
  birthDate?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  isComplete: boolean; // false se da verificare
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  version: number;
  deletedAt: string | null;
}

export interface OphthalmicEyeData {
  sph: number; // Sfera (+/- diottrie)
  cyl: number; // Cilindro (+/- diottrie)
  ax: number;  // Asse (0 - 180 gradi)
  add?: number; // Addizione (per presbiopia/progressivi)
  prisma?: string; // Es. "1.5 UP", "2.0 OUT"
  base?: string;
}

export interface Prescription {
  id: string;
  clientId?: string;
  clientName: string;
  date: string;
  doctorOrOptometrist: string;
  od: OphthalmicEyeData; // Occhio Destro
  os: OphthalmicEyeData; // Occhio Sinistro
  pd: {
    od?: number; // Distanza pupillare OD (mm)
    os?: number; // Distanza pupillare OS (mm)
    total: number; // DP totale (mm)
  };
  mountingHeight?: number; // Altezza di montaggio (mm)
  lensType?: LensType;
  treatments?: string[];
  notes?: string;
  originalImageUrl?: string;
  status: PrescriptionStatus;
  postponedReason?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  version: number;
  deletedAt: string | null;
}

export type PaymentMethod = 'Contanti' | 'POS / Carta' | 'Carta' | 'Bonifico' | 'Bonifico Bancario' | 'Satispay / Altro' | 'Altro';

export interface Sale {
  id: string;
  saleNumber: string; // Es. VND-2025-0012
  date: string;
  productId: string;
  productDescription: string;
  eyeglassBrand?: string;
  eyeglassModel?: string;
  productPurchasePrice: number;
  purchasePrice?: number;
  listPrice: number;
  discount: number;
  finalPrice: number;
  salePrice?: number;
  estimatedGrossMargin: number; // finalPrice - productPurchasePrice
  clientId?: string;
  clientName?: string;
  paymentMethod: PaymentMethod;
  receiptReference: string; // Riferimento scontrino / transazione
  notes?: string;
  operatorId: string;
  operatorName: string;
  deviceId?: string;
  timestamp?: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  role: UserRole;
  deviceName: string;
  device?: string;
  entityType: 'Prodotto' | 'Cliente' | 'Prescrizione' | 'Vendita' | 'Vetrina' | 'Promo' | 'Backup' | 'Sistema';
  entityId: string;
  operation: 'CREAZIONE' | 'MODIFICA' | 'VENDITA' | 'ELIMINAZIONE' | 'RIPRISTINO' | 'SPOSTAMENTO_VETRINA' | 'PROMO_ATTIVATA' | 'PROMO_DISATTIVATA';
  details: string;
  oldValue?: string;
  newValue?: string;
  isAiOrigin?: boolean;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  category: 'importanti' | 'vendite' | 'prodotti' | 'prezzi' | 'promo' | 'vetrina' | 'clienti' | 'prescrizioni' | 'da_verificare' | 'inventario';
  targetView?: string;
  targetId?: string;
  read: boolean;
  originDevice: string;
}

export type SyncState = 'synced' | 'syncing' | 'offline' | 'conflict';

export interface SyncStatus {
  state: SyncState;
  lastSyncTimestamp: string;
  lastSyncTime?: string;
  pendingChangesCount: number;
  pendingChanges?: number;
  activeDevice: 'A' | 'B';
}

export interface StagnantStockSuggestion {
  productId: string;
  brand: string;
  model: string;
  monthsInStock: number;
  purchasePrice: number;
  salePrice: number;
  suggestedPromoPrice: number;
  reason: string;
}

// AI Parsed Natural Language Search
export interface AiSearchQueryFilters {
  intent: 'search_inventory' | 'find_location' | 'stagnant_stock' | 'showcase' | 'promotions' | 'client_prescriptions' | 'sales_stats' | 'brand_query' | 'general';
  brand?: string;
  model?: string;
  gender?: Gender;
  color?: string;
  maxPrice?: number;
  minPrice?: number;
  inShowcase?: boolean;
  inPromo?: boolean;
  stagnantOnly?: boolean;
  minMonthsStagnant?: number;
  locationKeyword?: string;
  clientQuery?: string;
  skuOrCode?: string;
  explanation: string;
}

// Visual search result (simili)
export interface VisualAnalysisResult {
  shape?: string;
  color?: string;
  frameType?: string;
  detectedBrand?: string | null;
  detectedModelOrCode?: string | null;
  confidence: 'Alta' | 'Media' | 'Bassa';
  stimaIaDetails: string;
  usefulFramesCount?: number;
}

export interface CustomCategory {
  id: string;
  name: string;
  description?: string;
  eyeglassIds: string[];
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AppSettings {
  menuCategories: {
    occhiali: boolean;
    pazienti: boolean;
    prescrizioni: boolean;
    vendite: boolean;
    attivita: boolean;
  };
  home: {
    showQuickActions: boolean;
    showKpi: boolean;
    showRecentActivity: boolean;
    showStockAlerts: boolean;
    watermarkIntensity: number;
  };
  appearance: {
    theme: 'light' | 'dark';
    style: 'ivory' | 'editorial';
  };
  notifications: {
    enabled: boolean;
  };
  sync: {
    enabled: boolean;
  };
}

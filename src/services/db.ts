// Studio Ottico Di Pietro - Central Database & Storage Service
// Features: Local persistence, Soft Delete, Audit Logging, Backup/Restore, Real-time Subscribers

import {
  Organization,
  User,
  Eyeglass,
  Client,
  Prescription,
  Sale,
  AuditLog,
  AppNotification,
  SyncStatus,
  StagnantStockSuggestion,
  AppSettings
} from '../types';
import {
  initialOrganization,
  initialUsers,
  initialEyeglasses,
  initialClients,
  initialPrescriptions,
  initialSales,
  initialAuditLogs,
  initialNotifications
} from '../data/initialData';

const STORAGE_PREFIX = 'studio_ottico_dipietro_';

class DatabaseService {
  private organization: Organization;
  private users: User[];
  private currentUser: User;
  private eyeglasses: Eyeglass[];
  private eyeglassSequence: number;
  private clients: Client[];
  private prescriptions: Prescription[];
  private sales: Sale[];
  private auditLogs: AuditLog[];
  private notifications: AppNotification[];
  private syncStatus: SyncStatus;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Load from localStorage or seed
    this.organization = this.load('organization', initialOrganization);
    this.users = this.load('users', initialUsers);
    this.currentUser = this.load('currentUser', this.users[0]);
    this.eyeglasses = this.load('eyeglasses', initialEyeglasses);
    const maxEyeglassId = this.eyeglasses.reduce((max, item) => {
      const match = item.id.match(/^OPT-(\d+)$/);
      return Math.max(max, match ? Number(match[1]) : 0);
    }, 0);
    const storedSequence = this.load<number>('eyeglassSequence', 1);
    this.eyeglassSequence = Math.max(Number.isSafeInteger(storedSequence) && storedSequence > 0 ? storedSequence : 1, maxEyeglassId + 1);
    this.clients = this.load('clients', initialClients);
    this.prescriptions = this.load('prescriptions', initialPrescriptions);
    this.sales = this.load('sales', initialSales);
    this.auditLogs = this.load('auditLogs', initialAuditLogs);
    this.notifications = this.load('notifications', initialNotifications);
    this.syncStatus = {
      state: 'offline',
      lastSyncTimestamp: '',
      pendingChangesCount: 0,
      activeDevice: 'A',
    };
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn(`Error loading ${key} from storage:`, e);
    }
    return fallback;
  }

  private persist<T>(key: string, data: T): boolean {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn(`Error saving ${key} to storage:`, e);
      return false;
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- ORGANIZATION & USERS ---
  public getOrganization(): Organization {
    return { ...this.organization };
  }

  public updateOrganization(org: Partial<Organization>) {
    this.organization = { ...this.organization, ...org };
    this.persist('organization', this.organization);
    this.addAuditLog('Sistema', this.organization.id, 'MODIFICA', 'Aggiornati dati dello Studio Ottico');
    this.notify();
  }

  public getUsers(): User[] {
    return [...this.users];
  }

  public getCurrentUser(): User {
    return { ...this.currentUser };
  }

  public setCurrentUser(userId: string) {
    const found = this.users.find((u) => u.id === userId);
    if (found) {
      this.currentUser = found;
      this.syncStatus.activeDevice = found.role === 'Amministratore' ? 'A' : 'B';
      this.persist('currentUser', this.currentUser);
      this.notify();
    }
  }

  // --- AUDIT LOG ---
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private addAuditLog(
    entityType: AuditLog['entityType'],
    entityId: string,
    operation: AuditLog['operation'],
    details: string,
    oldValue?: string,
    newValue?: string,
    isAiOrigin: boolean = false
  ) {
    const log: AuditLog = {
      id: 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      operator: this.currentUser.name,
      role: this.currentUser.role,
      deviceName: this.currentUser.deviceName,
      entityType,
      entityId,
      operation,
      details,
      oldValue,
      newValue,
      isAiOrigin,
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
    this.persist('auditLogs', this.auditLogs);
  }

  // --- NOTIFICATIONS ---
  public getNotifications(): AppNotification[] {
    return [...this.notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getUnreadNotificationsCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  public markNotificationAsRead(id: string) {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.persist('notifications', this.notifications);
    this.notify();
  }

  public markAllNotificationsAsRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.persist('notifications', this.notifications);
    this.notify();
  }

  public pushNotification(
    title: string,
    message: string,
    category: AppNotification['category'],
    targetView?: string,
    targetId?: string
  ) {
    const notif: AppNotification = {
      id: 'NOTIF-' + Date.now(),
      timestamp: new Date().toISOString(),
      title,
      message,
      category,
      targetView,
      targetId,
      read: false,
      originDevice: this.currentUser.deviceName,
    };
    this.notifications.unshift(notif);
    this.persist('notifications', this.notifications);
    this.notify();
  }

  // --- SYNC STATUS ---
  public getSyncStatus(): SyncStatus {
    return {
      ...this.syncStatus,
      lastSyncTime: this.syncStatus.lastSyncTimestamp,
      pendingChanges: this.syncStatus.pendingChangesCount,
    };
  }

  public toggleOfflineMode() {
    // Cloud sync is intentionally disabled in single-device mode.
    this.syncStatus.state = 'offline';
    this.notify();
  }

  // --- EYEGLASSES (PRODUCTS) ---
  public getEyeglasses(includeDeleted = false): Eyeglass[] {
    if (includeDeleted) return [...this.eyeglasses];
    return this.eyeglasses.filter((e) => e.deletedAt === null);
  }

  public getEyeglassById(id: string): Eyeglass | undefined {
    return this.eyeglasses.find((e) => e.id === id);
  }

  public addEyeglass(item: Omit<Eyeglass, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'version' | 'deletedAt'>, isAiOrigin = false): Eyeglass {
    const normalizedSku = item.sku.trim().toUpperCase();
    if (!normalizedSku) throw new Error('Il codice SKU è obbligatorio');
    if (this.eyeglasses.some(existing => (existing.sku || '').trim().toUpperCase() === normalizedSku)) {
      throw new Error(`Codice SKU già utilizzato: ${normalizedSku}`);
    }
    const newId = 'OPT-' + String(this.eyeglassSequence).padStart(3, '0');
    this.eyeglassSequence += 1;
    this.persist('eyeglassSequence', this.eyeglassSequence);
    const now = new Date().toISOString();
    const newItem: Eyeglass = {
      ...item,
      sku: normalizedSku,
      id: newId,
      createdAt: now,
      updatedAt: now,
      createdBy: this.currentUser.name,
      updatedBy: this.currentUser.name,
      version: 1,
      deletedAt: null,
    };

    this.eyeglasses.unshift(newItem);
    this.persist('eyeglasses', this.eyeglasses);
    this.persist('eyeglassSequence', this.eyeglassSequence);

    this.addAuditLog(
      'Prodotto',
      newId,
      'CREAZIONE',
      `Aggiunto occhiale ${newItem.brand} ${newItem.model} (SKU: ${newItem.sku})`,
      undefined,
      `Prezzo: €${newItem.salePrice.toFixed(2)} - Posizione: ${newItem.location}`,
      isAiOrigin
    );

    // Push notification to the other device
    this.pushNotification(
      `Nuovo prodotto inserito: ${newItem.brand} ${newItem.model}`,
      `${this.currentUser.name} ha caricato ${newItem.brand} ${newItem.model} in ${newItem.location}`,
      'prodotti',
      'inventario',
      newId
    );

    this.notify();
    return newItem;
  }

  public updateEyeglass(id: string, updates: Partial<Eyeglass>, isAiOrigin = false): Eyeglass | undefined {
    const index = this.eyeglasses.findIndex((e) => e.id === id);
    if (index === -1) return undefined;

    const oldItem = this.eyeglasses[index];
    if (updates.sku !== undefined) {
      const normalizedSku = updates.sku.trim().toUpperCase();
      if (!normalizedSku) throw new Error('Il codice SKU è obbligatorio');
      if (this.eyeglasses.some((existing) => existing.id !== id && (existing.sku || '').trim().toUpperCase() === normalizedSku)) {
        throw new Error(`Codice SKU già utilizzato: ${normalizedSku}`);
      }
      updates = { ...updates, sku: normalizedSku };
    }
    const updated: Eyeglass = {
      ...oldItem,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: this.currentUser.name,
      version: oldItem.version + 1,
    };

    this.eyeglasses[index] = updated;
    this.persist('eyeglasses', this.eyeglasses);

    // Track detailed audit
    let changeDetails = `Modificato occhiale ${updated.brand} ${updated.model}`;
    if (updates.salePrice !== undefined && updates.salePrice !== oldItem.salePrice) {
      changeDetails = `Prezzo modificato da €${oldItem.salePrice.toFixed(2)} a €${updates.salePrice.toFixed(2)}`;
      this.pushNotification(
        `Prezzo modificato: ${updated.brand} ${updated.model}`,
        `${this.currentUser.name} ha modificato il prezzo da €${oldItem.salePrice.toFixed(2)} a €${updates.salePrice.toFixed(2)}`,
        'prezzi',
        'inventario',
        id
      );
    }
    if (updates.isShowcase !== undefined && updates.isShowcase !== oldItem.isShowcase) {
      changeDetails = updates.isShowcase ? `Aggiunto in Vetrina (${updates.showcasePosition || updated.location})` : `Rimosso dalla Vetrina`;
      this.pushNotification(
        `Vetrina aggiornata`,
        `${this.currentUser.name} ha ${updates.isShowcase ? 'esposto' : 'rimosso'} ${updated.brand} ${updated.model} in vetrina`,
        'vetrina',
        'vetrina',
        id
      );
    }

    this.addAuditLog(
      'Prodotto',
      id,
      'MODIFICA',
      changeDetails,
      `v${oldItem.version}`,
      `v${updated.version}`,
      isAiOrigin
    );

    this.notify();
    return updated;
  }

  public softDeleteEyeglass(id: string) {
    const item = this.eyeglasses.find((e) => e.id === id);
    if (!item) return;

    item.deletedAt = new Date().toISOString();
    item.updatedBy = this.currentUser.name;
    this.persist('eyeglasses', this.eyeglasses);

    this.addAuditLog(
      'Prodotto',
      id,
      'ELIMINAZIONE',
      `Spostato nel cestino ${item.brand} ${item.model} (SKU: ${item.sku})`,
      'Attivo',
      'Nel Cestino'
    );

    this.notify();
  }

  public restoreEyeglass(id: string) {
    const item = this.eyeglasses.find((e) => e.id === id);
    if (!item) return;

    item.deletedAt = null;
    item.updatedBy = this.currentUser.name;
    this.persist('eyeglasses', this.eyeglasses);

    this.addAuditLog(
      'Prodotto',
      id,
      'RIPRISTINO',
      `Ripristinato dal cestino ${item.brand} ${item.model}`,
      'Nel Cestino',
      'Attivo'
    );

    this.notify();
  }

  public permanentlyDeleteEyeglass(id: string) {
    const item = this.eyeglasses.find((e) => e.id === id);
    this.eyeglasses = this.eyeglasses.filter((e) => e.id !== id);
    this.persist('eyeglasses', this.eyeglasses);

    if (item) {
      this.addAuditLog(
        'Prodotto',
        id,
        'ELIMINAZIONE',
        `Cancellazione definitiva di ${item.brand} ${item.model}`
      );
    }

    this.notify();
  }

  // --- FAST SALE (MODALITÀ VENDITA) ---
  public executeFastSale(data: {
    productId: string;
    clientId?: string;
    clientName?: string;
    discount: number;
    paymentMethod: Sale['paymentMethod'];
    receiptReference: string;
    notes?: string;
  }): Sale {
    const product = this.getEyeglassById(data.productId);
    if (!product || product.deletedAt != null) {
      throw new Error('Prodotto non trovato o presente nel cestino');
    }
    if (product.status !== 'Disponibile') {
      throw new Error('Questo occhiale non è disponibile per la vendita');
    }

    const effectiveListPrice = product.isPromo && product.promoPrice != null ? product.promoPrice : product.salePrice;
    if (!Number.isFinite(effectiveListPrice) || effectiveListPrice <= 0) {
      throw new Error('Prezzo di vendita non valido');
    }
    if (!Number.isFinite(data.discount) || data.discount < 0 || data.discount > effectiveListPrice) {
      throw new Error('Sconto non valido: deve essere compreso tra 0 e il prezzo di vendita');
    }
    const finalPrice = effectiveListPrice - data.discount;
    const estimatedGrossMargin = finalPrice - product.purchasePrice;

    const saleNumber = 'VND-' + new Date().getFullYear() + '-' + String(this.sales.length + 1).padStart(4, '0');
    const now = new Date().toISOString();

    const sale: Sale = {
      id: 'SALE-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      saleNumber,
      date: now,
      productId: product.id,
      productDescription: `${product.brand} ${product.model} (SKU: ${product.sku})`,
      productPurchasePrice: product.purchasePrice,
      listPrice: effectiveListPrice,
      discount: data.discount,
      finalPrice,
      estimatedGrossMargin,
      clientId: data.clientId,
      clientName: data.clientName,
      paymentMethod: data.paymentMethod,
      receiptReference: data.receiptReference,
      notes: data.notes,
      operatorId: this.currentUser.id,
      operatorName: this.currentUser.name,
      createdAt: now,
      deletedAt: null,
    };

    // 1. Update product and sales as one logical operation.
    // If either storage write fails, restore the in-memory state and best-effort
    // restore both persisted snapshots so a sale cannot be half-registered.
    const productIndex = this.eyeglasses.findIndex((item) => item.id === product.id);
    const previousProduct = { ...product };
    const previousSales = [...this.sales];

    product.status = 'Venduto';
    product.isShowcase = false;
    product.updatedAt = now;
    product.updatedBy = this.currentUser.name;
    this.sales.unshift(sale);

    const productSaved = this.persist('eyeglasses', this.eyeglasses);
    const salesSaved = productSaved && this.persist('sales', this.sales);
    if (!productSaved || !salesSaved) {
      if (productIndex >= 0) this.eyeglasses[productIndex] = previousProduct;
      this.sales = previousSales;
      this.persist('eyeglasses', this.eyeglasses);
      this.persist('sales', this.sales);
      throw new Error('Vendita non registrata: impossibile salvare i dati sul dispositivo. Riprova dopo aver liberato spazio.');
    }

    // 3. Audit log
    this.addAuditLog(
      'Vendita',
      product.id,
      'VENDITA',
      `Vendita registrata: ${product.brand} ${product.model} per €${finalPrice.toFixed(2)} (${data.paymentMethod}) a ${data.clientName || 'Cliente al banco'}. Rimosso da vetrina e inventario disponibile.`,
      `Disponibile (€${effectiveListPrice.toFixed(2)})`,
      `Venduto (€${finalPrice.toFixed(2)})`
    );

    // 4. Real-time push notification to other device
    this.pushNotification(
      `Vendita registrata: ${product.brand} ${product.model}`,
      `${this.currentUser.name} ha venduto ${product.brand} ${product.model} a €${finalPrice.toFixed(2)} (${data.paymentMethod})`,
      'vendite',
      'venduti',
      sale.id
    );

    this.notify();
    return sale;
  }

  public restoreEyeglassFromSale(productId: string, saleId?: string): Eyeglass | undefined {
    const product = this.getEyeglassById(productId);

    if (!product) {
      throw new Error('Occhiale non trovato');
    }

    // If saleId is provided, use that exact sale; otherwise try to identify the correct one
    let saleToCancel: Sale | undefined;

    if (saleId) {
      // Exact sale specified - verify it belongs to this product and is active
      saleToCancel = this.sales.find((s) => s.id === saleId && s.productId === productId && s.deletedAt === null);
      if (!saleToCancel) {
        throw new Error(`Vendita ${saleId} non trovata, non associata a questo prodotto, o già annullata`);
      }
    } else {
      // No saleId provided - try to identify the correct sale
      const productSales = this.sales
        .filter((s) => s.productId === productId && s.deletedAt === null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (productSales.length === 0) {
        // No active sales found - product might be marked as Venduto without a sale record
        // Restore without cancelling a sale
        console.warn(`Ripristino prodotto ${productId}: nessuna vendita attiva associata`);
      } else if (productSales.length === 1) {
        // Exactly one sale - safe to cancel
        saleToCancel = productSales[0];
      } else {
        // Multiple active sales - AMBIGUOUS: cannot determine which to cancel
        // Abort without modifying data
        const saleNumbers = productSales.map(s => s.saleNumber).join(', ');
        throw new Error(
          `Impossibile ripristinare: ${productSales.length} vendite attive per questo prodotto (${saleNumbers}). ` +
          `Specificare l'ID della vendita da annullare.`
        );
      }
    }

    const oldStatus = product.status;

    // Restore product to available
    product.status = 'Disponibile';
    product.isShowcase = false;
    product.updatedAt = new Date().toISOString();
    product.updatedBy = this.currentUser.name;
    product.version += 1;

    this.persist('eyeglasses', this.eyeglasses);

    // If there's an associated sale, mark it as cancelled (soft delete)
    if (saleToCancel) {
      saleToCancel.deletedAt = new Date().toISOString();
      this.persist('sales', this.sales);

      this.addAuditLog(
        'Vendita',
        saleToCancel.id,
        'ANNULLAMENTO',
        `Vendita annullata per ripristino prodotto: ${product.brand} ${product.model} (Scontrino: ${saleToCancel.saleNumber})`,
        'Attiva',
        'Annullata'
      );
    }

    this.addAuditLog(
      'Vendita',
      product.id,
      'RIPRISTINO_VENDITA',
      `Occhiale ripristinato da Venduto a Disponibile: ${product.brand} ${product.model}.${saleToCancel ? ` Vendita ${saleToCancel.saleNumber} annullata.` : ' Nessuna vendita associata da annullare.'}`,
      `${oldStatus}`,
      'Disponibile'
    );

    this.pushNotification(
      `Occhiale ripristinato: ${product.brand} ${product.model}`,
      `${this.currentUser.name} ha ripristinato ${product.brand} ${product.model} da Venduto a Disponibile.${saleToCancel ? ` Vendita ${saleToCancel.saleNumber} annullata.` : ''}`,
      'vendite',
      'inventario',
      product.id
    );

    this.notify();
    return product;
  }

  public getSales(includeDeleted = false): Sale[] {
    if (includeDeleted) return [...this.sales];
    return this.sales.filter((s) => s.deletedAt === null);
  }

  // --- CLIENTS ---
  public getClients(includeDeleted = false): Client[] {
    if (includeDeleted) return [...this.clients];
    return this.clients.filter((c) => c.deletedAt === null);
  }

  public getClientById(id: string): Client | undefined {
    return this.clients.find((c) => c.id === id);
  }

  public addClient(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'version' | 'deletedAt'>, isAiOrigin = false): Client {
    const newId = 'CLI-' + String(this.clients.length + 1).padStart(3, '0');
    const now = new Date().toISOString();
    const newClient: Client = {
      ...clientData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      createdBy: this.currentUser.name,
      updatedBy: this.currentUser.name,
      version: 1,
      deletedAt: null,
    };

    this.clients.unshift(newClient);
    this.persist('clients', this.clients);

    this.addAuditLog(
      'Cliente',
      newId,
      'CREAZIONE',
      `Registrato nuovo cliente: ${newClient.firstName} ${newClient.lastName} (CF: ${newClient.fiscalCode})`,
      undefined,
      newClient.isComplete ? 'Completo' : 'Da verificare',
      isAiOrigin
    );

    this.pushNotification(
      `Nuovo cliente: ${newClient.firstName} ${newClient.lastName}`,
      `${this.currentUser.name} ha aggiunto il cliente ${newClient.firstName} ${newClient.lastName}`,
      'clienti',
      'clienti',
      newId
    );

    this.notify();
    return newClient;
  }

  public updateClient(id: string, updates: Partial<Client>): Client | undefined {
    const index = this.clients.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    const oldClient = this.clients[index];
    const updated: Client = {
      ...oldClient,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: this.currentUser.name,
      version: oldClient.version + 1,
    };

    this.clients[index] = updated;
    this.persist('clients', this.clients);

    this.addAuditLog(
      'Cliente',
      id,
      'MODIFICA',
      `Aggiornata anagrafica cliente: ${updated.firstName} ${updated.lastName}`
    );

    this.notify();
    return updated;
  }

  public softDeleteClient(id: string) {
    const client = this.clients.find((c) => c.id === id);
    if (!client) return;

    client.deletedAt = new Date().toISOString();
    this.persist('clients', this.clients);

    this.addAuditLog('Cliente', id, 'ELIMINAZIONE', `Spostato cliente nel cestino: ${client.firstName} ${client.lastName}`);
    this.notify();
  }

  public restoreClient(id: string) {
    const client = this.clients.find((c) => c.id === id);
    if (!client) return;

    client.deletedAt = null;
    this.persist('clients', this.clients);

    this.addAuditLog('Cliente', id, 'RIPRISTINO', `Ripristinato cliente dal cestino: ${client.firstName} ${client.lastName}`);
    this.notify();
  }

  // --- PRESCRIPTIONS ---
  public getPrescriptions(includeDeleted = false): Prescription[] {
    if (includeDeleted) return [...this.prescriptions];
    return this.prescriptions.filter((p) => p.deletedAt === null);
  }

  public getPrescriptionById(id: string): Prescription | undefined {
    return this.prescriptions.find((p) => p.id === id);
  }

  public getPrescriptionsByClient(clientId: string): Prescription[] {
    return this.prescriptions.filter((p) => p.clientId === clientId && p.deletedAt === null);
  }

  public addPrescription(prescriptionData: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'version' | 'deletedAt'>, isAiOrigin = false): Prescription {
    const newId = 'RX-' + new Date().getFullYear() + '-' + String(this.prescriptions.length + 1).padStart(3, '0');
    const now = new Date().toISOString();
    const newPrescription: Prescription = {
      ...prescriptionData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      createdBy: this.currentUser.name,
      updatedBy: this.currentUser.name,
      version: 1,
      deletedAt: null,
    };

    this.prescriptions.unshift(newPrescription);
    this.persist('prescriptions', this.prescriptions);

    this.addAuditLog(
      'Prescrizione',
      newId,
      'CREAZIONE',
      `Nuova prescrizione per ${newPrescription.clientName}: OD SPH ${newPrescription.od.sph} / OS SPH ${newPrescription.os.sph}`,
      undefined,
      newPrescription.status,
      isAiOrigin
    );

    if (newPrescription.status === 'DA_VERIFICARE') {
      this.pushNotification(
        `Prescrizione da verificare`,
        `Una prescrizione per ${newPrescription.clientName} è stata salvata in attesa di verifica`,
        'da_verificare',
        'da_verificare',
        newId
      );
    } else {
      this.pushNotification(
        `Nuova prescrizione registrata`,
        `${this.currentUser.name} ha salvato la prescrizione di ${newPrescription.clientName}`,
        'prescrizioni',
        'prescrizioni',
        newId
      );
    }

    this.notify();
    return newPrescription;
  }

  public updatePrescription(id: string, updates: Partial<Prescription>): Prescription | undefined {
    const index = this.prescriptions.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    const oldP = this.prescriptions[index];
    const updated: Prescription = {
      ...oldP,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: this.currentUser.name,
      version: oldP.version + 1,
    };

    this.prescriptions[index] = updated;
    this.persist('prescriptions', this.prescriptions);

    this.addAuditLog(
      'Prescrizione',
      id,
      'MODIFICA',
      `Modificata prescrizione di ${updated.clientName}`,
      `Stato: ${oldP.status}`,
      `Stato: ${updated.status}`
    );

    this.notify();
    return updated;
  }

  public softDeletePrescription(id: string) {
    const p = this.prescriptions.find((item) => item.id === id);
    if (!p) return;

    p.deletedAt = new Date().toISOString();
    this.persist('prescriptions', this.prescriptions);

    this.addAuditLog('Prescrizione', id, 'ELIMINAZIONE', `Spostata prescrizione di ${p.clientName} nel cestino`);
    this.notify();
  }

  public restorePrescription(id: string) {
    const p = this.prescriptions.find((item) => item.id === id);
    if (!p) return;

    p.deletedAt = null;
    this.persist('prescriptions', this.prescriptions);

    this.addAuditLog('Prescrizione', id, 'RIPRISTINO', `Ripristinata prescrizione di ${p.clientName} dal cestino`);
    this.notify();
  }

  // --- STAGNANT STOCK SUGGESTIONS ---
  public getStagnantStock(monthsThreshold = 6): Eyeglass[] {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - monthsThreshold);

    return this.eyeglasses.filter(
      (e) => e.deletedAt === null && e.status === 'Disponibile' && new Date(e.stockDate) <= cutoff
    );
  }

  public getStagnantStockSuggestions(): StagnantStockSuggestion[] {
    const stagnantItems = this.getStagnantStock(6);
    const now = new Date().getTime();

    return stagnantItems.map((item) => {
      const stockTime = new Date(item.stockDate).getTime();
      const months = Math.round((now - stockTime) / (1000 * 60 * 60 * 24 * 30.4));
      const suggestedDiscount = months >= 12 ? 0.25 : 0.15;
      const suggestedPromoPrice = Math.round(item.salePrice * (1 - suggestedDiscount));

      return {
        productId: item.id,
        brand: item.brand,
        model: item.model,
        monthsInStock: months,
        purchasePrice: item.purchasePrice,
        salePrice: item.salePrice,
        suggestedPromoPrice,
        reason:
          months >= 12
            ? `Presente da ${months} mesi in magazzino (stock fermo > 1 anno). Suggerito sconto del 25%.`
            : `Presente da ${months} mesi in magazzino. Suggerito sconto del 15% per favorire rotazione.`,
      };
    });
  }

  // --- BACKUP & RESTORE ---
  public exportBackupJson(): string {
    const backupData = {
      app: 'Studio Ottico Di Pietro',
      schemaVersion: 2,
      eyeglassSequence: this.eyeglassSequence,
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: this.currentUser.name,
      organization: this.organization,
      users: this.users,
      currentUser: this.currentUser,
      eyeglasses: this.eyeglasses,
      clients: this.clients,
      prescriptions: this.prescriptions,
      sales: this.sales,
      auditLogs: this.auditLogs,
      notifications: this.notifications,
      settings: this.getSettings(),
      customCategories: this.getCustomCategories(),
    };
    return JSON.stringify(backupData, null, 2);
  }

  public importBackupJson(jsonString: string): { success: boolean; message: string } {
    let previous: {
      organization: Organization;
      users: User[];
      currentUser: User;
      eyeglasses: Eyeglass[];
      clients: Client[];
      prescriptions: Prescription[];
      sales: Sale[];
      auditLogs: AuditLog[];
      notifications: AppNotification[];
      settings: AppSettings;
      customCategories: import('../types').CustomCategory[];
      eyeglassSequence: number;
    } | null = null;

    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object' || !Array.isArray(data.eyeglasses)) {
        return { success: false, message: 'Formato backup non valido: dati occhiali mancanti.' };
      }

      const arrayFields = ['users', 'clients', 'prescriptions', 'sales', 'auditLogs', 'notifications', 'customCategories'];
      for (const field of arrayFields) {
        if (data[field] !== undefined && !Array.isArray(data[field])) {
          return { success: false, message: `Formato backup non valido: campo ${field} non valido.` };
        }
      }
      if (data.organization !== undefined && (!data.organization || typeof data.organization !== 'object')) {
        return { success: false, message: 'Formato backup non valido: dati dello studio non validi.' };
      }
      if (data.settings !== undefined && (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings))) {
        return { success: false, message: 'Formato backup non valido: impostazioni non valide.' };
      }

      const nextUsers: User[] = Array.isArray(data.users) && data.users.length ? data.users : this.users;
      const nextCurrentUser: User = data.currentUser || nextUsers.find(user => user.id === this.currentUser.id) || nextUsers[0];
      if (!nextCurrentUser || !nextUsers.some(user => user.id === nextCurrentUser.id)) {
        return { success: false, message: 'Formato backup non valido: utente attivo non presente nell’elenco utenti.' };
      }

      previous = {
        organization: this.organization,
        users: this.users,
        currentUser: this.currentUser,
        eyeglasses: this.eyeglasses,
        clients: this.clients,
        prescriptions: this.prescriptions,
        sales: this.sales,
        auditLogs: this.auditLogs,
        notifications: this.notifications,
        settings: this.getSettings(),
        customCategories: this.getCustomCategories(),
        eyeglassSequence: this.eyeglassSequence,
      };

      this.organization = data.organization || this.organization;
      this.users = nextUsers;
      this.currentUser = nextCurrentUser;
      this.eyeglasses = data.eyeglasses;
      const restoredMaxId = this.eyeglasses.reduce((max: number, item: Eyeglass) => {
        const match = item.id.match(/^OPT-(\d+)$/);
        return Math.max(max, match ? Number(match[1]) : 0);
      }, 0);
      this.eyeglassSequence = Math.max(
        this.eyeglassSequence,
        Number(data.eyeglassSequence) || 1,
        restoredMaxId + 1
      );
      this.clients = data.clients || this.clients;
      this.prescriptions = data.prescriptions || this.prescriptions;
      this.sales = data.sales || this.sales;
      this.auditLogs = data.auditLogs || this.auditLogs;
      this.notifications = data.notifications || this.notifications;

      const writes: Array<[string, unknown]> = [
        ['organization', this.organization],
        ['users', this.users],
        ['currentUser', this.currentUser],
        ['eyeglasses', this.eyeglasses],
        ['eyeglassSequence', this.eyeglassSequence],
        ['clients', this.clients],
        ['prescriptions', this.prescriptions],
        ['sales', this.sales],
        ['auditLogs', this.auditLogs],
        ['notifications', this.notifications],
        ['settings', data.settings || this.getSettings()],
        ['custom_categories', data.customCategories || this.getCustomCategories()],
      ];
      for (const [key, value] of writes) {
        if (!this.persist(key, value)) throw new Error(`Impossibile salvare il campo ${key} sul dispositivo.`);
      }

      this.addAuditLog('Backup', 'RESTORE-' + Date.now(), 'MODIFICA', 'Ripristinato backup manuale dei dati');
      this.notify();
      return { success: true, message: 'Database ripristinato con successo!' };
    } catch (e: any) {
      if (previous) {
        this.organization = previous.organization;
        this.users = previous.users;
        this.currentUser = previous.currentUser;
        this.eyeglasses = previous.eyeglasses;
        this.eyeglassSequence = previous.eyeglassSequence;
        this.clients = previous.clients;
        this.prescriptions = previous.prescriptions;
        this.sales = previous.sales;
        this.auditLogs = previous.auditLogs;
        this.notifications = previous.notifications;
        this.persist('organization', this.organization);
        this.persist('users', this.users);
        this.persist('currentUser', this.currentUser);
        this.persist('eyeglasses', this.eyeglasses);
        this.persist('eyeglassSequence', this.eyeglassSequence);
        this.persist('clients', this.clients);
        this.persist('prescriptions', this.prescriptions);
        this.persist('sales', this.sales);
        this.persist('auditLogs', this.auditLogs);
        this.persist('notifications', this.notifications);
        this.persist('settings', previous.settings);
        this.persist('custom_categories', previous.customCategories);
      }
      return { success: false, message: 'Ripristino annullato: ' + (e?.message || 'errore di lettura del backup') };
    }
  }

  public resetToDemoData() {
    this.organization = initialOrganization;
    this.users = initialUsers;
    this.currentUser = initialUsers[0];
    this.eyeglasses = initialEyeglasses;
    this.eyeglassSequence = this.eyeglasses.reduce((max, item) => {
      const match = item.id.match(/^OPT-(\d+)$/);
      return Math.max(max, match ? Number(match[1]) : 0);
    }, 0) + 1;
    this.clients = initialClients;
    this.prescriptions = initialPrescriptions;
    this.sales = initialSales;
    this.auditLogs = initialAuditLogs;
    this.notifications = initialNotifications;

    this.persist('organization', this.organization);
    this.persist('users', this.users);
    this.persist('currentUser', this.currentUser);
    this.persist('eyeglasses', this.eyeglasses);
    this.persist('eyeglassSequence', this.eyeglassSequence);
    this.persist('clients', this.clients);
    this.persist('prescriptions', this.prescriptions);
    this.persist('sales', this.sales);
    this.persist('auditLogs', this.auditLogs);
    this.persist('notifications', this.notifications);

    this.notify();
  }

  // --- ALIASES & COMPATIBILITY HELPERS ---
  public createEyeglass(item: any): Eyeglass {
    return this.addEyeglass({
      ...item,
      supplierCode: item.supplierCode || 'FORN-' + Math.floor(100 + Math.random() * 900),
      status: item.status || 'Disponibile',
      stockDate: item.stockDate || new Date().toISOString(),
    });
  }

  public permanentDeleteEyeglass(id: string) {
    this.permanentlyDeleteEyeglass(id);
  }

  public createClient(clientData: any): Client {
    return this.addClient(clientData);
  }

  public getPrescriptionsByClientId(clientId: string): Prescription[] {
    return this.getPrescriptionsByClient(clientId);
  }

  public getSalesByClientId(clientId: string): Sale[] {
    return this.sales.filter((s) => s.clientId === clientId && s.deletedAt === null);
  }

  public createPrescription(prescriptionData: any): Prescription {
    return this.addPrescription(prescriptionData);
  }

  public createSale(saleData: any): Sale {
    return this.executeFastSale(saleData);
  }

  public exportBackupData(): string {
    return this.exportBackupJson();
  }

  public importBackupData(jsonString: string): boolean {
    const result = this.importBackupJson(jsonString);
    return result.success;
  }

  // --- STATISTICS (SECTIONS 33, 34, 35) ---
  public getInventoryStatistics() {
    const available = this.getEyeglasses(false).filter((e) => e.status === 'Disponibile');
    const totalPieces = available.length;
    const totalPurchaseValue = available.reduce((acc, e) => acc + (e.purchasePrice || 0), 0);
    const totalRetailValue = available.reduce((acc, e) => acc + (e.salePrice || 0), 0);
    const totalPromoValue = available.reduce(
      (acc, e) => acc + (e.isPromo && e.promoPrice ? e.promoPrice : e.salePrice || 0),
      0
    );
    const estimatedGrossMarginStock = totalRetailValue - totalPurchaseValue;

    const showcase = available.filter((e) => e.isShowcase);
    const showcasePieces = showcase.length;
    const showcaseRetailValue = showcase.reduce((acc, e) => acc + (e.isPromo && e.promoPrice ? e.promoPrice : e.salePrice), 0);

    const promo = available.filter((e) => e.isPromo);
    const promoPieces = promo.length;

    const stagnant6MonthsCount = this.getStagnantStock(6).length;
    const stagnant12MonthsCount = this.getStagnantStock(12).length;

    return {
      totalPieces,
      totalPurchaseValue,
      totalRetailValue,
      totalPromoValue,
      estimatedGrossMarginStock,
      showcasePieces,
      showcaseRetailValue,
      promoPieces,
      stagnant6MonthsCount,
      stagnant12MonthsCount,
    };
  }

  public getSalesStatistics() {
    const allSales = this.getSales(false);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const todaySales = allSales.filter((s) => s.createdAt.startsWith(todayStr));
    const weekSales = allSales.filter((s) => new Date(s.createdAt) >= oneWeekAgo);
    const monthSales = allSales.filter((s) => new Date(s.createdAt) >= oneMonthAgo);
    const yearSales = allSales.filter((s) => new Date(s.createdAt) >= oneYearAgo);

    const todayRevenue = todaySales.reduce((acc, s) => acc + (s.finalPrice ?? s.salePrice ?? 0), 0);
    const weekRevenue = weekSales.reduce((acc, s) => acc + (s.finalPrice ?? s.salePrice ?? 0), 0);
    const monthRevenue = monthSales.reduce((acc, s) => acc + (s.finalPrice ?? s.salePrice ?? 0), 0);
    const yearRevenue = yearSales.reduce((acc, s) => acc + (s.finalPrice ?? s.salePrice ?? 0), 0);

    const totalGrossMarginRealized = allSales.reduce((acc, s) => acc + (s.estimatedGrossMargin || 0), 0);

    // Top brand & top model calculation
    const brandCounts: Record<string, number> = {};
    const modelCounts: Record<string, number> = {};

    allSales.forEach((s) => {
      const parts = s.productDescription.split(' ');
      const b = parts[0] || 'Ray-Ban';
      brandCounts[b] = (brandCounts[b] || 0) + 1;
      const m = parts.slice(0, 3).join(' ');
      modelCounts[m] = (modelCounts[m] || 0) + 1;
    });

    const topBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ray-Ban';
    const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Aviator Classic';

    return {
      todayPieces: todaySales.length,
      todayRevenue,
      weekPieces: weekSales.length,
      weekRevenue,
      monthPieces: monthSales.length,
      monthRevenue,
      yearPieces: yearSales.length,
      yearRevenue,
      totalGrossMarginRealized,
      topBrand,
      topModel,
    };
  }
  public getSettings(): AppSettings {
    const defaults: AppSettings = {
      menuCategories: {
        occhiali: true,
        pazienti: true,
        prescrizioni: true,
        vendite: true,
        attivita: true,
      },
      home: {
        showQuickActions: true,
        showKpi: true,
        showRecentActivity: true,
        showStockAlerts: true,
        watermarkIntensity: 35,
      },
      appearance: {
        theme: 'light',
        style: 'editorial',
      },
      notifications: {
        enabled: true,
      },
      sync: {
        enabled: false,
      },
    };

    const saved = this.load<AppSettings>('settings', defaults);

    return {
      ...defaults,
      ...saved,
      menuCategories: { ...defaults.menuCategories, ...saved.menuCategories },
      home: { ...defaults.home, ...saved.home },
      appearance: { ...defaults.appearance, ...saved.appearance },
      notifications: { ...defaults.notifications, ...saved.notifications },
      sync: { enabled: false },
    };
  }

  public updateSettings(changes: Partial<AppSettings>) {
    const current = this.getSettings();

    const updated: AppSettings = {
      ...current,
      ...changes,
      menuCategories: {
        ...current.menuCategories,
        ...(changes.menuCategories || {}),
      },
      home: {
        ...current.home,
        ...(changes.home || {}),
      },
      appearance: {
        ...current.appearance,
        ...(changes.appearance || {}),
      },
      notifications: {
        ...current.notifications,
        ...(changes.notifications || {}),
      },
      sync: {
        ...current.sync,
        ...(changes.sync || {}),
      },
    };

    this.persist('settings', updated);
    this.notify();
  }

  public getCustomCategories(): import('../types').CustomCategory[] {
    return this.load<import('../types').CustomCategory[]>('custom_categories', []);
  }

  public createCustomCategory(name: string, description?: string) {
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();

    const category: import('../types').CustomCategory = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description?.trim() || '',
      eyeglassIds: [],
      visible: true,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.id,
    };

    const categories = this.getCustomCategories();
    categories.push(category);

    this.persist('custom_categories', categories);
    this.notify();

    return category;
  }

  public updateCustomCategory(
    id: string,
    changes: Partial<Pick<import('../types').CustomCategory, 'name' | 'description' | 'visible'>>
  ) {
    const categories = this.getCustomCategories();
    const index = categories.findIndex((category) => category.id === id);

    if (index === -1) return null;

    categories[index] = {
      ...categories[index],
      ...changes,
      name: changes.name !== undefined ? changes.name.trim() : categories[index].name,
      description:
        changes.description !== undefined
          ? changes.description.trim()
          : categories[index].description,
      updatedAt: new Date().toISOString(),
    };

    this.persist('custom_categories', categories);
    this.notify();

    return categories[index];
  }

  public deleteCustomCategory(id: string) {
    const categories = this.getCustomCategories();
    const filtered = categories.filter((category) => category.id !== id);

    if (filtered.length === categories.length) return false;

    this.persist('custom_categories', filtered);
    this.notify();

    return true;
  }

  public addEyeglassesToCategory(categoryId: string, eyeglassIds: string[]) {
    const categories = this.getCustomCategories();
    const category = categories.find((item) => item.id === categoryId);

    if (!category) return null;

    category.eyeglassIds = Array.from(
      new Set([...category.eyeglassIds, ...eyeglassIds])
    );
    category.updatedAt = new Date().toISOString();

    this.persist('custom_categories', categories);
    this.notify();

    return category;
  }

  public removeEyeglassesFromCategory(categoryId: string, eyeglassIds: string[]) {
    const categories = this.getCustomCategories();
    const category = categories.find((item) => item.id === categoryId);

    if (!category) return null;

    const idsToRemove = new Set(eyeglassIds);

    category.eyeglassIds = category.eyeglassIds.filter(
      (id) => !idsToRemove.has(id)
    );
    category.updatedAt = new Date().toISOString();

    this.persist('custom_categories', categories);
    this.notify();

    return category;
  }

  public resetSettings() {
    localStorage.removeItem(STORAGE_PREFIX + 'settings');
    this.notify();
  }

}

export const db = new DatabaseService();

export async function syncWithCloud() {
  return {
    success: false,
    error: new Error('Sincronizzazione cloud disattivata: modalità dispositivo singolo.'),
  };
}

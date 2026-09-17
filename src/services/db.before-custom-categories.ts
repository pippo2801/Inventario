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
    this.clients = this.load('clients', initialClients);
    this.prescriptions = this.load('prescriptions', initialPrescriptions);
    this.sales = this.load('sales', initialSales);
    this.auditLogs = this.load('auditLogs', initialAuditLogs);
    this.notifications = this.load('notifications', initialNotifications);
    this.syncStatus = {
      state: 'synced',
      lastSyncTimestamp: new Date().toISOString(),
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

  private persist<T>(key: string, data: T) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    } catch (e) {
      console.warn(`Error saving ${key} to storage:`, e);
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

  public triggerSyncSimulation(callback?: () => void) {
    this.syncStatus.state = 'syncing';
    this.notify();
    setTimeout(() => {
      this.syncStatus.state = 'synced';
      this.syncStatus.lastSyncTimestamp = new Date().toISOString();
      this.syncStatus.pendingChangesCount = 0;
      this.notify();
      if (callback) callback();
    }, 1200);
  }

  public toggleOfflineMode() {
    if (this.syncStatus.state === 'offline') {
      this.triggerSyncSimulation();
    } else {
      this.syncStatus.state = 'offline';
      this.notify();
    }
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
    const newId = 'OPT-' + String(this.eyeglasses.length + 1).padStart(3, '0');
    const now = new Date().toISOString();
    const newItem: Eyeglass = {
      ...item,
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
    if (!product) {
      throw new Error('Prodotto non trovato');
    }

    const effectiveListPrice = product.isPromo && product.promoPrice ? product.promoPrice : product.salePrice;
    const finalPrice = Math.max(0, effectiveListPrice - data.discount);
    const estimatedGrossMargin = finalPrice - product.purchasePrice;

    const saleNumber = 'VND-' + new Date().getFullYear() + '-' + String(this.sales.length + 1).padStart(4, '0');
    const now = new Date().toISOString();

    const sale: Sale = {
      id: 'SALE-' + Date.now(),
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

    // 1. Update product: status = 'Venduto', isShowcase = false
    product.status = 'Venduto';
    product.isShowcase = false;
    product.updatedAt = now;
    product.updatedBy = this.currentUser.name;
    this.persist('eyeglasses', this.eyeglasses);

    // 2. Add to sales
    this.sales.unshift(sale);
    this.persist('sales', this.sales);

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
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: this.currentUser.name,
      organization: this.organization,
      users: this.users,
      eyeglasses: this.eyeglasses,
      clients: this.clients,
      prescriptions: this.prescriptions,
      sales: this.sales,
      auditLogs: this.auditLogs,
    };
    return JSON.stringify(backupData, null, 2);
  }

  public importBackupJson(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.eyeglasses || !Array.isArray(data.eyeglasses)) {
        return { success: false, message: 'Formato backup non valido: dati occhiali mancanti.' };
      }

      if (data.organization) this.organization = data.organization;
      if (data.eyeglasses) this.eyeglasses = data.eyeglasses;
      if (data.clients) this.clients = data.clients;
      if (data.prescriptions) this.prescriptions = data.prescriptions;
      if (data.sales) this.sales = data.sales;

      this.persist('organization', this.organization);
      this.persist('eyeglasses', this.eyeglasses);
      this.persist('clients', this.clients);
      this.persist('prescriptions', this.prescriptions);
      this.persist('sales', this.sales);

      this.addAuditLog('Backup', 'RESTORE-' + Date.now(), 'MODIFICA', 'Ripristinato backup manuale dei dati');
      this.notify();

      return { success: true, message: 'Database ripristinato con successo!' };
    } catch (e: any) {
      return { success: false, message: 'Errore di lettura file backup: ' + e.message };
    }
  }

  public resetToDemoData() {
    this.organization = initialOrganization;
    this.users = initialUsers;
    this.currentUser = initialUsers[0];
    this.eyeglasses = initialEyeglasses;
    this.clients = initialClients;
    this.prescriptions = initialPrescriptions;
    this.sales = initialSales;
    this.auditLogs = initialAuditLogs;
    this.notifications = initialNotifications;

    this.persist('organization', this.organization);
    this.persist('users', this.users);
    this.persist('currentUser', this.currentUser);
    this.persist('eyeglasses', this.eyeglasses);
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
        enabled: true,
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
      sync: { ...defaults.sync, ...saved.sync },
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

  public resetSettings() {
    localStorage.removeItem(STORAGE_PREFIX + 'settings');
    this.notify();
  }

}

export const db = new DatabaseService();

import { collection, doc, setDoc, getDocs, Timestamp } from 'firebase/firestore';
import { dbFirestore } from './firebase';

export async function syncWithCloud() {
  try {
    const localEyeglasses = JSON.parse(localStorage.getItem('eyeglasses') || '[]');
    
    for (const item of localEyeglasses) {
      await setDoc(doc(dbFirestore, 'eyeglasses', item.id), {
        ...item,
        updatedAt: Timestamp.now()
      }, { merge: true });
    }

    const querySnapshot = await getDocs(collection(dbFirestore, 'eyeglasses'));
    const cloudEyeglasses: any[] = [];
    querySnapshot.forEach((doc) => {
      cloudEyeglasses.push(doc.data());
    });

    if (cloudEyeglasses.length > 0) {
      localStorage.setItem('eyeglasses', JSON.stringify(cloudEyeglasses));
    }

    const syncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    localStorage.setItem('lastSyncTime', syncTime);
    return { success: true, time: syncTime };
  } catch (error) {
    console.error('Errore durante la sincronizzazione:', error);
    return { success: false, error };
  }
}

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../db';

// Mock localStorage
const createMockStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    get store() { return store; }
  };
};

describe('DatabaseService', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;
  
  beforeEach(() => {
    mockStorage = createMockStorage();
    vi.stubGlobal('localStorage', mockStorage);
    vi.resetModules();
  });
  
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Client Management', () => {
    it('should create a new client with all required fields', () => {
      const client = db.addClient({
        firstName: 'Mario',
        lastName: 'Rossi',
        fiscalCode: 'RSSMRA80C15H501Z',
        birthDate: '1980-03-15',
        phone: '+39 3XX XXXXXXX',
        email: 'mario.rossi@email.com',
        notes: 'Test note',
        isComplete: true,
      });
      
      expect(client.id).toMatch(/^CLI-\d{3}$/);
      expect(client.firstName).toBe('Mario');
      expect(client.lastName).toBe('Rossi');
      expect(client.fiscalCode).toBe('RSSMRA80C15H501Z');
      expect(client.createdAt).toBeDefined();
      expect(client.deletedAt).toBeNull();
      expect(client.version).toBe(1);
    });

    it('should retrieve client by ID', () => {
      const created = db.addClient({
        firstName: 'Luigi',
        lastName: 'Bianchi',
        fiscalCode: 'BNCMRA85D20F205X',
        phone: '+39 3XX XXXXXXX',
        isComplete: false,
      });
      
      const found = db.getClientById(created.id);
      expect(found).toEqual(created);
    });

    it('should filter out soft-deleted clients by default', () => {
      const client1 = db.addClient({
        firstName: 'Active',
        lastName: 'User',
        fiscalCode: 'ACTIVE00A01A001A',
        phone: '+39 3XX XXXXXXX',
        isComplete: false,
      });
      
      const client2 = db.addClient({
        firstName: 'Deleted',
        lastName: 'User',
        fiscalCode: 'DELETED00A01A001A',
        phone: '+39 3XX XXXXXXX',
        isComplete: false,
      });
      
      db.softDeleteClient(client2.id);
      
      const activeClients = db.getClients(false);
      const allClients = db.getClients(true);
      
      expect(activeClients.find(c => c.id === client1.id)).toBeDefined();
      expect(activeClients.find(c => c.id === client2.id)).toBeUndefined();
      expect(allClients.find(c => c.id === client2.id)).toBeDefined();
    });

    it('should restore soft-deleted client', () => {
      const client = db.addClient({
        firstName: 'ToRestore',
        lastName: 'User',
        fiscalCode: 'RESTORE00A01A001A',
        phone: '+39 3XX XXXXXXX',
        isComplete: false,
      });
      
      db.softDeleteClient(client.id);
      expect(db.getClients(false).find(c => c.id === client.id)).toBeUndefined();
      
      db.restoreClient(client.id);
      expect(db.getClients(false).find(c => c.id === client.id)).toBeDefined();
    });

    it('should update client with version increment', () => {
      const client = db.addClient({
        firstName: 'Original',
        lastName: 'Name',
        fiscalCode: 'ORIGINAL00A01A001A',
        phone: '+39 3XX XXXXXXX',
        isComplete: false,
      });
      
      const originalVersion = client.version;
      
      const updated = db.updateClient(client.id, { firstName: 'Updated' });
      
      expect(updated).toBeDefined();
      expect(updated!.firstName).toBe('Updated');
      expect(updated!.version).toBe(originalVersion + 1);
    });
  });

  describe('Eyeglass Management', () => {
    it('should create eyeglass with all required fields', () => {
      const eyeglass = db.addEyeglass({
        sku: 'TEST-001',
        supplierCode: 'SUP-001',
        brand: 'Ray-Ban',
        model: 'Aviator',
        color: 'Gold',
        gender: 'Unisex',
        purchasePrice: 80,
        salePrice: 150,
        isPromo: false,
        isShowcase: false,
        shape: 'Aviator',
        material: 'Metallo',
        location: 'A1',
        stockDate: new Date().toISOString(),
        notes: '',
        status: 'Disponibile',
        imageUrl: '',
      });
      
      expect(eyeglass.id).toMatch(/^EG-\d+$/);
      expect(eyeglass.brand).toBe('Ray-Ban');
      expect(eyeglass.status).toBe('Disponibile');
    });

    it('should execute fast sale and mark product as Venduto', () => {
      const eyeglass = db.addEyeglass({
        sku: 'SALE-001',
        supplierCode: 'SUP-001',
        brand: 'Test',
        model: 'SaleModel',
        color: 'Black',
        gender: 'Uomo',
        purchasePrice: 50,
        salePrice: 100,
        isPromo: false,
        isShowcase: false,
        shape: 'Rettangolare',
        material: 'Acetato',
        location: 'B1',
        stockDate: new Date().toISOString(),
        notes: '',
        status: 'Disponibile',
        imageUrl: '',
      });
      
      const sale = db.executeFastSale({
        productId: eyeglass.id,
        clientName: 'Cliente Test',
        discount: 0,
        paymentMethod: 'Contanti',
        receiptReference: 'RCPT-001',
      });
      
      expect(sale.productId).toBe(eyeglass.id);
      expect(sale.finalPrice).toBe(100);
      expect(sale.estimatedGrossMargin).toBe(50);
      
      const soldProduct = db.getEyeglassById(eyeglass.id);
      expect(soldProduct!.status).toBe('Venduto');
      expect(soldProduct!.isShowcase).toBe(false);
    });

    it('should restore eyeglass from sale and cancel the sale record', () => {
      const eyeglass = db.addEyeglass({
        sku: 'RESTORE-001',
        supplierCode: 'SUP-001',
        brand: 'Test',
        model: 'RestoreModel',
        color: 'Blue',
        gender: 'Donna',
        purchasePrice: 60,
        salePrice: 120,
        isPromo: false,
        isShowcase: false,
        shape: 'Rotondo',
        material: 'Titanio',
        location: 'C1',
        stockDate: new Date().toISOString(),
        notes: '',
        status: 'Disponibile',
        imageUrl: '',
      });
      
      // Sell it
      const sale = db.executeFastSale({
        productId: eyeglass.id,
        clientName: 'Cliente Test',
        discount: 10,
        paymentMethod: 'POS / Carta',
        receiptReference: 'RCPT-002',
      });
      
      expect(sale.id).toBeDefined();
      
      // Restore from sale
      const restored = db.restoreEyeglassFromSale(eyeglass.id);
      
      expect(restored).toBeDefined();
      expect(restored!.status).toBe('Disponibile');
      expect(restored!.isShowcase).toBe(false);
      
      // Check that the sale was soft-deleted
      const sales = db.getSales(false);
      const cancelledSale = sales.find(s => s.id === sale.id);
      expect(cancelledSale).toBeUndefined();
      
      // But it should exist in includeDeleted
      const allSales = db.getSales(true);
      const deletedSale = allSales.find(s => s.id === sale.id);
      expect(deletedSale).toBeDefined();
      expect(deletedSale!.deletedAt).toBeDefined();
    });

    it('should handle multiple sales for same product correctly on restore', () => {
      const eyeglass = db.addEyeglass({
        sku: 'MULTI-001',
        supplierCode: 'SUP-001',
        brand: 'Test',
        model: 'MultiSale',
        color: 'Red',
        gender: 'Uomo',
        purchasePrice: 50,
        salePrice: 100,
        isPromo: false,
        isShowcase: false,
        shape: 'Squadrato',
        material: 'Misto',
        location: 'D1',
        stockDate: new Date().toISOString(),
        notes: '',
        status: 'Disponibile',
        imageUrl: '',
      });
      
      // First sale
      const sale1 = db.executeFastSale({
        productId: eyeglass.id,
        clientName: 'Client 1',
        discount: 0,
        paymentMethod: 'Contanti',
        receiptReference: 'RCPT-1',
      });
      
      // Restore
      db.restoreEyeglassFromSale(eyeglass.id);
      
      // Second sale (same product sold again)
      const sale2 = db.executeFastSale({
        productId: eyeglass.id,
        clientName: 'Client 2',
        discount: 5,
        paymentMethod: 'Contanti',
        receiptReference: 'RCPT-2',
      });
      
      // Restore again - should cancel the MOST RECENT sale (sale2)
      const restored = db.restoreEyeglassFromSale(eyeglass.id);
      
      expect(restored).toBeDefined();
      
      // sale2 should be cancelled, sale1 should remain cancelled from first restore
      const allSales = db.getSales(true);
      const s1 = allSales.find(s => s.id === sale1.id);
      const s2 = allSales.find(s => s.id === sale2.id);
      
      expect(s1?.deletedAt).toBeDefined(); // Still cancelled
      expect(s2?.deletedAt).toBeDefined(); // Also cancelled now
    });
  });

  describe('Soft Delete and Restore Integrity', () => {
    it('should maintain audit trail on restore from sale', () => {
      const eyeglass = db.addEyeglass({
        sku: 'AUDIT-001',
        supplierCode: 'SUP-001',
        brand: 'AuditTest',
        model: 'Model',
        color: 'Green',
        gender: 'Unisex',
        purchasePrice: 40,
        salePrice: 90,
        isPromo: false,
        isShowcase: false,
        shape: 'Cat-eye',
        material: 'Legno',
        location: 'E1',
        stockDate: new Date().toISOString(),
        notes: '',
        status: 'Disponibile',
        imageUrl: '',
      });
      
      const sale = db.executeFastSale({
        productId: eyeglass.id,
        clientName: 'Audit Client',
        discount: 0,
        paymentMethod: 'Contanti',
        receiptReference: 'RCPT-AUDIT',
      });
      
      db.restoreEyeglassFromSale(eyeglass.id);
      
      const auditLogs = db.getAuditLogs();
      const restoreLog = auditLogs.find(log => 
        log.operation === 'RIPRISTINO_VENDITA' && log.entityId === eyeglass.id
      );
      
      expect(restoreLog).toBeDefined();
      expect(restoreLog?.details).toContain('annullata');
      
      const cancelLog = auditLogs.find(log => 
        log.operation === 'ANNULLAMENTO' && log.entityId === sale.id
      );
      
      expect(cancelLog).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should calculate inventory statistics correctly', () => {
      // Add available eyeglasses
      db.addEyeglass({
        sku: 'STAT-1',
        supplierCode: 'SUP',
        brand: 'Brand1',
        model: 'Model1',
        color: 'Black',
        gender: 'Uomo',
        purchasePrice: 50,
        salePrice: 100,
        isPromo: false,
        isShowcase: false,
        shape: 'Rettangolare',
        material: 'Acetato',
        location: 'A1',
        stockDate: new Date().toISOString(),
        notes: '',
        status: 'Disponibile',
        imageUrl: '',
      });
      
      db.addEyeglass({
        sku: 'STAT-2',
        supplierCode: 'SUP',
        brand: 'Brand2',
        model: 'Model2',
        color: 'White',
        gender: 'Donna',
        purchasePrice: 60,
        salePrice: 150,
        isPromo: true,
        promoPrice: 120,
        isShowcase: true,
        shape: 'Rotondo',
        material: 'Metallo',
        location: 'A2',
        stockDate: new Date().toISOString(),
        notes: '',
        status: 'Disponibile',
        imageUrl: '',
      });
      
      const stats = db.getInventoryStatistics();
      
      expect(stats.totalPieces).toBe(2);
      expect(stats.totalPurchaseValue).toBe(110);
      expect(stats.totalRetailValue).toBe(220); // 100 + 120 (promo price)
      expect(stats.showcasePieces).toBe(1);
      expect(stats.promoPieces).toBe(1);
    });

    it('should calculate sales statistics correctly', () => {
      const eyeglass1 = db.addEyeglass({
        sku: 'SALE-STAT-1',
        supplierCode: 'SUP',
        brand: 'Brand',
        model: 'Model',
        color: 'Color',
        gender: 'Uomo',
        purchasePrice: 50,
        salePrice: 100,
        isPromo: false,
        isShowcase: false,
        shape: 'Rettangolare',
        material: 'Acetato',
        location: 'A1',
        stockDate: new Date().toISOString(),
        notes: '',
        status: 'Disponibile',
        imageUrl: '',
      });
      
      db.executeFastSale({
        productId: eyeglass1.id,
        clientName: 'Client',
        discount: 0,
        paymentMethod: 'Contanti',
        receiptReference: 'RCPT',
      });
      
      const stats = db.getSalesStatistics();
      
      expect(stats.todayPieces).toBe(1);
      expect(stats.todayRevenue).toBe(100);
      expect(stats.totalGrossMarginRealized).toBe(50);
    });
  });

  describe('Custom Categories', () => {
    it('should create, update, and delete custom categories', () => {
      const cat = db.createCustomCategory('Test Category', 'Description');
      
      expect(cat.name).toBe('Test Category');
      expect(cat.description).toBe('Description');
      expect(cat.eyeglassIds).toEqual([]);
      expect(cat.visible).toBe(true);
      
      const updated = db.updateCustomCategory(cat.id, { name: 'Updated Name' });
      expect(updated?.name).toBe('Updated Name');
      
      const deleted = db.deleteCustomCategory(cat.id);
      expect(deleted).toBe(true);
      
      const cats = db.getCustomCategories();
      expect(cats.find(c => c.id === cat.id)).toBeUndefined();
    });

    it('should add and remove eyeglasses from category', () => {
      const eyeglass = db.addEyeglass({
        sku: 'CAT-001',
        supplierCode: 'SUP',
        brand: 'Brand',
        model: 'Model',
        color: 'Color',
        gender: 'Uomo',
        purchasePrice: 50,
        salePrice: 100,
        isPromo: false,
        isShowcase: false,
        shape: 'Rettangolare',
        material: 'Acetato',
        location: 'A1',
        stockDate: new Date().toISOString(),
        notes: '',
        status: 'Disponibile',
        imageUrl: '',
      });
      
      const cat = db.createCustomCategory('Eyeglass Category');
      
      db.addEyeglassesToCategory(cat.id, [eyeglass.id]);
      
      const catWithEyeglass = db.getCustomCategories().find(c => c.id === cat.id);
      expect(catWithEyeglass?.eyeglassIds).toContain(eyeglass.id);
      
      db.removeEyeglassesFromCategory(cat.id, [eyeglass.id]);
      
      const catWithoutEyeglass = db.getCustomCategories().find(c => c.id === cat.id);
      expect(catWithoutEyeglass?.eyeglassIds).not.toContain(eyeglass.id);
    });
  });

  describe('Backup and Restore', () => {
    it('should export backup data', () => {
      // Add some data
      db.addClient({
        firstName: 'Backup',
        lastName: 'Test',
        fiscalCode: 'BACKUP00A01A001A',
        phone: '+39 3XX XXXXXXX',
        isComplete: false,
      });
      
      db.addEyeglass({
        sku: 'BACKUP-001',
        supplierCode: 'SUP',
        brand: 'Brand',
        model: 'Model',
        color: 'Color',
        gender: 'Uomo',
        purchasePrice: 50,
        salePrice: 100,
        isPromo: false,
        isShowcase: false,
        shape: 'Rettangolare',
        material: 'Acetato',
        location: 'A1',
        stockDate: new Date().toISOString(),
        notes: '',
        status: 'Disponibile',
        imageUrl: '',
      });
      
      const backupJson = db.exportBackupData();
      const backupData = JSON.parse(backupJson);
      
      expect(backupData.clients).toBeDefined();
      expect(backupData.eyeglasses).toBeDefined();
      expect(backupData.clients.length).toBeGreaterThan(0);
    });
  });
});

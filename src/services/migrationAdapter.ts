/**
 * Pure preparation layer for a future local -> cloud migration.
 * This module performs no I/O and never mutates the supplied local snapshot.
 * It deliberately does not generate Firestore document IDs or write to Firebase.
 */

export type LegacyRecord = Record<string, unknown>;

export interface LegacyMigrationSnapshot {
  eyeglasses: LegacyRecord[];
  clients: LegacyRecord[];
  prescriptions: LegacyRecord[];
  sales: LegacyRecord[];
}

export type MigrationCollection = keyof LegacyMigrationSnapshot;

/**
 * Validates and extracts only the four business collections from a parsed backup.
 * Backup metadata and unrelated fields are intentionally ignored.
 */
export function extractLegacyMigrationSnapshot(value: unknown): LegacyMigrationSnapshot {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Formato backup non valido.');
  }

  const source = value as Record<string, unknown>;
  const collections: MigrationCollection[] = ['eyeglasses', 'clients', 'prescriptions', 'sales'];

  for (const collection of collections) {
    if (!Array.isArray(source[collection])) {
      throw new Error(`Backup incompleto: raccolta ${collection} mancante o non valida.`);
    }
  }

  return {
    eyeglasses: source.eyeglasses as LegacyRecord[],
    clients: source.clients as LegacyRecord[],
    prescriptions: source.prescriptions as LegacyRecord[],
    sales: source.sales as LegacyRecord[],
  };
}

export interface PreparedMigrationRecord extends LegacyRecord {
  organizationId: string;
  legacyId: string;
  schemaVersion: 1;
}

export interface MigrationIssue {
  code:
    | 'INVALID_ORGANIZATION_ID'
    | 'INVALID_COLLECTION'
    | 'INVALID_RECORD'
    | 'MISSING_LEGACY_ID'
    | 'DUPLICATE_LEGACY_ID'
    | 'DUPLICATE_SKU'
    | 'DUPLICATE_FISCAL_CODE'
    | 'DUPLICATE_SALE_NUMBER'
    | 'ORPHAN_PRODUCT_REFERENCE'
    | 'ORPHAN_CLIENT_REFERENCE'
    | 'ORPHAN_SALE_CLIENT_REFERENCE';
  collection?: MigrationCollection;
  legacyId?: string;
  message: string;
}

export interface PreparedMigration {
  ready: boolean;
  organizationId: string;
  records: Record<MigrationCollection, PreparedMigrationRecord[]>;
  counts: Record<MigrationCollection, number>;
  issues: MigrationIssue[];
}

const COLLECTIONS: MigrationCollection[] = [
  'eyeglasses',
  'clients',
  'prescriptions',
  'sales',
];

function isRecord(value: unknown): value is LegacyRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const REQUIRED_FIELDS: Record<MigrationCollection, Record<string, 'string' | 'number' | 'boolean' | 'object'>> = {
  eyeglasses: {
    sku: 'string', supplierCode: 'string', brand: 'string', model: 'string', color: 'string',
    gender: 'string', purchasePrice: 'number', salePrice: 'number', isPromo: 'boolean',
    isShowcase: 'boolean', location: 'string', status: 'string', stockDate: 'string',
    imageUrl: 'string', createdAt: 'string', updatedAt: 'string', createdBy: 'string',
    updatedBy: 'string', version: 'number', deletedAt: 'string',
  },
  clients: {
    firstName: 'string', lastName: 'string', fiscalCode: 'string', phone: 'string',
    isComplete: 'boolean', createdAt: 'string', updatedAt: 'string', createdBy: 'string',
    updatedBy: 'string', version: 'number', deletedAt: 'string',
  },
  prescriptions: {
    clientName: 'string', date: 'string', doctorOrOptometrist: 'string', od: 'object', os: 'object',
    pd: 'object', status: 'string', createdAt: 'string', updatedAt: 'string', createdBy: 'string',
    updatedBy: 'string', version: 'number', deletedAt: 'string',
  },
  sales: {
    saleNumber: 'string', date: 'string', productId: 'string', productDescription: 'string',
    productPurchasePrice: 'number', listPrice: 'number', discount: 'number', finalPrice: 'number',
    estimatedGrossMargin: 'number', paymentMethod: 'string', receiptReference: 'string',
    operatorId: 'string', operatorName: 'string', createdAt: 'string', deletedAt: 'string',
  },
};

function hasExpectedType(value: unknown, expected: 'string' | 'number' | 'boolean' | 'object'): boolean {
  if (expected === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (expected === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === expected;
}

function isValidDate(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  const normalized = value.trim();
  const datePart = normalized.slice(0, 10);
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    const calendarDateIsValid = parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
    if (!calendarDateIsValid) return false;
    return normalized.length === 10 || (/^\\d{4}-\\d{2}-\\d{2}T/.test(normalized) && Number.isFinite(Date.parse(normalized)));
  }
  // Retain compatibility with legacy date strings outside ISO format.
  return Number.isFinite(Date.parse(normalized));
}

function validateRequiredFields(collection: MigrationCollection, item: LegacyRecord): string[] {
  const invalid: string[] = [];
  for (const [field, expected] of Object.entries(REQUIRED_FIELDS[collection])) {
    const value = item[field];
    // deletedAt is nullable in the domain types; null is a valid explicit value.
    if (field === 'deletedAt' && value === null) continue;
    if (!hasExpectedType(value, expected)) invalid.push(field);
  }

  const nonEmptyFields: Record<MigrationCollection, string[]> = {
    eyeglasses: ['sku', 'supplierCode', 'brand', 'model', 'color', 'gender', 'location', 'status', 'stockDate', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'],
    clients: ['firstName', 'lastName', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'],
    prescriptions: ['clientName', 'date', 'doctorOrOptometrist', 'status', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'],
    sales: ['saleNumber', 'date', 'productId', 'productDescription', 'paymentMethod', 'operatorId', 'operatorName', 'createdAt'],
  };
  for (const field of nonEmptyFields[collection]) {
    if (typeof item[field] === 'string' && !item[field].trim()) invalid.push(field);
  }

  const dateFields: Record<MigrationCollection, string[]> = {
    eyeglasses: ['stockDate', 'createdAt', 'updatedAt'],
    clients: ['createdAt', 'updatedAt'],
    prescriptions: ['date', 'createdAt', 'updatedAt'],
    sales: ['date', 'createdAt'],
  };
  for (const field of dateFields[collection]) {
    if (!isValidDate(item[field])) invalid.push(field);
  }
  if (['eyeglasses', 'clients', 'prescriptions'].includes(collection) &&
    (!Number.isInteger(item.version) || (item.version as number) < 1)) {
    invalid.push('version');
  }

  if (collection === 'eyeglasses') {
    for (const field of ['promoStartDate', 'promoEndDate']) {
      if (item[field] !== undefined && item[field] !== '' && !isValidDate(item[field])) invalid.push(field);
    }
    for (const field of ['purchasePrice', 'salePrice']) {
      if (typeof item[field] === 'number' && item[field] < 0) invalid.push(field);
    }
    if (item.promoPrice !== undefined && item.promoPrice !== null &&
      (typeof item.promoPrice !== 'number' || !Number.isFinite(item.promoPrice) || item.promoPrice < 0)) {
      invalid.push('promoPrice');
    }
  }

  const allowedValues: Partial<Record<MigrationCollection, Record<string, string[]>>> = {
    eyeglasses: { gender: ['Uomo', 'Donna', 'Unisex'], status: ['Disponibile', 'Venduto'] },
    prescriptions: { status: ['CONFERMATA', 'DA_VERIFICARE', 'COMPLETA'] },
    sales: { paymentMethod: ['Contanti', 'POS / Carta', 'Carta', 'Bonifico', 'Bonifico Bancario', 'Satispay / Altro', 'Altro'] },
  };
  for (const [field, values] of Object.entries(allowedValues[collection] ?? {})) {
    if (typeof item[field] === 'string' && !values.includes(item[field] as string)) invalid.push(field);
  }

  if (collection === 'prescriptions') {
    for (const eye of ['od', 'os']) {
      const data = item[eye];
      if (isRecord(data)) {
        for (const field of ['sph', 'cyl', 'ax']) {
          if (typeof data[field] !== 'number' || !Number.isFinite(data[field])) invalid.push(eye + '.' + field);
        }
        if (typeof data.ax === 'number' && (data.ax < 0 || data.ax > 180)) invalid.push(eye + '.ax');
        if (data.add !== undefined && (typeof data.add !== 'number' || !Number.isFinite(data.add))) invalid.push(eye + '.add');
      }
    }
    const pd = item.pd;
    if (isRecord(pd)) {
      if (typeof pd.total !== 'number' || !Number.isFinite(pd.total) || pd.total <= 0) invalid.push('pd.total');
      for (const eye of ['od', 'os']) {
        if (pd[eye] !== undefined && (typeof pd[eye] !== 'number' || !Number.isFinite(pd[eye]) || (pd[eye] as number) <= 0)) {
          invalid.push('pd.' + eye);
        }
      }
    }
    if (item.mountingHeight !== undefined &&
      (typeof item.mountingHeight !== 'number' || !Number.isFinite(item.mountingHeight) || item.mountingHeight <= 0)) {
      invalid.push('mountingHeight');
    }
    if (item.lensType !== undefined && !['Monofocali', 'Progressive', 'Degressive', 'Da riposo', 'Solari Graduati'].includes(String(item.lensType))) {
      invalid.push('lensType');
    }
  }

  if (collection === 'sales') {
    for (const field of ['productPurchasePrice', 'listPrice', 'discount', 'finalPrice']) {
      if (typeof item[field] === 'number' && item[field] < 0) invalid.push(field);
    }
    if (typeof item.discount === 'number' && typeof item.listPrice === 'number' && item.discount > item.listPrice) invalid.push('discount');
    if (typeof item.finalPrice === 'number' && typeof item.listPrice === 'number' && typeof item.discount === 'number' &&
      Math.abs(item.finalPrice - (item.listPrice - item.discount)) > 0.02) invalid.push('finalPrice');
    if (typeof item.estimatedGrossMargin === 'number' && typeof item.finalPrice === 'number' && typeof item.productPurchasePrice === 'number' &&
      Math.abs(item.estimatedGrossMargin - (item.finalPrice - item.productPurchasePrice)) > 0.02) invalid.push('estimatedGrossMargin');
  }

  return [...new Set(invalid)];
}

export function prepareLegacyMigration(
  organizationId: string,
  snapshot: LegacyMigrationSnapshot,
): PreparedMigration {
  const issues: MigrationIssue[] = [];
  const records = {
    eyeglasses: [],
    clients: [],
    prescriptions: [],
    sales: [],
  } as Record<MigrationCollection, PreparedMigrationRecord[]>;

  if (typeof organizationId !== 'string' || !organizationId.trim()) {
    issues.push({
      code: 'INVALID_ORGANIZATION_ID',
      message: 'È necessario un ID organizzazione assegnato dal backend.',
    });
  }

  const seenSkus = new Set<string>();
  const seenFiscalCodes = new Set<string>();
  const seenSaleNumbers = new Set<string>();
  const ids = {
    eyeglasses: new Set<string>(),
    clients: new Set<string>(),
    prescriptions: new Set<string>(),
    sales: new Set<string>(),
  };

  for (const collection of COLLECTIONS) {
    const source = snapshot?.[collection];
    if (!Array.isArray(source)) {
      issues.push({
        code: 'INVALID_COLLECTION',
        collection,
        message: `La raccolta ${collection} non è un array valido.`,
      });
      continue;
    }

    for (const item of source) {
      if (!isRecord(item)) {
        issues.push({
          code: 'INVALID_RECORD',
          collection,
          message: `Record non valido nella raccolta ${collection}.`,
        });
        continue;
      }

      const legacyId = item.id;
      if (typeof legacyId !== 'string' || !legacyId.trim()) {
        issues.push({
          code: 'MISSING_LEGACY_ID',
          collection,
          message: `Record senza ID locale nella raccolta ${collection}.`,
        });
        continue;
      }

      if (ids[collection].has(legacyId)) {
        issues.push({
          code: 'DUPLICATE_LEGACY_ID',
          collection,
          legacyId,
          message: `ID locale duplicato ${legacyId} nella raccolta ${collection}.`,
        });
        continue;
      }

      const invalidFields = validateRequiredFields(collection, item);
      if (invalidFields.length > 0) {
        issues.push({
          code: 'INVALID_RECORD',
          collection,
          ...(typeof item.id === 'string' && item.id.trim() ? { legacyId: item.id } : {}),
          message: `Campi obbligatori mancanti o non validi in ${collection}: ${invalidFields.join(', ')}.`,
        });
        continue;
      }

      if (collection === 'clients') {
        const fiscalCode = item.fiscalCode;
        if (typeof fiscalCode === 'string' && fiscalCode.trim()) {
          const normalizedFiscalCode = fiscalCode.replace(/\s+/g, '').toLocaleUpperCase('it-IT');
          if (seenFiscalCodes.has(normalizedFiscalCode)) {
            issues.push({
              code: 'DUPLICATE_FISCAL_CODE',
              collection,
              legacyId,
              message: 'Codice fiscale duplicato tra i clienti; valore omesso per privacy.',
            });
          } else {
            seenFiscalCodes.add(normalizedFiscalCode);
          }
        }
      }

      if (collection === 'sales') {
        const saleNumber = item.saleNumber;
        if (typeof saleNumber === 'string' && saleNumber.trim()) {
          const normalizedSaleNumber = saleNumber.trim().toLocaleUpperCase('it-IT');
          if (seenSaleNumbers.has(normalizedSaleNumber)) {
            issues.push({
              code: 'DUPLICATE_SALE_NUMBER',
              collection,
              legacyId,
              message: 'Numero vendita duplicato nella raccolta vendite.',
            });
          } else {
            seenSaleNumbers.add(normalizedSaleNumber);
          }
        }
      }

      if (collection === 'eyeglasses') {
        const sku = item.sku;
        if (typeof sku === 'string' && sku.trim()) {
          const normalizedSku = sku.trim().toLocaleUpperCase('it-IT');
          if (seenSkus.has(normalizedSku)) {
            issues.push({
              code: 'DUPLICATE_SKU',
              collection,
              legacyId,
              message: 'SKU duplicato nella raccolta occhiali.',
            });
          } else {
            seenSkus.add(normalizedSku);
          }
        }
      }

      ids[collection].add(legacyId);
      records[collection].push({
        ...item,
        organizationId: organizationId.trim(),
        legacyId,
        schemaVersion: 1,
      });
    }
  }

  for (const sale of records.sales) {
    const productId = sale.productId;
    if (typeof productId !== 'string' || !ids.eyeglasses.has(productId)) {
      issues.push({
        code: 'ORPHAN_PRODUCT_REFERENCE',
        collection: 'sales',
        legacyId: sale.legacyId,
        message: `La vendita ${sale.legacyId} non trova il prodotto locale ${String(productId ?? '')}.`,
      });
    }
  }

  for (const sale of records.sales) {
    const clientId = sale.clientId;
    if (
      clientId !== undefined &&
      clientId !== null &&
      clientId !== '' &&
      (typeof clientId !== 'string' || !ids.clients.has(clientId))
    ) {
      issues.push({
        code: 'ORPHAN_SALE_CLIENT_REFERENCE',
        collection: 'sales',
        legacyId: sale.legacyId,
        message: 'La vendita fa riferimento a un cliente locale non presente.',
      });
    }
  }

  for (const prescription of records.prescriptions) {
    const clientId = prescription.clientId;
    if (
      clientId !== undefined &&
      clientId !== null &&
      clientId !== '' &&
      (typeof clientId !== 'string' || !ids.clients.has(clientId))
    ) {
      issues.push({
        code: 'ORPHAN_CLIENT_REFERENCE',
        collection: 'prescriptions',
        legacyId: prescription.legacyId,
        message: `La prescrizione ${prescription.legacyId} non trova il cliente locale ${String(clientId)}.`,
      });
    }
  }

  // Counts describe source entries, not only valid prepared records. This keeps
  // the preview honest when malformed or duplicate records are rejected.
  const counts = {
    eyeglasses: Array.isArray(snapshot?.eyeglasses) ? snapshot.eyeglasses.length : 0,
    clients: Array.isArray(snapshot?.clients) ? snapshot.clients.length : 0,
    prescriptions: Array.isArray(snapshot?.prescriptions) ? snapshot.prescriptions.length : 0,
    sales: Array.isArray(snapshot?.sales) ? snapshot.sales.length : 0,
  };

  return {
    ready: issues.length === 0,
    organizationId: typeof organizationId === 'string' ? organizationId.trim() : '',
    records,
    counts,
    issues,
  };
}

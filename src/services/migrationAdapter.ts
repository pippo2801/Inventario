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
    | 'ORPHAN_PRODUCT_REFERENCE'
    | 'ORPHAN_CLIENT_REFERENCE';
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

  const counts = {
    eyeglasses: records.eyeglasses.length,
    clients: records.clients.length,
    prescriptions: records.prescriptions.length,
    sales: records.sales.length,
  };

  return {
    ready: issues.length === 0,
    organizationId: typeof organizationId === 'string' ? organizationId.trim() : '',
    records,
    counts,
    issues,
  };
}

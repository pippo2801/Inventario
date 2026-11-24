import { describe, expect, it } from 'vitest';
import { extractLegacyMigrationSnapshot, prepareLegacyMigration, type LegacyMigrationSnapshot } from '../migrationAdapter';

const validSnapshot: LegacyMigrationSnapshot = {
  eyeglasses: [{ id: 'OPT-001', brand: 'Ray-Ban', status: 'Disponibile' }],
  clients: [{ id: 'CLI-001', firstName: 'Mario' }],
  prescriptions: [{ id: 'PRE-001', clientId: 'CLI-001' }],
  sales: [{ id: 'SALE-001', productId: 'OPT-001', finalPrice: 120 }],
};

describe('extractLegacyMigrationSnapshot', () => {
  it('extracts all four collections from the actual flat backup shape', () => {
    const backup = {
      app: 'Studio Ottico Di Pietro',
      schemaVersion: 2,
      exportedAt: '2026-11-24T10:00:00.000Z',
      ...validSnapshot,
      auditLogs: [{ id: 'AUD-1' }],
    };

    expect(extractLegacyMigrationSnapshot(backup)).toEqual(validSnapshot);
  });

  it('rejects a backup missing any required business collection', () => {
    const incompleteBackup = {
      eyeglasses: validSnapshot.eyeglasses,
      clients: validSnapshot.clients,
      prescriptions: validSnapshot.prescriptions,
    };

    expect(() => extractLegacyMigrationSnapshot(incompleteBackup)).toThrow(
      'Backup incompleto: raccolta sales mancante o non valida.'
    );
  });

  it('rejects a non-object backup instead of treating it as empty data', () => {
    expect(() => extractLegacyMigrationSnapshot(null)).toThrow('Formato backup non valido.');
    expect(() => extractLegacyMigrationSnapshot([])).toThrow('Formato backup non valido.');
  });

});

describe('prepareLegacyMigration', () => {
  it('prepares tenant-scoped copies and preserves legacy IDs', () => {
    const result = prepareLegacyMigration('org-test', validSnapshot);

    expect(result.ready).toBe(true);
    expect(result.counts).toEqual({
      eyeglasses: 1,
      clients: 1,
      prescriptions: 1,
      sales: 1,
    });
    expect(result.records.eyeglasses[0]).toMatchObject({
      id: 'OPT-001',
      legacyId: 'OPT-001',
      organizationId: 'org-test',
      schemaVersion: 1,
    });
    expect(result.records.sales[0].productId).toBe('OPT-001');
  });

  it('does not mutate the local snapshot', () => {
    const original = JSON.stringify(validSnapshot);
    prepareLegacyMigration('org-test', validSnapshot);
    expect(JSON.stringify(validSnapshot)).toBe(original);
  });

  it('blocks an empty organization ID', () => {
    const result = prepareLegacyMigration('  ', validSnapshot);
    expect(result.ready).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('INVALID_ORGANIZATION_ID');
  });

  it('reports duplicate local IDs without silently overwriting', () => {
    const snapshot = {
      ...validSnapshot,
      eyeglasses: [
        ...validSnapshot.eyeglasses,
        { id: 'OPT-001', brand: 'Duplicate' },
      ],
    };
    const result = prepareLegacyMigration('org-test', snapshot);

    expect(result.ready).toBe(false);
    expect(result.records.eyeglasses).toHaveLength(1);
    expect(result.issues.map((issue) => issue.code)).toContain('DUPLICATE_LEGACY_ID');
  });

  it('detects duplicate SKUs case-insensitively without dropping either product', () => {
    const snapshot = {
      ...validSnapshot,
      eyeglasses: [
        { id: 'OPT-001', sku: 'RB-3025' },
        { id: 'OPT-002', sku: 'rb-3025' },
      ],
      sales: [],
    };
    const result = prepareLegacyMigration('org-test', snapshot);

    expect(result.ready).toBe(false);
    expect(result.records.eyeglasses).toHaveLength(2);
    expect(result.issues.map((issue) => issue.code)).toContain('DUPLICATE_SKU');
  });

  it('detects duplicate fiscal codes without exposing the value in diagnostics', () => {
    const snapshot = {
      ...validSnapshot,
      clients: [
        { id: 'CLI-001', fiscalCode: 'RSSMRA80A01H501U' },
        { id: 'CLI-002', fiscalCode: ' rssmra80a01h501u ' },
      ],
    };
    const result = prepareLegacyMigration('org-test', snapshot);
    const duplicateIssue = result.issues.find((issue) => issue.code === 'DUPLICATE_FISCAL_CODE');

    expect(result.ready).toBe(false);
    expect(duplicateIssue).toBeDefined();
    expect(duplicateIssue?.message).not.toContain('RSSMRA80A01H501U');
  });

  it('detects duplicate sale numbers without dropping either sale', () => {
    const snapshot = {
      ...validSnapshot,
      sales: [
        { id: 'SALE-001', saleNumber: 'VND-2026-0001', productId: 'OPT-001' },
        { id: 'SALE-002', saleNumber: 'vnd-2026-0001', productId: 'OPT-001' },
      ],
    };
    const result = prepareLegacyMigration('org-test', snapshot);

    expect(result.ready).toBe(false);
    expect(result.records.sales).toHaveLength(2);
    expect(result.issues.map((issue) => issue.code)).toContain('DUPLICATE_SALE_NUMBER');
  });

  it('reports sales whose product is missing', () => {
    const snapshot = {
      ...validSnapshot,
      sales: [{ id: 'SALE-ORPHAN', productId: 'OPT-MISSING' }],
    };
    const result = prepareLegacyMigration('org-test', snapshot);

    expect(result.ready).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('ORPHAN_PRODUCT_REFERENCE');
  });

  it('reports prescriptions whose referenced client is missing', () => {
    const snapshot = {
      ...validSnapshot,
      prescriptions: [{ id: 'PRE-ORPHAN', clientId: 'CLI-MISSING' }],
    };
    const result = prepareLegacyMigration('org-test', snapshot);

    expect(result.ready).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('ORPHAN_CLIENT_REFERENCE');
  });

  it('reports sales whose optional client reference is missing', () => {
    const snapshot = {
      ...validSnapshot,
      sales: [{ id: 'SALE-ORPHAN-CLIENT', productId: 'OPT-001', clientId: 'CLI-MISSING' }],
    };
    const result = prepareLegacyMigration('org-test', snapshot);

    expect(result.ready).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('ORPHAN_SALE_CLIENT_REFERENCE');
  });

  it('allows sales without an associated client', () => {
    const snapshot = {
      ...validSnapshot,
      sales: [{ id: 'SALE-WALK-IN', productId: 'OPT-001' }],
    };
    const result = prepareLegacyMigration('org-test', snapshot);

    expect(result.ready).toBe(true);
  });

  it('preserves soft-deleted products and historical sales referencing them', () => {
    const deletedAt = '2026-10-02T12:00:00.000Z';
    const snapshot = {
      ...validSnapshot,
      eyeglasses: [{ id: 'OPT-OLD', sku: 'OLD-001', deletedAt }],
      sales: [{ id: 'SALE-HISTORY', productId: 'OPT-OLD', deletedAt: null }],
    };
    const result = prepareLegacyMigration('org-test', snapshot);

    expect(result.ready).toBe(true);
    expect(result.records.eyeglasses[0]).toMatchObject({ id: 'OPT-OLD', deletedAt });
    expect(result.records.sales[0].productId).toBe('OPT-OLD');
  });

  it('allows prescriptions without a linked client', () => {
    const snapshot = {
      ...validSnapshot,
      prescriptions: [{ id: 'PRE-WALK-IN' }],
    };
    const result = prepareLegacyMigration('org-test', snapshot);
    expect(result.ready).toBe(true);
  });

  it('keeps historical links to soft-deleted clients', () => {
    const deletedAt = '2026-09-15T09:30:00.000Z';
    const snapshot = {
      ...validSnapshot,
      clients: [{ id: 'CLI-OLD', deletedAt }],
      prescriptions: [{ id: 'PRE-OLD', clientId: 'CLI-OLD' }],
      sales: [{ id: 'SALE-OLD', productId: 'OPT-001', clientId: 'CLI-OLD' }],
    };
    const result = prepareLegacyMigration('org-test', snapshot);

    expect(result.ready).toBe(true);
    expect(result.records.clients[0].deletedAt).toBe(deletedAt);
    expect(result.records.prescriptions[0].clientId).toBe('CLI-OLD');
    expect(result.records.sales[0].clientId).toBe('CLI-OLD');
  });

  it('rejects malformed records and missing IDs', () => {
    const snapshot = {
      ...validSnapshot,
      clients: [null, { firstName: 'No ID' }] as unknown as LegacyMigrationSnapshot['clients'],
    };
    const result = prepareLegacyMigration('org-test', snapshot);

    expect(result.ready).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('INVALID_RECORD');
    expect(result.issues.map((issue) => issue.code)).toContain('MISSING_LEGACY_ID');
  });
});

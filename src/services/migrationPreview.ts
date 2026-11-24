import db from './db';
import { prepareLegacyMigration, type LegacyMigrationSnapshot, type PreparedMigration } from './migrationAdapter';

/**
 * Builds a read-only preview from the app's current local backup snapshot.
 * The organization ID must come from a future authenticated backend session;
 * the local organization ID is intentionally not trusted as cloud identity.
 */
export function createLocalMigrationPreview(organizationId: string): PreparedMigration {
  const serializedSnapshot = db.exportBackupData();
  const backup: unknown = JSON.parse(serializedSnapshot);

  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
    throw new Error('Il backup locale non ha un formato valido.');
  }

  const data = backup as Record<string, unknown>;
  const snapshot: LegacyMigrationSnapshot = {
    eyeglasses: Array.isArray(data.eyeglasses) ? data.eyeglasses as LegacyMigrationSnapshot['eyeglasses'] : [],
    clients: Array.isArray(data.clients) ? data.clients as LegacyMigrationSnapshot['clients'] : [],
    prescriptions: Array.isArray(data.prescriptions) ? data.prescriptions as LegacyMigrationSnapshot['prescriptions'] : [],
    sales: Array.isArray(data.sales) ? data.sales as LegacyMigrationSnapshot['sales'] : [],
  };

  return prepareLegacyMigration(organizationId, snapshot);
}

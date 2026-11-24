import { describe, expect, it } from 'vitest';
import { decryptBackup, encryptBackup } from './backupCrypto';

describe('encrypted backup', () => {
  it('encrypts and restores the original backup content', async () => {
    const source = JSON.stringify({ clients: [{ firstName: 'Mario' }], sales: [] });
    const encrypted = await encryptBackup(source, 'password-sicura-2026');
    expect(encrypted).not.toContain('Mario');
    await expect(decryptBackup(encrypted, 'password-sicura-2026')).resolves.toBe(source);
  });

  it('rejects an incorrect password', async () => {
    const encrypted = await encryptBackup('backup riservato', 'password-sicura-2026');
    await expect(decryptBackup(encrypted, 'password-sbagliata')).rejects.toBeDefined();
  });

  it('rejects weak passwords before exporting', async () => {
    await expect(encryptBackup('data', '12345')).rejects.toThrow(/almeno 10 caratteri/i);
  });

  it('rejects unsupported backup formats', async () => {
    await expect(decryptBackup(JSON.stringify({ format: 'unknown' }), 'password-sicura-2026'))
      .rejects.toThrow(/non riconosciuto/i);
  });
});

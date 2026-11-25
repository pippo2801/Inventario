// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { decryptLocalVault, encryptLocalVault } from './localVaultCrypto';

async function createKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

describe('encrypted local vault envelope', () => {
  it('encrypts and restores content without exposing plaintext', async () => {
    const key = await createKey();
    const source = JSON.stringify({ clients: [{ fiscalCode: 'RSSMRA80A01A001U' }], prescriptions: [] });
    const encrypted = await encryptLocalVault(source, key, 1);
    expect(encrypted).not.toContain('RSSMRA80A01A001U');
    await expect(decryptLocalVault(encrypted, key, 1)).resolves.toBe(source);
  });

  it('uses a fresh IV for each encryption', async () => {
    const key = await createKey();
    const first = JSON.parse(await encryptLocalVault('same data', key, 1));
    const second = JSON.parse(await encryptLocalVault('same data', key, 1));
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it('rejects a different key and tampered ciphertext', async () => {
    const key = await createKey();
    const otherKey = await createKey();
    const encrypted = await encryptLocalVault('private data', key, 1);
    await expect(decryptLocalVault(encrypted, otherKey, 1)).rejects.toThrow(/autenticare|decifrare/i);

    const payload = JSON.parse(encrypted);
    payload.ciphertext = payload.ciphertext.slice(0, -4) + 'AAAA';
    await expect(decryptLocalVault(JSON.stringify(payload), key, 1)).rejects.toThrow();
  });

  it('rejects unsupported envelope and key versions', async () => {
    const key = await createKey();
    const encrypted = await encryptLocalVault('data', key, 2);
    await expect(decryptLocalVault(encrypted, key, 1)).rejects.toThrow(/versione della chiave/i);
    await expect(decryptLocalVault(JSON.stringify({ format: 'unknown' }), key)).rejects.toThrow(/non riconosciuto/i);
  });

  it('rejects malformed IV and invalid key versions', async () => {
    const key = await createKey();
    await expect(encryptLocalVault('data', key, 0)).rejects.toThrow(/versione della chiave/i);
    const encrypted = JSON.parse(await encryptLocalVault('data', key, 1));
    encrypted.iv = 'AQID';
    await expect(decryptLocalVault(JSON.stringify(encrypted), key)).rejects.toThrow(/incompleto/i);
  });
});

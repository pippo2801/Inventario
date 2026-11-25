const VAULT_FORMAT = 'studio-ottico-dipietro-local-vault';
const VAULT_VERSION = 1;
const ALGORITHM = 'AES-256-GCM';
const IV_LENGTH = 12;
const TAG_LENGTH_BITS = 128;

export interface LocalVaultEnvelope {
  format: typeof VAULT_FORMAT;
  version: typeof VAULT_VERSION;
  algorithm: typeof ALGORITHM;
  keyVersion: number;
  iv: string;
  ciphertext: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error('Archivio locale cifrato non valido.');
  }
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function additionalData(keyVersion: number): Uint8Array {
  return new TextEncoder().encode(`${VAULT_FORMAT}|${VAULT_VERSION}|${ALGORITHM}|${keyVersion}`);
}

function assertCryptoAvailable(): void {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error('Cifratura sicura non disponibile su questo dispositivo.');
  }
}

function validateKey(key: CryptoKey, usage: 'encrypt' | 'decrypt'): void {
  if (
    key.type !== 'secret' ||
    key.algorithm.name !== 'AES-GCM' ||
    (key.algorithm as AesKeyAlgorithm).length !== 256 ||
    !key.usages.includes(usage)
  ) {
    throw new Error('Chiave locale non valida o non compatibile.');
  }
}

export async function encryptLocalVault(plainText: string, key: CryptoKey, keyVersion: number): Promise<string> {
  assertCryptoAvailable();
  validateKey(key, 'encrypt');
  if (!Number.isSafeInteger(keyVersion) || keyVersion < 1) {
    throw new Error('Versione della chiave locale non valida.');
  }
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: additionalData(keyVersion), tagLength: TAG_LENGTH_BITS },
    key,
    new TextEncoder().encode(plainText)
  );
  const envelope: LocalVaultEnvelope = {
    format: VAULT_FORMAT,
    version: VAULT_VERSION,
    algorithm: ALGORITHM,
    keyVersion,
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(encrypted)),
  };
  return JSON.stringify(envelope);
}

export async function decryptLocalVault(encryptedText: string, key: CryptoKey, expectedKeyVersion?: number): Promise<string> {
  assertCryptoAvailable();
  validateKey(key, 'decrypt');
  let payload: unknown;
  try {
    payload = JSON.parse(encryptedText);
  } catch {
    throw new Error('Archivio locale cifrato non valido.');
  }
  if (
    !payload || typeof payload !== 'object' ||
    (payload as LocalVaultEnvelope).format !== VAULT_FORMAT ||
    (payload as LocalVaultEnvelope).version !== VAULT_VERSION ||
    (payload as LocalVaultEnvelope).algorithm !== ALGORITHM ||
    !Number.isSafeInteger((payload as LocalVaultEnvelope).keyVersion) ||
    (payload as LocalVaultEnvelope).keyVersion < 1 ||
    typeof (payload as LocalVaultEnvelope).iv !== 'string' ||
    typeof (payload as LocalVaultEnvelope).ciphertext !== 'string'
  ) {
    throw new Error('Formato archivio locale cifrato non riconosciuto.');
  }
  const envelope = payload as LocalVaultEnvelope;
  if (expectedKeyVersion !== undefined && envelope.keyVersion !== expectedKeyVersion) {
    throw new Error('Versione della chiave locale non corrispondente.');
  }
  const iv = fromBase64(envelope.iv);
  const ciphertext = fromBase64(envelope.ciphertext);
  if (iv.length !== IV_LENGTH || ciphertext.length < TAG_LENGTH_BITS / 8) {
    throw new Error('Archivio locale cifrato incompleto.');
  }
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: additionalData(envelope.keyVersion), tagLength: TAG_LENGTH_BITS },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error('Impossibile autenticare o decifrare l’archivio locale.');
  }
}

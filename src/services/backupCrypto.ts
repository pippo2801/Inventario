const BACKUP_FORMAT = 'studio-ottico-dipietro-encrypted-backup';
const BACKUP_VERSION = 1;
const PBKDF2_ITERATIONS = 310_000;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptBackup(plainText: string, passphrase: string): Promise<string> {
  if (passphrase.length < 10) {
    throw new Error('La password del backup deve contenere almeno 10 caratteri.');
  }
  if (!globalThis.crypto?.subtle) {
    throw new Error('Cifratura sicura non disponibile su questo dispositivo.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plainText)
  );

  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(encrypted)),
  }, null, 2);
}

export async function decryptBackup(encryptedText: string, passphrase: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Decifratura sicura non disponibile su questo dispositivo.');
  }

  const payload = JSON.parse(encryptedText);
  if (
    payload?.format !== BACKUP_FORMAT ||
    payload?.version !== BACKUP_VERSION ||
    payload?.algorithm !== 'AES-256-GCM' ||
    payload?.kdf !== 'PBKDF2-SHA256' ||
    payload?.iterations !== PBKDF2_ITERATIONS ||
    typeof payload?.salt !== 'string' ||
    typeof payload?.iv !== 'string' ||
    typeof payload?.data !== 'string'
  ) {
    throw new Error('Formato backup cifrato non riconosciuto.');
  }

  const key = await deriveKey(passphrase, fromBase64(payload.salt));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(payload.iv) },
    key,
    fromBase64(payload.data)
  );
  return new TextDecoder().decode(decrypted);
}

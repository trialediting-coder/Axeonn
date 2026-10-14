// lib/secretBox.ts
// The one place a third-party secret is stored per client (spec, "Cross-slice
// decisions": one secrets helper). AES-256-GCM with SECRETS_KEY (32 bytes,
// base64, generated once by the owner), a fresh random 12-byte IV per seal, and
// the GCM tag checked on open so a tampered row fails loudly instead of
// decrypting to garbage. Output: v1.<iv>.<tag>.<ciphertext>, each base64url.
// Errors never carry the plaintext or the key. Server-only.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const VERSION = 'v1';
const IV_BYTES = 12;
const TAG_BYTES = 16;

function keyFrom(raw: string | undefined): Buffer | null {
  if (!raw) return null;
  const key = Buffer.from(raw.trim(), 'base64');
  return key.length === 32 ? key : null;
}

function requireKey(raw: string | undefined): Buffer {
  const key = keyFrom(raw);
  if (!key) throw new Error('SECRETS_KEY must be set to 32 random bytes, base64 (openssl rand -base64 32)');
  return key;
}

export function isSecretsConfigured(): boolean {
  return keyFrom(process.env.SECRETS_KEY) !== null;
}

/** Encrypts a secret for storage. `rawKey` exists for tests; production reads SECRETS_KEY. */
export function seal(plain: string, rawKey: string | undefined = process.env.SECRETS_KEY): string {
  const key = requireKey(rawKey);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

/** Decrypts what seal() produced. Throws on a wrong key, a tampered value or a malformed string. */
export function open(sealed: string, rawKey: string | undefined = process.env.SECRETS_KEY): string {
  const key = requireKey(rawKey);
  const parts = typeof sealed === 'string' ? sealed.split('.') : [];
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error('Not a sealed secret');
  const iv = Buffer.from(parts[1], 'base64url');
  const tag = Buffer.from(parts[2], 'base64url');
  const ciphertext = Buffer.from(parts[3], 'base64url');
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw new Error('Not a sealed secret');
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    // GCM's own message ("Unsupported state or unable to authenticate data") is fine, but say it plainly.
    throw new Error('Could not open the sealed secret (wrong SECRETS_KEY or the value was changed)');
  }
}

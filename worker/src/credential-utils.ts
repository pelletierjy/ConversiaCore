// Credential primitives — feature 002-secure-embed-telemetry (data-model.md § Credential).

/** Minimal structural subset of the Workers KV namespace binding so this module stays
 *  unit-testable with a plain object (vitest) and identical at runtime on Workers. */
export interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  list(options: { prefix: string }): Promise<{ keys: Array<{ name: string }> }>;
}

const KEY_RANDOM_LENGTH = 32; // bytes of entropy in the key tail
const KEY_ID_LENGTH = 8;

function randomChars(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Generates a self-attributing key: `cvk_<remoteId>_<32-byte base64url>`, plus an 8-char
 *  keyId so rotations/revocations can be named without ever storing the secret (FR-006). */
export function generateCredential(remoteId: string): { keyId: string; key: string } {
  const bytes = new Uint8Array(KEY_RANDOM_LENGTH);
  crypto.getRandomValues(bytes);
  const tail = toBase64Url(bytes);
  return { keyId: randomChars(KEY_ID_LENGTH), key: `cvk_${remoteId}_${tail}` };
}

/** SHA-256 hex digest via WebCrypto (available in Workers and Node >= 20). Only the hash is
 *  ever persisted (data-model § Credential). */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Length-safe constant-time string comparison for secrets/token checks (FR-002: no oracle). */
export function constantTimeEquals(a: string, b: string): boolean {
  const bytesA = new TextEncoder().encode(a);
  const bytesB = new TextEncoder().encode(b);
  // Compare over the longer length so length differences don't short-circuit visibly.
  const max = Math.max(bytesA.length, bytesB.length);
  let diff = bytesA.length ^ bytesB.length;
  for (let i = 0; i < max; i++) {
    diff |= (bytesA[i] ?? 0) ^ (bytesB[i] ?? 0);
  }
  return diff === 0;
}

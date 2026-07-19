import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

/**
 * Hashes a plaintext password using scrypt with a random salt.
 * The returned string encodes both the salt and the derived key as
 * `<saltHex>:<hashHex>` so it can be stored as a single value
 * (e.g. in the AUTH_PASSWORD_HASH environment variable).
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a hash produced by hashPassword,
 * using a constant-time comparison to avoid timing attacks.
 * Returns false (rather than throwing) for malformed stored hashes.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;

  let salt: Buffer;
  let expectedKey: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    expectedKey = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }
  if (salt.length === 0 || expectedKey.length === 0) return false;

  const actualKey = scryptSync(password, salt, expectedKey.length);
  if (actualKey.length !== expectedKey.length) return false;

  return timingSafeEqual(actualKey, expectedKey);
}

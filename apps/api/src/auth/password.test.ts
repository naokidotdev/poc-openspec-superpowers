import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password.ts";

describe("password", () => {
  it("hashes a password to a non-empty string different from the plaintext", () => {
    const hash = hashPassword("correct horse battery staple");
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
    expect(hash).not.toBe("correct horse battery staple");
  });

  it("produces different hashes for the same password (random salt)", () => {
    const hash1 = hashPassword("same-password");
    const hash2 = hashPassword("same-password");
    expect(hash1).not.toBe(hash2);
  });

  it("produces different hashes for different passwords", () => {
    const hash1 = hashPassword("password-one");
    const hash2 = hashPassword("password-two");
    expect(hash1).not.toBe(hash2);
  });

  it("verifies a correct password against its hash", () => {
    const hash = hashPassword("my-secret-password");
    expect(verifyPassword("my-secret-password", hash)).toBe(true);
  });

  it("rejects an incorrect password against a hash", () => {
    const hash = hashPassword("my-secret-password");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("rejects an empty password against a real hash", () => {
    const hash = hashPassword("my-secret-password");
    expect(verifyPassword("", hash)).toBe(false);
  });

  it("returns false rather than throwing for a malformed stored hash", () => {
    expect(verifyPassword("anything", "not-a-valid-hash-format")).toBe(false);
  });
});

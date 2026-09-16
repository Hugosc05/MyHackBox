import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const N = 16384;
const KEYLEN = 64;

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const dk = scryptSync(pw, salt, KEYLEN, { N }).toString("hex");
  return `scrypt$${N}$${salt}$${dk}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [scheme, n, salt, dk] = stored.split("$");
  if (scheme !== "scrypt" || !n || !salt || !dk) return false;
  const calc = scryptSync(pw, salt, KEYLEN, { N: Number(n) });
  const expected = Buffer.from(dk, "hex");
  return expected.length === calc.length && timingSafeEqual(expected, calc);
}

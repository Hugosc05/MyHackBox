import { createHash, timingSafeEqual } from "crypto";

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function flagMatches(submitted: string, expected: string): boolean {
  const a = Buffer.from(sha256(submitted.trim()));
  const b = Buffer.from(sha256(expected));
  return a.length === b.length && timingSafeEqual(a, b);
}

import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "mhb_session";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

const secret = () => process.env.AUTH_SECRET || "dev-insecure-secret-change-me";

export function signSession(userId: string): string {
  const body = Buffer.from(`${userId}.${Date.now()}`).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [userId, ts] = Buffer.from(body, "base64url").toString().split(".");
  if (!userId || !ts) return null;
  if (Date.now() - Number(ts) > MAX_AGE_MS) return null;
  return userId;
}

export function sessionCookie(userId: string) {
  return {
    name: SESSION_COOKIE,
    value: signSession(userId),
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE_MS / 1000
    }
  };
}

import { NextRequest, NextResponse } from "next/server";
import type { ZodType } from "zod";
import { rateLimit } from "./ratelimit";

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

// Defensa CSRF para cookies: exige que el Origin (cuando existe) sea el mismo host.
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export function guard(req: NextRequest, opts: { key: string; limit: number; windowMs: number }): NextResponse | null {
  if (!sameOrigin(req)) return NextResponse.json({ error: "bad origin" }, { status: 403 });
  const rl = rateLimit(`${opts.key}:${clientIp(req)}`, opts.limit, opts.windowMs);
  if (!rl.ok)
    return NextResponse.json(
      { error: "demasiadas peticiones" },
      { status: 429, headers: { "retry-after": String(Math.ceil(rl.retryMs / 1000)) } }
    );
  return null;
}

export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<{ data: T } | { error: NextResponse }> {
  const raw = await req.json().catch(() => null);
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { error: NextResponse.json({ error: "entrada inválida", issues: result.error.flatten() }, { status: 400 }) };
  }
  return { data: result.data };
}

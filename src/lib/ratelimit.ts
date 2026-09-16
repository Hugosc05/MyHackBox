// Ventana fija en memoria. Suficiente para un despliegue single-instance;
// en multi-instancia sustituir por Redis (Upstash) con la misma interfaz.
interface Bucket { count: number; reset: number; }
const buckets = new Map<string, Bucket>();

export interface RateResult { ok: boolean; remaining: number; retryMs: number; }

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, retryMs: 0 };
  }
  if (b.count >= limit) return { ok: false, remaining: 0, retryMs: b.reset - now };
  b.count++;
  return { ok: true, remaining: limit - b.count, retryMs: 0 };
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
  }, 60_000).unref?.();
}

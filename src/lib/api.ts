"use client";

let sessionReady: Promise<void> | null = null;

export function ensureSession(): Promise<void> {
  if (!sessionReady) {
    sessionReady = fetch("/api/session", { method: "POST" })
      .then(() => undefined)
      .catch(() => {
        sessionReady = null;
      });
  }
  return sessionReady;
}

async function jget<T>(url: string): Promise<T> {
  await ensureSession();
  const r = await fetch(url, { cache: "no-store" });
  return r.json();
}

async function jpost<T>(url: string, body: unknown): Promise<T> {
  await ensureSession();
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return r.json();
}

export interface CatalogRow {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  mode: "GUIDED" | "CHALLENGE";
  summary: string;
  progress: { status: string; step?: number } | null;
}

export interface MeUser { handle: string; xp: number; authed: boolean }
export interface LeaderRow { rank: number; handle: string; xp: number; solved: number }

export const api = {
  ensureSession,
  labs: () => jget<{ xp: number; items: CatalogRow[] }>("/api/labs"),
  me: () => jget<{ user: MeUser | null }>("/api/me"),
  leaderboard: () => jget<{ rows: LeaderRow[] }>("/api/leaderboard"),
  getProgress: (slug: string) =>
    jget<{ progress: { currentStepIndex: number; status: string } | null }>(`/api/progress/${slug}`),
  saveProgress: (slug: string, index: number, done: boolean) =>
    jpost<{ xp: number }>(`/api/progress/${slug}`, { index, done }),
  submitFlag: (slug: string, flag: string) =>
    jpost<{ correct: boolean; xp: number; firstSolve: boolean }>(`/api/challenges/${slug}/submit`, { flag }),
  register: (email: string, password: string, handle: string) =>
    jpost<{ authed?: boolean; handle?: string; error?: string }>("/api/auth/register", { email, password, handle }),
  login: (email: string, password: string) =>
    jpost<{ authed?: boolean; handle?: string; error?: string }>("/api/auth/login", { email, password }),
  logout: () => jpost<{ ok: boolean }>("/api/auth/logout", {})
};

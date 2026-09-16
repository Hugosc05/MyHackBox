"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type LeaderRow } from "@/lib/api";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leaderboard().then((r) => setRows(r.rows)).finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col gap-8 px-6 py-14">
      <header className="flex items-center justify-between">
        <h1 className="glitch text-3xl font-bold neon-text" data-text="Ranking">Ranking</h1>
        <Link href="/" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-neon)]">← catálogo</Link>
      </header>

      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">cargando ranking...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">aún no hay puntuaciones. sé el primero en capturar una flag.</p>
      ) : (
        <ol className="divide-y divide-[var(--color-line)] rounded-lg border border-[var(--color-line)]">
          {rows.map((r) => (
            <li key={r.rank} className="flex items-center justify-between px-5 py-3">
              <span className="flex items-center gap-4">
                <span className={`w-6 text-lg tabular-nums ${r.rank <= 3 ? "neon-text" : "text-[var(--color-muted)]"}`}>
                  {r.rank}
                </span>
                <span className="text-sm text-[var(--color-text)]">{r.handle}</span>
              </span>
              <span className="flex items-center gap-5 text-[12px] text-[var(--color-muted)]">
                <span>{r.solved} labs</span>
                <span className="neon-text tabular-nums">{r.xp} XP</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

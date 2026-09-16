"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, type CatalogRow, type MeUser, type LeaderRow } from "@/lib/api";
import { CATEGORIES } from "@/lib/content/catalog";
import AuthBar from "@/components/AuthBar";

const DIFF: Record<string, string> = {
  BEGINNER: "text-[var(--color-neon)]",
  INTERMEDIATE: "text-[var(--color-amber)]",
  ADVANCED: "text-[var(--color-magenta)]"
};

export default function Home() {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [xp, setXp] = useState(0);
  const [user, setUser] = useState<MeUser | null>(null);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([api.labs(), api.me(), api.leaderboard()])
      .then(([labs, me, lb]) => {
        setRows(labs.items);
        setXp(labs.xp);
        setUser(me.user);
        setLeaders(lb.rows);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cats = [...new Set(rows.map((r) => r.category))];
  const solvedCount = rows.filter((r) => r.progress?.status === "COMPLETED").length;

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col gap-10 px-6 py-14">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.4em] text-[var(--color-muted)]">// ETHICAL HACKING LAB</p>
            <h1 className="glitch mt-3 text-4xl font-bold neon-text sm:text-5xl" data-text="MyHackBox">
              MyHackBox
            </h1>
          </div>
          <div className="flex flex-col items-end gap-3">
            <AuthBar user={user} onChange={load} />
            <div className="flex gap-3">
              <Stat label="XP" value={xp} />
              <Stat label="superados" value={`${solvedCount}/${rows.length}`} />
            </div>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
          Laboratorios interactivos de hacking ético, simulados y ultraligeros. Empieza por los
          guiados para aprender la técnica paso a paso; luego entra a los sandbox de reto y captura
          la flag sin ayuda. Tu progreso se guarda automáticamente.
        </p>
      </motion.header>

      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">cargando catálogo...</p>
      ) : (
        <div className="flex flex-col gap-10">
          {leaders.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-widest text-[var(--color-cyan)]">ranking</h2>
                <Link href="/leaderboard" className="text-[11px] text-[var(--color-muted)] hover:text-[var(--color-neon)]">
                  ver todo →
                </Link>
              </div>
              <ol className="divide-y divide-[var(--color-line)] rounded-lg border border-[var(--color-line)]">
                {leaders.slice(0, 5).map((r) => (
                  <li key={r.rank} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span className="flex items-center gap-3">
                      <span className="w-5 text-[var(--color-muted)] tabular-nums">{r.rank}</span>
                      <span className="text-[var(--color-text)]">{r.handle}</span>
                    </span>
                    <span className="flex items-center gap-4 text-[11px] text-[var(--color-muted)]">
                      <span>{r.solved} labs</span>
                      <span className="neon-text tabular-nums">{r.xp} XP</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {cats.map((cat) => (
            <section key={cat}>
              <h2 className="mb-3 text-xs uppercase tracking-widest text-[var(--color-cyan)]">
                {CATEGORIES[cat] ?? cat}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rows.filter((r) => r.category === cat).map((r) => (
                  <Card key={r.slug} row={r} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-right">
      <div className="neon-text text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-[var(--color-muted)]">{label}</div>
    </div>
  );
}

function Card({ row }: { row: CatalogRow }) {
  const href = row.mode === "GUIDED" ? `/labs/${row.slug}` : `/challenges/${row.slug}`;
  const done = row.progress?.status === "COMPLETED";
  const started = row.progress && !done;
  return (
    <li>
      <Link
        href={href}
        className={`group flex h-full flex-col rounded-lg border p-4 no-underline transition-colors ${
          done
            ? "border-[var(--color-neon-dim)] bg-[var(--color-neon)]/5"
            : "border-[var(--color-line)] hover:border-[var(--color-neon-dim)] hover:bg-[var(--color-neon)]/5"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-[var(--color-muted)]">
            {row.mode === "GUIDED" ? "guiado" : "reto"}
          </span>
          <span className={`text-[9px] uppercase tracking-widest ${DIFF[row.difficulty]}`}>{row.difficulty}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-[var(--color-text)] group-hover:text-[var(--color-neon)]">
          {done && <span className="neon-text">◉</span>}
          {row.title}
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-[11px] leading-relaxed text-[var(--color-muted)]">{row.summary}</p>
        <div className="mt-3 text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
          {done ? "superado" : started ? "en progreso" : "iniciar →"}
        </div>
      </Link>
    </li>
  );
}

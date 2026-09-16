"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Challenge } from "@/lib/content/challenges";
import { CATEGORIES } from "@/lib/content/catalog";
import { useSandbox } from "@/store/useSandbox";
import Terminal from "./Terminal";
import FlagPanel from "./FlagPanel";

const DIFF: Record<string, string> = {
  BEGINNER: "text-[var(--color-neon)] border-[var(--color-neon-dim)]",
  INTERMEDIATE: "text-[var(--color-amber)] border-[var(--color-amber)]/40",
  ADVANCED: "text-[var(--color-magenta)] border-[var(--color-magenta)]/40"
};

export default function SandboxLab({ challenge }: { challenge: Challenge }) {
  const init = useSandbox((s) => s.init);
  const run = useSandbox((s) => s.run);
  const log = useSandbox((s) => s.log);
  const solved = useSandbox((s) => s.solved);
  const attempts = useSandbox((s) => s.attempts);

  useEffect(() => {
    init(challenge);
  }, [init, challenge]);

  return (
    <div className="mx-auto flex h-[100dvh] max-w-[1500px] flex-col gap-4 p-4 lg:p-6">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-3 no-underline">
          <span className="neon-text text-lg">▚</span>
          <span className="text-sm tracking-widest text-[var(--color-muted)]">
            MYHACKBOX / RETO / <span className="text-[var(--color-text)]">{challenge.category}</span>
          </span>
        </Link>
        <span className="rounded-full border border-[var(--color-magenta)]/40 px-3 py-1 text-[10px] uppercase tracking-widest text-[var(--color-magenta)]">
          sandbox · sin guía
        </span>
      </motion.header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.85fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-0"
        >
          <Terminal log={log} onRun={run} placeholder={challenge.starters[0] ?? "help"} />
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.08 } }}
          className="flex min-h-0 flex-col gap-4 overflow-y-auto thin-scroll"
        >
          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
            <div className="flex items-center justify-between">
              <h1 className="glitch text-sm neon-text" data-text={challenge.title}>
                {challenge.title}
              </h1>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] tracking-widest ${DIFF[challenge.difficulty]}`}>
                {challenge.difficulty}
              </span>
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--color-cyan)]">
              {CATEGORIES[challenge.category] ?? challenge.category}
            </p>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--color-text)]">{challenge.brief}</p>

            <div className="mt-4">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
                comandos rápidos
              </div>
              <div className="flex flex-wrap gap-2">
                {challenge.starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => run(s)}
                    className="max-w-full truncate rounded border border-[var(--color-cyan)]/25 bg-[var(--color-cyan)]/5 px-2 py-1 text-[10.5px] text-[var(--color-cyan)] transition-colors hover:bg-[var(--color-cyan)]/15"
                    title={s}
                  >
                    ▶ {s}
                  </button>
                ))}
              </div>
            </div>

            {attempts >= 3 && !solved && (
              <div className="mt-4 rounded border border-[var(--color-amber)]/30 bg-[var(--color-amber)]/5 px-2 py-1.5 text-[11px] text-[var(--color-amber)]">
                pista: {challenge.hint}
              </div>
            )}
          </div>

          <FlagPanel slug={challenge.slug} hinted={solved} />
        </motion.aside>
      </div>
    </div>
  );
}

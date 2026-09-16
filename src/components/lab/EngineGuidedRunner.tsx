"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { engineGuidedBySlug } from "@/lib/content/guided-engine";
import { useEngineGuided } from "@/store/useEngineGuided";
import { api } from "@/lib/api";
import Terminal from "./Terminal";

export default function EngineGuidedRunner({ slug }: { slug: string }) {
  const lab = engineGuidedBySlug(slug);
  const init = useEngineGuided((s) => s.init);
  const restore = useEngineGuided((s) => s.restore);
  const run = useEngineGuided((s) => s.run);
  const useHint = useEngineGuided((s) => s.useHint);
  const log = useEngineGuided((s) => s.log);
  const index = useEngineGuided((s) => s.index);
  const completed = useEngineGuided((s) => s.completed);
  const attempts = useEngineGuided((s) => s.attempts);
  const usedHint = useEngineGuided((s) => s.usedHint);
  const status = useEngineGuided((s) => s.status);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!lab) return;
    init(lab);
    hydrated.current = false;
    api
      .getProgress(lab.slug)
      .then((r) => {
        if (r.progress && r.progress.currentStepIndex > 0) restore(r.progress.currentStepIndex);
      })
      .finally(() => (hydrated.current = true));
  }, [init, restore, lab]);

  useEffect(() => {
    if (!hydrated.current || !lab) return;
    api.saveProgress(lab.slug, index, status === "completed");
  }, [index, status, lab]);

  if (!lab) return null;
  const step = lab.steps[index];
  const done = status === "completed";
  const progress = Math.round((completed.length / lab.steps.length) * 100);

  return (
    <div className="mx-auto flex h-[100dvh] max-w-[1500px] flex-col gap-4 p-4 lg:p-6">
      <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <span className="neon-text text-lg">▚</span>
          <span className="text-sm tracking-widest text-[var(--color-muted)]">
            MYHACKBOX / LAB / <span className="text-[var(--color-text)]">{lab.category}</span>
          </span>
        </Link>
        <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
          entorno guiado · simulado
        </span>
      </motion.header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.85fr]">
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="min-h-0">
          <Terminal log={log} onRun={run} placeholder={lab.placeholder} />
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.08 } }}
          className="flex min-h-0 flex-col rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)]"
        >
          <div className="border-b border-[var(--color-line)] p-4">
            <div className="flex items-center justify-between">
              <h1 className="glitch text-sm neon-text" data-text={lab.title}>{lab.title}</h1>
              <span className="text-[10px] text-[var(--color-muted)]">{completed.length}/{lab.steps.length}</span>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--color-line)]">
              <motion.div
                className="h-full bg-[var(--color-neon)]"
                initial={false}
                animate={{ width: `${progress}%` }}
                style={{ boxShadow: "0 0 10px var(--color-neon)" }}
              />
            </div>
          </div>

          <ol className="thin-scroll flex-1 space-y-1 overflow-y-auto p-3">
            {lab.steps.map((s, i) => {
              const isDone = completed.includes(s.id);
              const isActive = i === index && !done;
              return (
                <li
                  key={s.id}
                  className={`rounded-md border px-3 py-2 text-xs ${
                    isActive ? "border-[var(--color-neon-dim)] bg-[var(--color-neon)]/5" : "border-transparent"
                  }`}
                >
                  <span className="mr-2">{isDone ? <span className="neon-text">◉</span> : isActive ? <span className="text-[var(--color-neon)]">▸</span> : <span className="text-[var(--color-muted)]">{i + 1}.</span>}</span>
                  <span className={isDone ? "text-[var(--color-neon)]" : isActive ? "text-[var(--color-text)]" : "text-[var(--color-muted)]"}>{s.title}</span>
                </li>
              );
            })}
          </ol>

          <div className="border-t border-[var(--color-line)] p-4">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-md border border-[var(--color-neon-dim)] bg-[var(--color-neon)]/5 p-3 text-center">
                  <div className="neon-text text-sm">// laboratorio completado</div>
                  <Link href="/" className="mt-2 inline-block text-[11px] text-[var(--color-cyan)]">volver al catálogo →</Link>
                </motion.div>
              ) : (
                <motion.div key={step.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-[var(--color-cyan)]">paso {index + 1} · {step.title}</div>
                  <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--color-text)]">{step.brief}</p>
                  {attempts >= 2 && step.hint && !usedHint && (
                    <button onClick={useHint} className="mt-3 text-[11px] text-[var(--color-amber)] underline underline-offset-2">
                      ¿Atascado? Mostrar pista
                    </button>
                  )}
                  {usedHint && step.hint && (
                    <p className="mt-3 rounded border border-[var(--color-amber)]/30 bg-[var(--color-amber)]/5 px-2 py-1.5 text-[11px] text-[var(--color-amber)]">{step.hint}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

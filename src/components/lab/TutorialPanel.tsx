"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LabDefinition } from "@/lib/lab-engine/types";
import { useLabStore } from "@/store/useLabStore";

export default function TutorialPanel({ lab }: { lab: LabDefinition }) {
  const state = useLabStore((s) => s.state);
  const useHint = useLabStore((s) => s.useHint);
  const step = lab.steps[state.index];
  const done = state.status === "completed";
  const progress = Math.round((state.completed.length / lab.steps.length) * 100);

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)]">
      <header className="border-b border-[var(--color-line)] p-4">
        <div className="flex items-center justify-between">
          <h2 className="glitch text-sm neon-text" data-text={lab.title}>
            {lab.title}
          </h2>
          <span className="text-[10px] text-[var(--color-muted)]">
            {state.completed.length}/{lab.steps.length}
          </span>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--color-line)]">
          <motion.div
            className="h-full bg-[var(--color-neon)]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            style={{ boxShadow: "0 0 10px var(--color-neon)" }}
          />
        </div>
      </header>

      <ol className="thin-scroll flex-1 space-y-1 overflow-y-auto p-3">
        {lab.steps.map((s, i) => {
          const isDone = state.completed.includes(s.id);
          const isActive = i === state.index && !done;
          return (
            <li
              key={s.id}
              className={`rounded-md border px-3 py-2 transition-colors ${
                isActive
                  ? "border-[var(--color-neon-dim)] bg-[var(--color-neon)]/5"
                  : "border-transparent"
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <Marker done={isDone} active={isActive} index={i + 1} />
                <span
                  className={
                    isDone
                      ? "text-[var(--color-neon)]"
                      : isActive
                        ? "text-[var(--color-text)]"
                        : "text-[var(--color-muted)]"
                  }
                >
                  {s.title}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-[var(--color-line)] p-4">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-md border border-[var(--color-neon-dim)] bg-[var(--color-neon)]/5 p-3 text-center"
            >
              <div className="neon-text text-sm">// objetivo comprometido</div>
              <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                Iniciación superada. El reto sandbox ya está desbloqueado.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <div className="mb-2 text-[10px] uppercase tracking-widest text-[var(--color-cyan)]">
                paso {state.index + 1} · {step.title}
              </div>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--color-text)]">
                {step.brief}
              </p>

              {state.attempts >= 2 && step.hint && !state.usedHint && (
                <button
                  onClick={useHint}
                  className="mt-3 text-[11px] text-[var(--color-amber)] underline underline-offset-2"
                >
                  ¿Atascado? Mostrar pista
                </button>
              )}
              {state.usedHint && step.hint && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 rounded border border-[var(--color-amber)]/30 bg-[var(--color-amber)]/5 px-2 py-1.5 text-[11px] text-[var(--color-amber)]"
                >
                  {step.hint}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Marker({ done, active, index }: { done: boolean; active: boolean; index: number }) {
  if (done) return <span className="neon-text">◉</span>;
  if (active) return <span className="text-[var(--color-neon)]">▸</span>;
  return <span className="text-[var(--color-muted)]">{index}.</span>;
}

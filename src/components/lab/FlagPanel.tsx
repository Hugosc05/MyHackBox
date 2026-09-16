"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

export default function FlagPanel({ slug, hinted }: { slug: string; hinted: boolean }) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "bad">("idle");
  const [xp, setXp] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!value.trim() || busy) return;
    setBusy(true);
    const r = await api.submitFlag(slug, value.trim());
    setBusy(false);
    setState(r.correct ? "ok" : "bad");
    if (r.correct) setXp(r.xp);
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        state === "ok" ? "border-[var(--color-neon-dim)] bg-[var(--color-neon)]/5" : "border-[var(--color-line)]"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-[var(--color-muted)]">enviar flag</span>
        {hinted && state !== "ok" && (
          <span className="text-[10px] text-[var(--color-neon)]">flag detectada en la consola ↑</span>
        )}
      </div>

      {state === "ok" ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="neon-text text-sm">// reto superado</div>
          {xp !== null && <p className="mt-1 text-[11px] text-[var(--color-muted)]">XP total: {xp}</p>}
        </motion.div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (state === "bad") setState("idle");
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="MHB{...}"
              spellCheck={false}
              className="flex-1 rounded border border-[var(--color-line)] bg-[var(--color-void)]/60 px-3 py-2 text-[12px] text-[var(--color-neon)] outline-none focus:border-[var(--color-neon-dim)]"
            />
            <button
              onClick={submit}
              disabled={busy}
              className="rounded border border-[var(--color-neon-dim)] bg-[var(--color-neon)]/10 px-3 py-2 text-[11px] text-[var(--color-neon)] transition-colors hover:bg-[var(--color-neon)]/20 disabled:opacity-50"
            >
              {busy ? "..." : "validar"}
            </button>
          </div>
          <AnimatePresence>
            {state === "bad" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-[11px] text-[var(--color-magenta)]"
              >
                flag incorrecta · sigue explotando el objetivo
              </motion.p>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

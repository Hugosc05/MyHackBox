"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLabStore } from "@/store/useLabStore";

export default function SqlSimulator() {
  const sim = useLabStore((s) => s.lastSim);
  const authed = sim?.authenticated ?? false;

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
      <header className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
          simulador · acme portal
        </span>
        <StatusPill authed={authed} touched={Boolean(sim)} />
      </header>

      <div className="grid-bg rounded-md border border-[var(--color-line)] bg-[var(--color-void)]/60 p-4">
        <div className="mx-auto max-w-xs space-y-3">
          <div className="text-center text-sm neon-text">ACME&nbsp;CORP · LOGIN</div>
          <FakeField label="username" />
          <FakeField label="password" />
          <div className="rounded border border-[var(--color-neon-dim)] py-1.5 text-center text-xs text-[var(--color-neon)]">
            SIGN IN
          </div>
        </div>
      </div>

      <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-panel-2)] p-3">
        <div className="mb-1 text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
          consulta ejecutada
        </div>
        <AnimatePresence mode="wait">
          <motion.pre
            key={sim?.query ?? "idle"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="whitespace-pre-wrap break-all text-[11px] text-[var(--color-cyan)]"
          >
            {sim?.query ?? "// esperando input del atacante..."}
          </motion.pre>
        </AnimatePresence>
      </div>

      <div className="flex-1 rounded-md border border-[var(--color-line)] bg-[var(--color-panel-2)] p-3">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
          respuesta de la base de datos
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={sim?.note ?? "empty"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {sim?.error && (
              <div className="rounded border border-[var(--color-magenta)]/40 bg-[var(--color-magenta)]/5 px-2 py-1 text-[11px] text-[var(--color-magenta)]">
                {sim.error}
              </div>
            )}
            {sim && sim.rows.length > 0 && (
              <div className="overflow-hidden rounded border border-[var(--color-line)]">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[var(--color-void)]/60 text-[var(--color-muted)]">
                    <tr>
                      <th className="px-2 py-1">user</th>
                      <th className="px-2 py-1">password</th>
                      <th className="px-2 py-1">role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sim.rows.map((r) => (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border-t border-[var(--color-line)] text-[var(--color-neon)]"
                      >
                        <td className="px-2 py-1">{r.username}</td>
                        <td className="px-2 py-1">{r.password}</td>
                        <td className="px-2 py-1">{r.role}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[11px] text-[var(--color-muted)]">
              {sim?.note ?? "El resultado de tus inyecciones aparecerá aquí."}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function FakeField({ label }: { label: string }) {
  return (
    <div className="rounded border border-[var(--color-line)] bg-[var(--color-void)]/70 px-2 py-1.5 text-[11px] text-[var(--color-muted)]">
      {label}
    </div>
  );
}

function StatusPill({ authed, touched }: { authed: boolean; touched: boolean }) {
  const label = !touched ? "IDLE" : authed ? "ACCESO CONCEDIDO" : "BLOQUEADO";
  const color = !touched
    ? "text-[var(--color-muted)] border-[var(--color-line)]"
    : authed
      ? "text-[var(--color-neon)] border-[var(--color-neon-dim)]"
      : "text-[var(--color-amber)] border-[var(--color-amber)]/40";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] tracking-widest ${color}`}>
      {label}
    </span>
  );
}

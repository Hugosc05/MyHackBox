"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, type MeUser } from "@/lib/api";

export default function AuthBar({ user, onChange }: { user: MeUser | null; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    setBusy(true);
    const r =
      mode === "register" ? await api.register(email, password, handle) : await api.login(email, password);
    setBusy(false);
    if (r.error || !r.authed) {
      setErr(r.error ?? "no se pudo completar");
      return;
    }
    setOpen(false);
    setEmail("");
    setPassword("");
    setHandle("");
    onChange();
  };

  const logout = async () => {
    await api.logout();
    onChange();
  };

  if (user?.authed) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <span className="text-[var(--color-muted)]">
          conectado como <span className="neon-text">{user.handle}</span>
        </span>
        <button onClick={logout} className="rounded border border-[var(--color-line)] px-3 py-1 text-[var(--color-muted)] transition-colors hover:border-[var(--color-magenta)]/50 hover:text-[var(--color-magenta)]">
          salir
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded border border-[var(--color-neon-dim)] bg-[var(--color-neon)]/10 px-3 py-1.5 text-xs text-[var(--color-neon)] transition-colors hover:bg-[var(--color-neon)]/20"
      >
        crear cuenta / entrar
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] p-4 shadow-xl"
          >
            <div className="mb-3 flex gap-2 text-[11px]">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setErr("");
                  }}
                  className={`flex-1 rounded border px-2 py-1 uppercase tracking-widest ${
                    mode === m
                      ? "border-[var(--color-neon-dim)] text-[var(--color-neon)]"
                      : "border-[var(--color-line)] text-[var(--color-muted)]"
                  }`}
                >
                  {m === "login" ? "entrar" : "registro"}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {mode === "register" && (
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="alias"
                  className="rounded border border-[var(--color-line)] bg-[var(--color-void)]/60 px-3 py-2 text-[12px] text-[var(--color-text)] outline-none focus:border-[var(--color-neon-dim)]"
                />
              )}
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email"
                type="email"
                className="rounded border border-[var(--color-line)] bg-[var(--color-void)]/60 px-3 py-2 text-[12px] text-[var(--color-text)] outline-none focus:border-[var(--color-neon-dim)]"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="contraseña"
                type="password"
                className="rounded border border-[var(--color-line)] bg-[var(--color-void)]/60 px-3 py-2 text-[12px] text-[var(--color-text)] outline-none focus:border-[var(--color-neon-dim)]"
              />
              {err && <p className="text-[11px] text-[var(--color-magenta)]">{err}</p>}
              <button
                onClick={submit}
                disabled={busy}
                className="rounded border border-[var(--color-neon-dim)] bg-[var(--color-neon)]/10 px-3 py-2 text-[12px] text-[var(--color-neon)] transition-colors hover:bg-[var(--color-neon)]/20 disabled:opacity-50"
              >
                {busy ? "..." : mode === "login" ? "entrar" : "crear cuenta"}
              </button>
              <p className="text-[10px] leading-relaxed text-[var(--color-muted)]">
                tu progreso como invitado se conserva al registrarte.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { create } from "zustand";
import type { Challenge } from "@/lib/content/challenges";
import type { LogEntry, LogKind } from "@/lib/lab-engine/types";
import { runEngine, type Mem } from "@/lib/simulators";

interface SandboxStore {
  ch: Challenge | null;
  log: LogEntry[];
  mem: Mem;
  solved: boolean;
  attempts: number;
  init: (ch: Challenge) => void;
  run: (raw: string) => void;
}

let seq = 0;
const line = (kind: LogKind, text: string): LogEntry => ({ id: ++seq, kind, text });

export const useSandbox = create<SandboxStore>((set, get) => ({
  ch: null,
  log: [],
  mem: {},
  solved: false,
  attempts: 0,

  init: (ch) =>
    set({
      ch,
      mem: {},
      solved: false,
      attempts: 0,
      log: [
        line("system", `sandbox: ${ch.title}`),
        ...ch.intro.map((t) => line("system", t)),
        line("system", "escribe 'help' para ver los comandos · sin guía: piensa como atacante"),
        line("system", "")
      ]
    }),

  run: (raw) => {
    const { ch, mem, solved } = get();
    if (!ch) return;
    const input = raw.trim();
    if (!input) return;

    const out: LogEntry[] = [line("input", input)];
    const cmd = input.split(/\s+/)[0].toLowerCase();

    if (cmd === "clear") {
      set({ log: [] });
      return;
    }
    if (cmd === "help") {
      out.push(line("output", "comandos del reto:\n  " + ch.starters.join("\n  ") + "\n  clear"));
      set((s) => ({ log: [...s.log, ...out] }));
      return;
    }

    const res = runEngine(ch.engine, input, ch.params, mem);
    res.lines.forEach((l) => out.push(line(l.kind, l.text)));

    let nowSolved = solved;
    if (res.solved && !solved) {
      nowSolved = true;
      out.push(line("success", "== objetivo cumplido =="));
      out.push(line("success", `flag capturada: ${ch.flag}`));
      out.push(line("system", "envíala en el panel de la derecha para registrar el reto"));
    }

    set((s) => ({
      log: [...s.log, ...out],
      solved: nowSolved,
      attempts: res.solved ? s.attempts : s.attempts + 1
    }));
  }
}));

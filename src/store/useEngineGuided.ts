import { create } from "zustand";
import type { EngineGuided } from "@/lib/content/guided-engine";
import type { LogEntry, LogKind } from "@/lib/lab-engine/types";
import { runEngine, type Mem } from "@/lib/simulators";

interface EngineGuidedStore {
  lab: EngineGuided | null;
  log: LogEntry[];
  mem: Mem;
  index: number;
  completed: string[];
  attempts: number;
  usedHint: boolean;
  status: "running" | "completed";
  init: (lab: EngineGuided) => void;
  run: (raw: string) => void;
  useHint: () => void;
  restore: (index: number) => void;
}

let seq = 0;
const line = (kind: LogKind, text: string): LogEntry => ({ id: ++seq, kind, text });

export const useEngineGuided = create<EngineGuidedStore>((set, get) => ({
  lab: null,
  log: [],
  mem: {},
  index: 0,
  completed: [],
  attempts: 0,
  usedHint: false,
  status: "running",

  init: (lab) =>
    set({
      lab,
      mem: {},
      index: 0,
      completed: [],
      attempts: 0,
      usedHint: false,
      status: "running",
      log: [
        line("system", `objetivo: ${lab.title}`),
        ...lab.intro.map((t) => line("system", t)),
        line("system", "escribe 'help' para ver los comandos"),
        line("system", "")
      ]
    }),

  useHint: () => set({ usedHint: true }),

  restore: (index) =>
    set((s) => {
      if (!s.lab || index <= 0) return {};
      const steps = s.lab.steps;
      const i = Math.min(index, steps.length);
      return {
        index: i,
        completed: steps.slice(0, i).map((st) => st.id),
        status: i >= steps.length ? "completed" : "running",
        attempts: 0,
        usedHint: false
      };
    }),

  run: (raw) => {
    const { lab, mem, index, status } = get();
    if (!lab || status === "completed") return;
    const input = raw.trim();
    if (!input) return;

    const out: LogEntry[] = [line("input", input)];
    const cmd = input.split(/\s+/)[0].toLowerCase();

    if (cmd === "clear") {
      set({ log: [] });
      return;
    }
    if (cmd === "help") {
      out.push(line("output", "comandos:\n  " + lab.placeholder + "\n  hint\n  clear"));
      set((s) => ({ log: [...s.log, ...out] }));
      return;
    }
    if (cmd === "hint") {
      const step = lab.steps[index];
      if (step?.hint) out.push(line("output", "pista: " + step.hint));
      set((s) => ({ log: [...s.log, ...out], usedHint: true }));
      return;
    }

    const res = runEngine(lab.engine, input, lab.params, mem);
    res.lines.forEach((l) => out.push(line(l.kind, l.text)));

    const step = lab.steps[index];
    const advanced = step ? step.match(input, res.solved) : false;

    if (advanced) {
      if (step.reveals) out.push(line("success", step.reveals));
      const nextIndex = index + 1;
      const finished = nextIndex >= lab.steps.length;
      if (finished) out.push(line("success", "== laboratorio completado =="));
      set((s) => ({
        log: [...s.log, ...out],
        completed: [...s.completed, step.id],
        index: nextIndex,
        status: finished ? "completed" : "running",
        attempts: 0,
        usedHint: false
      }));
    } else {
      set((s) => ({ log: [...s.log, ...out], attempts: s.attempts + 1 }));
    }
  }
}));

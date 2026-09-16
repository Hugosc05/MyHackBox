import { create } from "zustand";
import type { LabDefinition, LabState, LogEntry, LogKind } from "@/lib/lab-engine/types";
import { initState, submit, revealHint } from "@/lib/lab-engine/machine";
import { runLogin, type SimResult } from "@/lib/labs/sqli-sim";
import { parseLogin } from "@/lib/utils";

interface LabStore {
  lab: LabDefinition | null;
  state: LabState;
  log: LogEntry[];
  lastSim: SimResult | null;
  justAdvanced: boolean;
  init: (lab: LabDefinition) => void;
  run: (raw: string) => void;
  useHint: () => void;
  restore: (index: number) => void;
}

let seq = 0;
const line = (kind: LogKind, text: string): LogEntry => ({ id: ++seq, kind, text });

const HELP = [
  "comandos disponibles:",
  "  target                inspecciona el portal objetivo",
  "  login <user> :: <pwd>  intenta autenticarte (admite payloads)",
  "  submit <valor>         envía una credencial/flag capturada",
  "  hint                   muestra la pista del paso actual",
  "  clear                  limpia la consola"
].join("\n");

export const useLabStore = create<LabStore>((set, get) => ({
  lab: null,
  state: initState(),
  log: [],
  lastSim: null,
  justAdvanced: false,

  init: (lab) =>
    set({
      lab,
      state: initState(),
      lastSim: null,
      justAdvanced: false,
      log: [
        line("system", `objetivo: ${lab.title}`),
        line("system", "escribe 'help' para ver los comandos"),
        line("system", "")
      ]
    }),

  useHint: () => set((s) => ({ state: revealHint(s.state) })),

  restore: (index) =>
    set((s) => {
      if (!s.lab) return {};
      const steps = s.lab.steps;
      const i = Math.max(0, Math.min(index, steps.length));
      if (i <= 0) return {};
      return {
        state: {
          ...s.state,
          index: i,
          status: i >= steps.length ? "completed" : "running",
          completed: steps.slice(0, i).map((st) => st.id),
          attempts: 0,
          usedHint: false
        }
      };
    }),

  run: (raw) => {
    const { lab, state } = get();
    if (!lab) return;
    const input = raw.trim();
    if (!input) return;

    const out: LogEntry[] = [line("input", input)];
    const cmd = input.split(/\s+/)[0].toLowerCase();
    const rest = input.slice(cmd.length).trim();
    let sim: SimResult | null = get().lastSim;
    let advancedNow = false;

    const commit = (patch?: Parameters<typeof submit>[3]) => {
      const res = submit(lab, state, input, patch);
      if (res.advanced) {
        advancedNow = true;
        const step = lab.steps[state.index];
        if (step.reveals) out.push(line("success", step.reveals));
        if (res.finished) out.push(line("success", "== laboratorio completado =="));
      }
      set({ state: res.state });
    };

    if (cmd === "help") {
      out.push(line("output", HELP));
    } else if (cmd === "clear") {
      set({ log: [] });
      return;
    } else if (cmd === "target") {
      out.push(
        line(
          "output",
          "Acme Corp — Portal de acceso\n  endpoint: POST /login\n  query: SELECT id, username, role FROM users WHERE username='<u>' AND password='<p>'"
        )
      );
      commit();
    } else if (cmd === "login") {
      const { username, password } = parseLogin(rest);
      sim = runLogin(username, password);
      out.push(line("system", `> ${sim.query}`));
      if (sim.error) out.push(line("error", sim.error));
      if (sim.rows.length) {
        out.push(line("output", renderRows(sim)));
      }
      out.push(line(sim.authenticated ? "success" : "output", sim.note));
      commit({
        authenticated: sim.authenticated,
        lastQuery: sim.query,
        leaked: sim.rows.map((r) => r.password).filter((p) => p && p !== "-")
      });
    } else if (cmd === "submit") {
      out.push(line("output", `enviado: ${rest}`));
      commit();
    } else {
      out.push(line("error", `comando no reconocido: ${cmd}`));
    }

    set((s) => ({ log: [...s.log, ...out], lastSim: sim, justAdvanced: advancedNow }));
  }
}));

function renderRows(sim: SimResult): string {
  const header = "id  | username    | password            | role";
  const sep = "----+-------------+---------------------+------";
  const body = sim.rows
    .map(
      (r) =>
        `${String(r.id).padEnd(3)} | ${r.username.padEnd(11)} | ${r.password.padEnd(19)} | ${r.role}`
    )
    .join("\n");
  return [header, sep, body].join("\n");
}

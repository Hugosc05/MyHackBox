import type { LabDefinition, LabState, LabStep, StepValidator, LabContext } from "./types";

export function initState(): LabState {
  return {
    index: 0,
    status: "running",
    attempts: 0,
    usedHint: false,
    completed: [],
    context: { authenticated: false, leaked: [] }
  };
}

export function currentStep(lab: LabDefinition, state: LabState): LabStep | null {
  return lab.steps[state.index] ?? null;
}

export function matches(v: StepValidator, input: string, ctx: LabContext): boolean {
  const raw = input.trim();
  switch (v.kind) {
    case "exact":
      return raw.toLowerCase() === (v.value ?? "").toLowerCase();
    case "contains":
      return raw.toLowerCase().includes((v.value ?? "").toLowerCase());
    case "regex":
      return new RegExp(v.pattern ?? "", v.flags ?? "i").test(raw);
    case "predicate":
      return Boolean(v.predicate?.(raw, ctx));
    default:
      return false;
  }
}

export interface SubmitResult {
  state: LabState;
  advanced: boolean;
  finished: boolean;
  reveal?: string;
}

export function submit(
  lab: LabDefinition,
  state: LabState,
  input: string,
  ctxPatch?: Partial<LabContext>
): SubmitResult {
  if (state.status === "completed") return { state, advanced: false, finished: true };

  const context = { ...state.context, ...ctxPatch };
  const step = currentStep(lab, state);
  if (!step) return { state: { ...state, context }, advanced: false, finished: true };

  if (!matches(step.validator, input, context)) {
    return {
      state: { ...state, attempts: state.attempts + 1, context },
      advanced: false,
      finished: false
    };
  }

  const nextIndex = state.index + 1;
  const finished = nextIndex >= lab.steps.length;

  return {
    state: {
      ...state,
      index: nextIndex,
      status: finished ? "completed" : "running",
      attempts: 0,
      usedHint: false,
      completed: [...state.completed, step.id],
      context
    },
    advanced: true,
    finished,
    reveal: step.reveals
  };
}

export function revealHint(state: LabState): LabState {
  return { ...state, usedHint: true };
}

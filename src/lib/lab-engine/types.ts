export type ValidatorKind = "exact" | "regex" | "contains" | "predicate";

export type StepTarget = "terminal" | "form";

export interface StepValidator {
  kind: ValidatorKind;
  value?: string;
  pattern?: string;
  flags?: string;
  predicate?: (input: string, ctx: LabContext) => boolean;
}

export interface LabStep {
  id: string;
  title: string;
  brief: string;
  hint?: string;
  reveals?: string;
  target: StepTarget;
  validator: StepValidator;
}

export interface LabDefinition {
  slug: string;
  title: string;
  category: string;
  mode: "guided" | "challenge";
  intro: string;
  steps: LabStep[];
}

export interface LabContext {
  lastQuery?: string;
  authenticated: boolean;
  leaked: string[];
}

export type LogKind = "input" | "output" | "success" | "error" | "system";

export interface LogEntry {
  id: number;
  kind: LogKind;
  text: string;
}

export interface LabState {
  index: number;
  status: "running" | "completed";
  attempts: number;
  usedHint: boolean;
  completed: string[];
  context: LabContext;
}

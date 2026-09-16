import type { LabDefinition } from "@/lib/lab-engine/types";
import { sqlInjectionLab } from "@/lib/labs/sql-injection";

export const GUIDED: LabDefinition[] = [sqlInjectionLab];

export const guidedBySlug = (slug: string) => GUIDED.find((g) => g.slug === slug) ?? null;

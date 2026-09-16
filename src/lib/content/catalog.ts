import { CHALLENGES } from "./challenges";
import { GUIDED } from "./guided";
import { ENGINE_GUIDED } from "./guided-engine";

export interface CatalogItem {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  mode: "GUIDED" | "CHALLENGE";
  summary: string;
}

export const CATALOG: CatalogItem[] = [
  ...GUIDED.map((g) => ({
    slug: g.slug,
    title: g.title,
    category: g.category,
    difficulty: "BEGINNER",
    mode: "GUIDED" as const,
    summary: g.intro
  })),
  ...ENGINE_GUIDED.map((g) => ({
    slug: g.slug,
    title: g.title,
    category: g.category,
    difficulty: "BEGINNER",
    mode: "GUIDED" as const,
    summary: g.intro[0]
  })),
  ...CHALLENGES.map((c) => ({
    slug: c.slug,
    title: c.title,
    category: c.category,
    difficulty: c.difficulty,
    mode: "CHALLENGE" as const,
    summary: c.brief
  }))
];

export const isGuidedSlug = (slug: string) =>
  GUIDED.some((g) => g.slug === slug) || ENGINE_GUIDED.some((g) => g.slug === slug);

export const CATEGORIES: Record<string, string> = {
  SQLI: "SQL Injection",
  XSS: "Cross-Site Scripting",
  CMDI: "Command Injection",
  TRAVERSAL: "Path Traversal",
  BRUTE_FORCE: "Brute Force",
  SESSION_HIJACKING: "Session Hijacking",
  SPOOFING: "Spoofing / MITM",
  CRYPTO: "Crypto & Encoding"
};

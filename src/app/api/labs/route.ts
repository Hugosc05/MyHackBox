import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CATALOG } from "@/lib/content/catalog";

export async function GET() {
  const user = await requireUser();
  const done: Record<string, { status: string; step?: number }> = {};

  if (user) {
    const [prog, subs] = await Promise.all([
      prisma.userLabProgress.findMany({ where: { userId: user.id } }),
      prisma.challengeSubmission.findMany({ where: { userId: user.id, isCorrect: true } })
    ]);
    prog.forEach((p) => (done[p.labSlug] = { status: p.status, step: p.currentStepIndex }));
    subs.forEach((s) => (done[s.labSlug] = { status: "COMPLETED" }));
  }

  return NextResponse.json({
    xp: user?.xp ?? 0,
    items: CATALOG.map((i) => ({ ...i, progress: done[i.slug] ?? null }))
  });
}

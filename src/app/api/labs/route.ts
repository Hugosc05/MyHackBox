import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CATALOG } from "@/lib/content/catalog";

export async function GET() {
  const done: Record<string, { status: string; step?: number }> = {};
  let xp = 0;

  try {
    const user = await requireUser();
    if (user) {
      xp = user.xp;
      const [prog, subs] = await Promise.all([
        prisma.userLabProgress.findMany({ where: { userId: user.id } }),
        prisma.challengeSubmission.findMany({ where: { userId: user.id, isCorrect: true } })
      ]);
      prog.forEach((p: { labSlug: string; status: string; currentStepIndex: number }) => (done[p.labSlug] = { status: p.status, step: p.currentStepIndex }));
      subs.forEach((s: { labSlug: string }) => (done[s.labSlug] = { status: "COMPLETED" }));
    }
  } catch (e) {
    console.error("[/api/labs]", e);
    // Degradación elegante: el catálogo se sirve igualmente sin overlay de progreso.
  }

  return NextResponse.json({
    xp,
    items: CATALOG.map((i) => ({ ...i, progress: done[i.slug] ?? null }))
  });
}

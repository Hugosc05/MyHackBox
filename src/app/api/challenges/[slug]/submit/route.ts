import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, xpFor } from "@/lib/auth";
import { challengeBySlug } from "@/lib/content/challenges";
import { flagMatches } from "@/lib/hash";
import { guard, parseBody } from "@/lib/security";
import { flagSchema } from "@/lib/validate";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const blocked = guard(req, { key: "submit", limit: 30, windowMs: 60_000 });
  if (blocked) return blocked;

  const { slug } = await params;
  const challenge = challengeBySlug(slug);
  if (!challenge) return NextResponse.json({ error: "unknown challenge" }, { status: 404 });

  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "no session" }, { status: 401 });

  const parsed = await parseBody(req, flagSchema);
  if ("error" in parsed) return parsed.error;

  const correct = flagMatches(parsed.data.flag, challenge.flag);

  const already = await prisma.challengeSubmission.findFirst({
    where: { userId: user.id, labSlug: slug, isCorrect: true }
  });
  await prisma.challengeSubmission.create({ data: { userId: user.id, labSlug: slug, isCorrect: correct } });

  let xp = user.xp;
  if (correct && !already) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: xpFor(challenge.difficulty) } }
    });
    xp = updated.xp;
  }

  return NextResponse.json({ correct, xp, firstSolve: correct && !already });
}

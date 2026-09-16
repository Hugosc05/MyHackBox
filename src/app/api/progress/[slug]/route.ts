import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isGuidedSlug } from "@/lib/content/catalog";
import { guard, parseBody } from "@/lib/security";
import { progressSchema } from "@/lib/validate";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ progress: null });
  const progress = await prisma.userLabProgress.findUnique({
    where: { userId_labSlug: { userId: user.id, labSlug: slug } }
  });
  return NextResponse.json({ progress });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const blocked = guard(req, { key: "progress", limit: 120, windowMs: 60_000 });
  if (blocked) return blocked;

  const { slug } = await params;
  if (!isGuidedSlug(slug)) return NextResponse.json({ error: "unknown lab" }, { status: 404 });

  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "no session" }, { status: 401 });

  const parsed = await parseBody(req, progressSchema);
  if ("error" in parsed) return parsed.error;
  const index = parsed.data.index;
  const done = Boolean(parsed.data.done);

  const existing = await prisma.userLabProgress.findUnique({
    where: { userId_labSlug: { userId: user.id, labSlug: slug } }
  });
  const wasDone = existing?.status === "COMPLETED";

  const progress = await prisma.userLabProgress.upsert({
    where: { userId_labSlug: { userId: user.id, labSlug: slug } },
    update: {
      currentStepIndex: index,
      status: done ? "COMPLETED" : "IN_PROGRESS",
      completedAt: done ? new Date() : null
    },
    create: {
      userId: user.id,
      labSlug: slug,
      currentStepIndex: index,
      status: done ? "COMPLETED" : "IN_PROGRESS",
      completedAt: done ? new Date() : null
    }
  });

  let xp = user.xp;
  if (done && !wasDone) {
    const updated = await prisma.user.update({ where: { id: user.id }, data: { xp: { increment: 150 } } });
    xp = updated.xp;
  }

  return NextResponse.json({ progress, xp });
}

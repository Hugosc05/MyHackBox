import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ user: null });

    const [progress, subs] = await Promise.all([
      prisma.userLabProgress.findMany({ where: { userId: user.id } }),
      prisma.challengeSubmission.findMany({ where: { userId: user.id, isCorrect: true } })
    ]);

    return NextResponse.json({
      user: { id: user.id, handle: user.handle, xp: user.xp, authed: Boolean(user.email) },
      guided: progress,
      solved: [...new Set(subs.map((s: { labSlug: string }) => s.labSlug))]
    });
  } catch (e) {
    console.error("[/api/me]", e);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

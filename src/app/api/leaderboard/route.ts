import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { xp: { gt: 0 } },
      orderBy: { xp: "desc" },
      take: 20,
      select: { id: true, handle: true, xp: true }
    });
    const ids = users.map((u: { id: string; handle: string; xp: number }) => u.id);

    const [subs, prog] = await Promise.all([
      prisma.challengeSubmission.findMany({
        where: { userId: { in: ids }, isCorrect: true },
        select: { userId: true, labSlug: true }
      }),
      prisma.userLabProgress.findMany({
        where: { userId: { in: ids }, status: "COMPLETED" },
        select: { userId: true, labSlug: true }
      })
    ]);

    const solved = new Map<string, Set<string>>();
    const add = (uid: string, slug: string) => {
      if (!solved.has(uid)) solved.set(uid, new Set());
      solved.get(uid)!.add(slug);
    };
    subs.forEach((s: { userId: string; labSlug: string }) => add(s.userId, s.labSlug));
    prog.forEach((p: { userId: string; labSlug: string }) => add(p.userId, p.labSlug));

    return NextResponse.json({
      rows: users.map((u: { id: string; handle: string; xp: number }, i: number) => ({
        rank: i + 1,
        handle: u.handle,
        xp: u.xp,
        solved: solved.get(u.id)?.size ?? 0
      }))
    });
  } catch (e) {
    console.error("[/api/leaderboard]", e);
    return NextResponse.json({ rows: [] }, { status: 200 });
  }
}

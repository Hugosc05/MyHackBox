import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifySession, sessionCookie } from "@/lib/session";

export async function POST() {
  const jar = await cookies();
  const id = verifySession(jar.get("mhb_session")?.value);
  let user = id ? await prisma.user.findUnique({ where: { id } }) : null;

  if (!user) {
    user = await prisma.user.create({
      data: { handle: "operator-" + Math.random().toString(36).slice(2, 8) }
    });
  }

  const res = NextResponse.json({ id: user.id, handle: user.handle, xp: user.xp, authed: Boolean(user.email) });
  const c = sessionCookie(user.id);
  res.cookies.set(c.name, c.value, c.options);
  return res;
}

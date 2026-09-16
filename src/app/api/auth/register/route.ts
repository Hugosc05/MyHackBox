import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { guard, parseBody } from "@/lib/security";
import { registerSchema } from "@/lib/validate";
import { hashPassword } from "@/lib/password";
import { verifySession, sessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const blocked = guard(req, { key: "register", limit: 5, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = await parseBody(req, registerSchema);
  if ("error" in parsed) return parsed.error;
  const { email, password, handle } = parsed.data;

  const [emailTaken, handleTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { handle } })
  ]);
  if (emailTaken) return NextResponse.json({ error: "ese email ya está registrado" }, { status: 409 });
  if (handleTaken) return NextResponse.json({ error: "ese alias ya existe" }, { status: 409 });

  const passwordHash = hashPassword(password);

  // Si hay una sesión de invitado sin cuenta, la promovemos en el sitio para conservar el progreso.
  const jar = await cookies();
  const guestId = verifySession(jar.get("mhb_session")?.value);
  let user = null;
  if (guestId) {
    const guest = await prisma.user.findUnique({ where: { id: guestId } });
    if (guest && !guest.email) {
      user = await prisma.user.update({ where: { id: guest.id }, data: { email, handle, passwordHash } });
    }
  }
  if (!user) user = await prisma.user.create({ data: { email, handle, passwordHash } });

  const res = NextResponse.json({ id: user.id, handle: user.handle, xp: user.xp, authed: true });
  const c = sessionCookie(user.id);
  res.cookies.set(c.name, c.value, c.options);
  return res;
}

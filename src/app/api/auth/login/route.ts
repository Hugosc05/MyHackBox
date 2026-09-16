import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guard, parseBody } from "@/lib/security";
import { loginSchema } from "@/lib/validate";
import { verifyPassword } from "@/lib/password";
import { sessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const blocked = guard(req, { key: "login", limit: 10, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = await parseBody(req, loginSchema);
  if ("error" in parsed) return parsed.error;
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Respuesta genérica para no revelar si el email existe.
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash))
    return NextResponse.json({ error: "credenciales inválidas" }, { status: 401 });

  const res = NextResponse.json({ id: user.id, handle: user.handle, xp: user.xp, authed: true });
  const c = sessionCookie(user.id);
  res.cookies.set(c.name, c.value, c.options);
  return res;
}

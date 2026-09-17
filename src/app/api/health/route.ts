import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Diagnóstico: abre /api/health en el navegador. Dice qué variables de entorno
// están presentes y el error EXACTO de la base de datos si algo falla.
export async function GET() {
  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DIRECT_URL: Boolean(process.env.DIRECT_URL),
    AUTH_SECRET: Boolean(process.env.AUTH_SECRET)
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, env });
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    return NextResponse.json(
      { ok: false, env, code: err?.code ?? null, message: String(err?.message ?? e).slice(0, 600) },
      { status: 500 }
    );
  }
}

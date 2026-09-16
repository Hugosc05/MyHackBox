import { cookies } from "next/headers";
import { prisma } from "./db";
import { verifySession } from "./session";

export async function currentUserId(): Promise<string | null> {
  const jar = await cookies();
  return verifySession(jar.get("mhb_session")?.value);
}

export async function requireUser() {
  const id = await currentUserId();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export function xpFor(difficulty: string): number {
  if (difficulty === "ADVANCED") return 300;
  if (difficulty === "INTERMEDIATE") return 200;
  return 100;
}

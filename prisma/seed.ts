import { PrismaClient } from "@prisma/client";
import { CHALLENGES } from "../src/lib/content/challenges.ts";
import { GUIDED } from "../src/lib/content/guided.ts";

const prisma = new PrismaClient();

async function main() {
  // El catálogo vive en código (fuente única de verdad); las flags se validan
  // por hash en el servidor. La BD solo persiste usuarios, progreso y envíos.
  await prisma.$connect();
  console.log(`catálogo: ${GUIDED.length} guiado(s) + ${CHALLENGES.length} retos`);
  console.log("categorías:", [...new Set(CHALLENGES.map((c) => c.category))].join(", "));
  console.log("base de datos lista.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

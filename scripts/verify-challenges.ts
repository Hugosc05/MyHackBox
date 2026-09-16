import { CHALLENGES } from "../src/lib/content/challenges.ts";
import { runEngine, type Mem } from "../src/lib/simulators/index.ts";

let ok = true;
const assert = (cond: boolean, msg: string) => {
  if (!cond) ok = false;
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
};

for (const c of CHALLENGES) {
  const mem: Mem = {};
  let solved = false;
  for (const cmd of c.starters) {
    const res = runEngine(c.engine, cmd, c.params, mem);
    if (res.solved) solved = true;
  }
  assert(solved, `${c.slug} (${c.category}/${c.difficulty}) se resuelve con sus starters`);
  assert(/^MHB\{.+\}$/.test(c.flag), `${c.slug} tiene flag con formato válido`);
}

// negativos: un input trivial no debe resolver
const bypass = CHALLENGES.find((c) => c.slug === "sqli-login-bypass")!;
assert(!runEngine("sqli", "login admin :: 1234", bypass.params, {}).solved, "sqli-bypass no cede a credenciales normales");
const trav = CHALLENGES.find((c) => c.slug === "traversal-config")!;
assert(!runEngine("traversal", "get avatar.png", trav.params, {}).solved, "traversal no cede a una ruta normal");

// crypto: los cifrados decodifican a su flag
const b64c = CHALLENGES.find((c) => c.slug === "crypto-b64")!;
assert(atob(b64c.params.cipher) === b64c.flag, "crypto-b64: el cifrado decodifica a la flag");

console.log(ok ? "\nALL GREEN" : "\nFAILURES PRESENT");
process.exit(ok ? 0 : 1);

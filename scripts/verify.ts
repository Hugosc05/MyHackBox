import { sqlInjectionLab } from "../src/lib/labs/sql-injection.ts";
import { initState, submit } from "../src/lib/lab-engine/machine.ts";
import { runLogin } from "../src/lib/labs/sqli-sim.ts";
import type { LabState, LabContext } from "../src/lib/lab-engine/types.ts";

function parseLogin(rest: string) {
  const [u, p = ""] = rest.split("::");
  return { username: u.trim(), password: p.trim() };
}

function drive(state: LabState, input: string) {
  const cmd = input.split(/\s+/)[0].toLowerCase();
  const rest = input.slice(cmd.length).trim();
  let patch: Partial<LabContext> | undefined;
  if (cmd === "login") {
    const { username, password } = parseLogin(rest);
    const sim = runLogin(username, password);
    patch = { authenticated: sim.authenticated, lastQuery: sim.query };
  }
  return submit(sqlInjectionLab, state, input, patch);
}

let ok = true;
const assert = (cond: boolean, msg: string) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) ok = false;
};

// simulator sanity
assert(runLogin("admin", "1234").authenticated === false, "creds normales => denegado");
assert(!!runLogin("'", "x").error, "comilla suelta => error de sintaxis");
assert(runLogin("admin' OR '1'='1' -- ", "x").authenticated === true, "tautologia => bypass");
const dump = runLogin("' UNION SELECT username,password,role FROM users -- ", "x");
assert(dump.rows.some((r) => r.password === "S3cur3!Adm1n_2049"), "UNION => exfiltra password admin");

// full guided flow through the FSM
const inputs = [
  "login admin :: 1234",
  "login ' :: x",
  "login admin' OR '1'='1' -- :: x",
  "login ' UNION SELECT username,password,role FROM users -- :: x",
  "submit S3cur3!Adm1n_2049"
];

let state = initState();
inputs.forEach((input, i) => {
  const res = drive(state, input);
  assert(res.advanced, `paso ${i + 1} avanza con: ${input}`);
  state = res.state;
});
assert(state.status === "completed", "lab completado tras los 5 pasos");
assert(state.index === 5, "indice final = 5");

// negative: wrong input must NOT advance
let s2 = initState();
const noadv = drive(s2, "help");
assert(!noadv.advanced, "'help' no avanza el paso 1");
// bypass payload skips detection step -> should NOT match step 2 (needs plain quote, no tautology)
let s3 = drive(initState(), "login admin :: 1234").state;
const early = drive(s3, "login admin' OR '1'='1' -- :: x");
assert(!early.advanced, "tautologia en paso 2 no avanza (requiere deteccion primero)");

console.log(ok ? "\nALL GREEN" : "\nFAILURES PRESENT");
process.exit(ok ? 0 : 1);

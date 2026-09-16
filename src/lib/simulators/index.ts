export type LineKind = "input" | "output" | "system" | "success" | "error";
export interface Line { kind: LineKind; text: string; }
export interface EngineResult { lines: Line[]; solved: boolean; }
export type Mem = Record<string, unknown>;
export type Engine = (input: string, params: Record<string, any>, mem: Mem) => EngineResult;

const L = (kind: LineKind, text: string): Line => ({ kind, text });
const strip = (s: string) => s.split("--")[0].split("#")[0];
const TAUT = /or\s+('1'\s*=\s*'1'|1\s*=\s*1|'x'\s*=\s*'x'|true)/i;

const USERS = [
  { id: 1, username: "admin", password: "S3cur3!Adm1n_2049", role: "admin" },
  { id: 2, username: "j.rivera", password: "hunter2", role: "staff" },
  { id: 3, username: "guest", password: "guest", role: "guest" }
];

function parsePair(rest: string) {
  const [u, p = ""] = rest.split("::");
  return { u: u.trim(), p: p.trim() };
}

const sqli: Engine = (input, params) => {
  const cmd = input.split(/\s+/)[0].toLowerCase();
  const rest = input.slice(cmd.length).trim();
  if (cmd === "target")
    return {
      lines: [L("output", "POST /login  ·  SELECT id,username,role FROM users WHERE username='<u>' AND password='<p>'")],
      solved: false
    };
  if (cmd !== "login")
    return { lines: [L("error", "usa: login <user> :: <pass>  |  target")], solved: false };

  const { u, p } = parsePair(rest);
  const query = `SELECT id,username,role FROM users WHERE username='${u}' AND password='${p}'`;
  const lines: Line[] = [L("system", "> " + query)];
  const inj = `${u} ${p}`;
  const um = inj.match(/union\s+select\s+(.+)/i);
  if (um) {
    const cols = strip(um[1]).split(",").map((c) => c.trim().replace(/^['"]|['"]$/g, ""));
    const want = (n: string) => cols.includes(n) || cols.includes("*");
    USERS.forEach((r) =>
      lines.push(L("output", `${r.username} | ${want("password") ? r.password : "-"} | ${r.role}`))
    );
    const solved = params.mode === "dump";
    if (!solved) lines.push(L("output", "volcado obtenido, pero este reto pide otro objetivo"));
    return { lines, solved };
  }
  if (TAUT.test(u) || TAUT.test(p)) {
    lines.push(L("success", "autenticado como admin (WHERE forzado a TRUE)"));
    return { lines, solved: params.mode === "bypass" };
  }
  const hit = USERS.find((r) => r.username === u && r.password === p);
  if (hit) { lines.push(L("success", "login correcto")); return { lines, solved: false }; }
  const quotes = ((u + p).match(/'/g) ?? []).length;
  if (quotes % 2 === 1) lines.push(L("error", "ERROR 1064: SQL syntax near \"'\""));
  else lines.push(L("output", "acceso denegado"));
  return { lines, solved: false };
};

const xss: Engine = (input, params) => {
  const cmd = input.split(/\s+/)[0].toLowerCase();
  if (cmd !== "payload")
    return { lines: [L("error", "usa: payload <html>  (se refleja sin sanitizar)")], solved: false };
  const html = input.slice(7).trim();
  const lines: Line[] = [L("system", `reflejado → <div class="comment">${html}</div>`)];
  const hasSink = /<script|onerror\s*=|onload\s*=|<img|<svg|javascript:/i.test(html);
  const fires = hasSink && /(alert|prompt|confirm)\s*\(/i.test(html);
  const steals = hasSink && /document\.cookie/i.test(html) && /(fetch|new image|\.src\s*=|location)/i.test(html);
  if (params.mode === "cookie") {
    if (steals) { lines.push(L("success", "payload ejecutado · cookie SID exfiltrada a tu servidor")); return { lines, solved: true }; }
    if (fires) lines.push(L("output", "el script se ejecuta, pero no exfiltra la cookie"));
    else lines.push(L("output", "sin ejecución: el navegador no encontró un vector activo"));
    return { lines, solved: false };
  }
  if (fires) { lines.push(L("success", "alert() disparado en el navegador de la víctima")); return { lines, solved: true }; }
  lines.push(L("output", "el input se refleja pero no ejecuta JS"));
  return { lines, solved: false };
};

const cmdi: Engine = (input, params) => {
  const cmd = input.split(/\s+/)[0].toLowerCase();
  if (cmd !== "ping")
    return { lines: [L("error", "usa: ping <host>  (el host se pasa a la shell)")], solved: false };
  const arg = input.slice(4).trim();
  const lines: Line[] = [L("system", `$ ping -c1 ${arg}`)];
  const chained = /[;&|`]|\$\(/.test(arg);
  const reads = new RegExp(`(cat|less|head|type)\\s+.*${params.file.replace(".", "\\.")}`, "i").test(arg);
  if (chained && reads) {
    lines.push(L("output", "PING: 1 packets transmitted"));
    lines.push(L("success", `# ${params.file}`));
    lines.push(L("output", params.contents));
    return { lines, solved: true };
  }
  if (chained) lines.push(L("output", "comando encadenado ejecutado (nada que mostrar)"));
  else lines.push(L("output", `PING ${arg}: 64 bytes, time=0.4ms`));
  return { lines, solved: false };
};

const traversal: Engine = (input, params) => {
  const cmd = input.split(/\s+/)[0].toLowerCase();
  if (cmd !== "get")
    return { lines: [L("error", "usa: get <ruta>  (descarga desde /var/www/uploads/)")], solved: false };
  let path = input.slice(3).trim().replace(/%2e/gi, ".").replace(/%2f/gi, "/");
  path = path.replace(/\.\.\.\.\/\//g, "../");
  const lines: Line[] = [L("system", `GET /download?file=${input.slice(3).trim()}`)];
  const ups = (path.match(/\.\.\//g) ?? []).length;
  if (ups >= params.depth && path.includes(params.target)) {
    lines.push(L("success", `200 OK · ${params.target}`));
    lines.push(L("output", params.contents));
    return { lines, solved: true };
  }
  if (ups > 0) lines.push(L("output", "403: fuera del directorio permitido pero sin llegar al objetivo"));
  else lines.push(L("output", "404: file not found in uploads/"));
  return { lines, solved: false };
};

const bruteforce: Engine = (input, params, mem) => {
  const cmd = input.split(/\s+/)[0].toLowerCase();
  const wl: string[] = params.wordlist;
  if (cmd === "crack") {
    const lines: Line[] = [L("system", `hydra -l ${params.username} -P rockyou.min ${params.username}@target`)];
    let found = "";
    for (const w of wl) {
      if (w === params.password) { found = w; break; }
      lines.push(L("output", `  [-] ${params.username}:${w}`));
    }
    if (found) {
      lines.push(L("success", `  [+] ${params.username}:${found}  ← VÁLIDA`));
      mem.found = true;
      return { lines, solved: true };
    }
    lines.push(L("error", "wordlist agotada sin éxito"));
    return { lines, solved: false };
  }
  if (cmd === "try") {
    const pw = input.slice(3).trim();
    if (pw === params.password) return { lines: [L("success", "login correcto")], solved: true };
    return { lines: [L("output", `denegado: ${pw}`)], solved: false };
  }
  return { lines: [L("error", "usa: crack  |  try <password>")], solved: false };
};

const hijack: Engine = (input, params, mem) => {
  const cmd = input.split(/\s+/)[0].toLowerCase();
  if (cmd === "sniff") {
    mem.sniffed = true;
    return {
      lines: [
        L("system", "tcpdump -A -i wlan0 port 80"),
        L("output", "GET /feed  Cookie: theme=dark; lang=es"),
        L("output", `POST /admin  Cookie: SID=${params.validToken}`),
        L("output", "GET /img/logo  Cookie: theme=dark"),
        L("system", "captura detenida · revisa las cookies interceptadas")
      ],
      solved: false
    };
  }
  if (cmd === "replay") {
    const tok = input.slice(6).trim();
    if (!mem.sniffed) return { lines: [L("output", "no tienes ningún token todavía · prueba 'sniff'")], solved: false };
    if (tok === params.validToken)
      return { lines: [L("success", "sesión de admin secuestrada · panel /admin accesible")], solved: true };
    return { lines: [L("error", "SID inválido o expirado")], solved: false };
  }
  return { lines: [L("error", "usa: sniff  |  replay <SID>")], solved: false };
};

const spoofing: Engine = (input, params, mem) => {
  const cmd = input.split(/\s+/)[0].toLowerCase();
  if (cmd === "arpspoof") {
    mem.mitm = true;
    return { lines: [L("success", `MITM activo: ${params.target} ⇄ ${params.gateway} pasan por ti`)], solved: false };
  }
  if (cmd === "dnsspoof") {
    if (!mem.mitm) return { lines: [L("output", "necesitas posición MITM primero · usa 'arpspoof <victima> <gateway>'")], solved: false };
    const dom = input.slice(8).trim();
    if (dom.includes(params.domain)) { mem.dns = true; return { lines: [L("success", `${params.domain} → resuelve a tu servidor falso`)], solved: false }; }
    return { lines: [L("output", "dominio no coincide con el objetivo")], solved: false };
  }
  if (cmd === "harvest") {
    if (mem.mitm && mem.dns)
      return {
        lines: [L("success", "la víctima envió sus credenciales al portal clonado"), L("output", `capturado → admin:${params.loot}`)],
        solved: true
      };
    return { lines: [L("output", "aún no llega tráfico útil · completa arpspoof y dnsspoof")], solved: false };
  }
  return { lines: [L("error", "usa: arpspoof <victima> <gateway>  |  dnsspoof <dominio>  |  harvest")], solved: false };
};

const crypto: Engine = (input, params) => {
  const cmd = input.split(/\s+/)[0].toLowerCase();
  const arg = input.slice(cmd.length).trim();
  const b64 = (s: string) => { try { return atob(s); } catch { return ""; } };
  const rot13 = (s: string) => s.replace(/[a-z]/gi, (c) => String.fromCharCode((c <= "Z" ? 90 : 122) >= c.charCodeAt(0) + 13 ? c.charCodeAt(0) + 13 : c.charCodeAt(0) - 13));
  if (cmd === "cipher") return { lines: [L("output", params.cipher)], solved: false };
  if (cmd === "b64") {
    const out = b64(arg);
    return { lines: [L(out ? "output" : "error", out || "no es base64 válido")], solved: /MHB\{/.test(out) };
  }
  if (cmd === "rot13") {
    const out = rot13(arg);
    return { lines: [L("output", out)], solved: /MHB\{/.test(out) };
  }
  return { lines: [L("error", "usa: cipher  |  b64 <texto>  |  rot13 <texto>")], solved: false };
};

export const ENGINES: Record<string, Engine> = {
  sqli, xss, cmdi, traversal, bruteforce, hijack, spoofing, crypto
};

export function runEngine(name: string, input: string, params: Record<string, any>, mem: Mem): EngineResult {
  const fn = ENGINES[name];
  if (!fn) return { lines: [L("error", `motor desconocido: ${name}`)], solved: false };
  return fn(input, params, mem);
}

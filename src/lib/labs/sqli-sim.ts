export interface SimRow {
  id: number;
  username: string;
  password: string;
  role: string;
}

export interface SimResult {
  query: string;
  authenticated: boolean;
  rows: SimRow[];
  error?: string;
  note: string;
}

const USERS: SimRow[] = [
  { id: 1, username: "admin", password: "S3cur3!Adm1n_2049", role: "admin" },
  { id: 2, username: "j.rivera", password: "hunter2", role: "staff" },
  { id: 3, username: "guest", password: "guest", role: "guest" }
];

const stripComment = (s: string) => s.split("--")[0].split("#")[0];

const isTautology = (fragment: string) => {
  const f = fragment.toLowerCase().replace(/\s+/g, " ");
  return /or\s+('1'\s*=\s*'1'|1\s*=\s*1|'x'\s*=\s*'x'|true)/.test(f);
};

const unionColumns = (input: string): string[] | null => {
  const m = input.toLowerCase().match(/union\s+select\s+(.+)/i);
  if (!m) return null;
  return stripComment(m[1])
    .split(",")
    .map((c) => c.trim().replace(/^['"]|['"]$/g, ""));
};

export function runLogin(username: string, password: string): SimResult {
  const query = `SELECT id, username, role FROM users WHERE username='${username}' AND password='${password}'`;

  const injected = `${username} ${password}`;
  const cols = unionColumns(injected);
  if (cols) {
    const wants = (name: string) => cols.some((c) => c === name || c === "*");
    const rows = USERS.map((u) => ({
      id: u.id,
      username: wants("username") || wants("*") ? u.username : "-",
      password: wants("password") || wants("*") ? u.password : "-",
      role: wants("role") || wants("*") ? u.role : "-"
    }));
    return {
      query,
      authenticated: true,
      rows,
      note: "UNION-based injection: la consulta devolvió columnas de la tabla users."
    };
  }

  const clause = stripComment(`${username}' ${password}`);
  if (isTautology(clause) || isTautology(username) || isTautology(password)) {
    return {
      query,
      authenticated: true,
      rows: [USERS[0]],
      note: "Tautología inyectada: el WHERE siempre evalúa TRUE → autenticación evitada."
    };
  }

  const match = USERS.find((u) => u.username === username && u.password === password);
  if (match) {
    return { query, authenticated: true, rows: [match], note: "Credenciales válidas." };
  }

  const quotes = (`${username}${password}`.match(/'/g) ?? []).length;
  if (quotes % 2 === 1) {
    return {
      query,
      authenticated: false,
      rows: [],
      error: "ERROR 1064: You have an error in your SQL syntax near \"'\"",
      note: "La comilla rompió la sintaxis de la consulta → el campo es inyectable."
    };
  }

  return { query, authenticated: false, rows: [], note: "Acceso denegado." };
}

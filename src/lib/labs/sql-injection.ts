import type { LabDefinition } from "@/lib/lab-engine/types";

const tautology = /or\s+('1'\s*=\s*'1'|1\s*=\s*1|'x'\s*=\s*'x'|true)/i;

export const FLAG = "MHB{sql1_1nj3ct10n_pwn3d}";

export const sqlInjectionLab: LabDefinition = {
  slug: "sql-injection",
  title: "SQL Injection — Iniciación",
  category: "SQLI",
  mode: "guided",
  intro:
    "El portal de acceso de Acme Corp construye su consulta de login concatenando " +
    "directamente lo que escribes. Vas a explotarlo paso a paso, desde el reconocimiento " +
    "hasta la exfiltración de credenciales.",
  steps: [
    {
      id: "recon",
      title: "Reconocimiento",
      brief:
        "Observa cómo responde el portal a una autenticación normal. En la terminal escribe " +
        "un intento con credenciales cualquiera:\n\n  login admin :: 1234",
      hint: "Sintaxis: login <usuario> :: <contraseña>",
      reveals:
        "Acceso denegado. Fíjate en el panel: la app inserta tu texto tal cual dentro de " +
        "una sentencia SQL. Ese es el punto débil.",
      target: "terminal",
      validator: {
        kind: "predicate",
        predicate: (i) => /^login\s+/i.test(i) && !i.includes("'")
      }
    },
    {
      id: "detect",
      title: "Detección",
      brief:
        "Comprueba si el campo es inyectable rompiendo la sintaxis: mete una comilla simple " +
        "en el usuario.\n\n  login ' :: x",
      hint: "Una sola comilla ' en el usuario debería provocar un error de sintaxis SQL.",
      reveals:
        "ERROR de sintaxis SQL. Confirmado: tu input se ejecuta como código. El campo es " +
        "vulnerable a inyección.",
      target: "terminal",
      validator: {
        kind: "predicate",
        predicate: (i) => /^login\s+/i.test(i) && i.includes("'") && !tautology.test(i)
      }
    },
    {
      id: "bypass",
      title: "Bypass de autenticación",
      brief:
        "Inyecta una tautología y comenta el resto de la consulta para saltarte la " +
        "contraseña.\n\n  login admin' OR '1'='1' -- :: x",
      hint: "El patrón clásico es  ' OR '1'='1' --  (el -- comenta la comprobación de la contraseña).",
      reveals:
        "Autenticado como admin sin conocer la contraseña. La tautología forzó el WHERE a TRUE " +
        "y el -- anuló el resto.",
      target: "terminal",
      validator: {
        kind: "predicate",
        predicate: (i) => tautology.test(i)
      }
    },
    {
      id: "exfiltrate",
      title: "Exfiltración con UNION",
      brief:
        "Ya no basta con entrar: extrae las credenciales de toda la tabla users con un ataque " +
        "UNION.\n\n  login ' UNION SELECT username,password,role FROM users -- :: x",
      hint: "UNION SELECT username,password,role FROM users  vuelca las filas en el resultado.",
      reveals:
        "Volcado completo de la tabla users. Ahora tienes la contraseña en claro del usuario admin.",
      target: "terminal",
      validator: {
        kind: "regex",
        pattern: "union\\s+select",
        flags: "i"
      }
    },
    {
      id: "capture",
      title: "Captura",
      brief:
        "Confirma el compromiso enviando la contraseña de admin que acabas de exfiltrar.\n\n  submit <contraseña>",
      hint: "Aparece en la fila del usuario admin del volcado anterior.",
      reveals: `Objetivo comprometido. Flag capturada: ${FLAG}`,
      target: "terminal",
      validator: {
        kind: "contains",
        value: "S3cur3!Adm1n_2049"
      }
    }
  ]
};

# MyHackBox

Plataforma e-learning de **hacking ético**: laboratorios interactivos, simulados y
ultraligeros en el navegador. Dos modos — **iniciación guiada** (paso a paso, dirigida por
una máquina de estados) y **retos sandbox** (sin guías, captura la flag). El progreso y las
flags se persisten con **Prisma**.

> Todas las vulnerabilidades están **simuladas de forma determinista en el cliente**. No se
> ejecuta ni se expone código vulnerable real: entorno puramente educativo.

## Arranque (cero configuración)

```bash
npm install
cp .env.example .env         # DATABASE_URL (SQLite) + AUTH_SECRET
npm run db:generate
npm run db:push              # crea la base de datos
npm run dev
```

Genera un `AUTH_SECRET` con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
Abre `http://localhost:3000`: empiezas como invitado (progreso guardado) y puedes crear cuenta
para conservarlo y salir en el ranking. Para producción, cambia el `provider` de
`prisma/schema.prisma` a `postgresql`.

Autenticación (scrypt + cookie de sesión firmada), rate limiting, validación Zod, CSRF por
origin y cabeceras/CSP están documentadas en [`docs/SECURITY.md`](docs/SECURITY.md).

## Contenido

**Guiado** (paso a paso, con máquina de estados)
- SQL Injection — Iniciación (5 pasos, con simulador visual)
- XSS — Iniciación (reflejo → ejecución → robo de cookie)
- Command Injection — Iniciación (uso legítimo → encadenar → leer fichero)
- Session Hijacking — Iniciación (interceptar → reproducir sesión)

**Retos sandbox** (8 categorías, 3 dificultades)

| Categoría | Retos |
|-----------|-------|
| SQL Injection | Auth Bypass · Union Dump |
| XSS | Reflected Alert · Cookie Stealer |
| Command Injection | Ping of Death · Root RCE |
| Path Traversal | Escape the Web Root |
| Brute Force | Weak Password · SSH Bruteforce |
| Session Hijacking | Stolen Session |
| Spoofing / MITM | DNS Spoof MITM |
| Crypto & Encoding | Base64 Layers · Rotated Secret |

## Arquitectura

```
src/
  app/
    api/                 route handlers (session · me · labs · progress · challenges/submit)
    labs/[slug]/         labs guiados (dinámico)
    challenges/[slug]/   retos sandbox (dinámico)
    page.tsx             catálogo con progreso + XP
  components/lab/        Terminal · SqlSimulator · TutorialPanel · GuidedLab · SandboxLab · FlagPanel
  lib/
    lab-engine/          FSM tipada (types + machine)
    simulators/          8 motores deterministas (sqli, xss, cmdi, traversal, bruteforce, hijack, spoofing, crypto)
    content/             challenges · guided · catalog (fuente única de verdad)
    db.ts · hash.ts · auth.ts · api.ts
  store/                 useLabStore (guiado) · useSandbox (retos)
prisma/schema.prisma     User · UserLabProgress · ChallengeSubmission
```

## Seguridad del modelo

- Simulación determinista en cliente → sin superficie de ataque real.
- Las **flags se validan por hash (SHA-256) en el servidor** con comparación en tiempo
  constante; la API nunca devuelve la flag.
- Identidad por cookie httpOnly. Cambiar a Auth.js es directo (los endpoints ya reciben el
  usuario desde `lib/auth`).
- Nota honesta: al ser la lógica vulnerable *cliente*, las flags están en el bundle. Para
  integridad tipo CTF competitivo, mueve el motor del reto al servidor (opción híbrida).

## Añadir un reto

Agrega un objeto a `src/lib/content/challenges.ts` (engine + params + flag). Si necesita una
mecánica nueva, añade un motor en `src/lib/simulators/`. Nada más: catálogo, ruta, validación
y persistencia lo recogen automáticamente.

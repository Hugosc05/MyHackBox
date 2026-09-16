# MyHackBox — Stack tecnológico

Plataforma e-learning de hacking ético. Entornos interactivos tipo "máquina virtual"
pero ejecutados íntegramente en el navegador: **las vulnerabilidades son simuladas de
forma determinista en el cliente**, por lo que no existe superficie de ataque real que
gestionar y el arranque de un lab es instantáneo.

## Principios

1. **Ligereza extrema.** Nada de VMs ni contenedores por usuario. Un lab es un módulo de
   datos + un simulador puro (funciones sin efectos). Se sirve como JS estático.
2. **Seguridad por diseño.** El código "vulnerable" nunca se ejecuta: se *emula*. El
   backend solo custodia identidad, progreso y validación de retos (los flags no viajan
   al cliente).
3. **Interactividad real.** Los labs guiados avanzan mediante una **máquina de estados
   finita (FSM)**: un paso solo se completa cuando el input del usuario satisface el
   validador de ese paso.

## Frontend

| Área | Elección | Motivo |
|------|----------|--------|
| Framework | **Next.js 15 (App Router) + React 19** | SSR/streaming, rutas por lab, RSC para lo estático |
| Lenguaje | **TypeScript (strict)** | Contratos fuertes entre engine, labs y UI |
| Estilos | **Tailwind CSS v4** | Utilidades + tokens de diseño (tema hacker) sin CSS muerto |
| Animación | **Framer Motion** | Transiciones fluidas, orquestación de aparición, layout animations |
| Estado UI | **Zustand** | Store mínimo para terminal/lab; sin boilerplate |
| Estado del lab | **FSM propia** (`lib/lab-engine`) | Determinista, tipada, testeable y sin dependencia pesada. Alternativa válida: XState |
| Terminal | Componente propio ligero | Evita el peso de xterm.js; feel real con render virtual de líneas |
| Tipografía | **JetBrains Mono / Fira Code** | Monoespaciada, ligaduras de código |

## Backend

| Área | Elección | Motivo |
|------|----------|--------|
| Runtime | **Node.js + Next.js Route Handlers** | Un solo despliegue; API colocada junto al front |
| Validación | **Zod** | Esquemas de entrada en cada endpoint |
| ORM | **Prisma** | Tipado extremo a extremo contra Postgres |
| Base de datos | **PostgreSQL** | Relacional, sólido para progreso y retos |
| Cache/rate-limit | **Redis (Upstash)** | Sesiones efímeras, límite de intentos de flag |
| Auth | **Auth.js (NextAuth)** | Sesiones seguras, OAuth + credenciales |

## Motor de labs guiados (FSM)

El corazón de la experiencia. Cada lab guiado es una lista de pasos; cada paso declara un
**validador** (`exact`, `regex`, `contains` o `predicate`). El motor:

1. Recibe el comando/payload del usuario.
2. Lo evalúa contra el validador del paso actual.
3. Si acierta → emite `advance`, revela la narrativa del paso y desbloquea el siguiente.
4. Si falla → incrementa intentos y, tras N fallos, ofrece pista.

Esto hace que el panel de instrucciones sea **reactivo al comportamiento real** del usuario,
no un texto que se lee: el "Paso 2" solo aparece cuando el "Paso 1" se ha ejecutado de
verdad.

## Seguridad

- Vulnerabilidades **simuladas**: el simulador SQLi es un evaluador puro; nunca toca una BD real.
- **Flags server-side**: los retos se validan por hash en el backend; la respuesta no está en el bundle.
- **CSP estricta**, rate-limiting por IP/usuario en submit de flags, y aislamiento del render de terminal (sin `eval`, sin `dangerouslySetInnerHTML` sobre input del usuario).
- Contenido puramente educativo y sandboxed: no hay herramientas de ataque reales.

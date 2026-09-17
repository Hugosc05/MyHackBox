# Desplegar MyHackBox en Vercel

> ¿Ves un **404** en tu dominio `*.vercel.app`? Casi siempre significa que **no hay un
> despliegue de producción correcto**: el build ha fallado. Las dos causas típicas en este
> proyecto ya están resueltas en el código (Prisma se genera en el build) y con los pasos de
> abajo (base de datos Postgres + variables de entorno). Sigue la guía completa.

## Por qué fallaba

1. **SQLite no funciona en Vercel.** El sistema de ficheros es efímero y de solo lectura en
   funciones serverless, así que `file:./dev.db` no sirve. Hay que usar Postgres.
2. **Prisma Client hay que generarlo en el build.** Ya está resuelto: `package.json` usa
   `build: "prisma generate && next build"` y `postinstall: "prisma generate"`.

## 1. Crea una base de datos Postgres (gratis, 2 min)

Opción A — **Vercel Postgres**: en tu proyecto de Vercel → pestaña **Storage** → *Create
Database* → **Postgres**. Vercel añadirá las variables `POSTGRES_*` y una `DATABASE_URL`.

Opción B — **Neon** (https://neon.tech): crea un proyecto y copia la *connection string*
(algo como `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`).

Opción C — **Supabase** (https://supabase.com): crea un proyecto y pulsa el botón **Connect**
(arriba). En la sección **ORMs → Prisma** te da las dos URLs ya listas:
- **Transaction pooler** (puerto `6543`) → para `DATABASE_URL` (añade `?pgbouncer=true`).
- **Session pooler / Direct** (puerto `5432`) → para `DIRECT_URL`.
Sustituye `[YOUR-PASSWORD]` por la contraseña de la base de datos que fijaste al crear el proyecto.

## 2. Variables de entorno en Vercel

Proyecto → **Settings → Environment Variables**, y añade (para *Production* y *Preview*):

| Nombre | Valor |
|--------|-------|
| `DATABASE_URL` | conexión con **pooler** (Supabase 6543 con `?pgbouncer=true`) |
| `DIRECT_URL` | conexión **directa** (Supabase/Session 5432) |
| `AUTH_SECRET` | un valor aleatorio: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

Con Neon o Vercel Postgres (sin pooler de transacción) puedes poner el **mismo valor** en
`DATABASE_URL` y `DIRECT_URL`. Con Supabase, usa el 6543 para una y el 5432 para la otra.

## 3. Crea las tablas (una vez)

El build **no** crea las tablas. Hazlo una vez desde tu equipo. `prisma db push` usa
`DIRECT_URL` (la directa, puerto 5432), así que define ambas. Lo más cómodo: crea un `.env`
local (ya está en `.gitignore`) con `DATABASE_URL`, `DIRECT_URL` y `AUTH_SECRET`, y ejecuta:

```bash
npm install
npx prisma db push
```

Alternativa sin `.env` (Windows PowerShell):
```powershell
$env:DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
$env:DIRECT_URL="postgresql://...:5432/postgres"
npx prisma db push
```

## 4. Importa el repo en Vercel

- Vercel → **Add New… → Project** → importa `Hugosc05/MyHackBox`.
- **Framework Preset**: Next.js (se detecta solo).
- **Root Directory**: `.` (la raíz del repo; el proyecto Next está en la raíz).
- **Build Command** / **Install Command**: deja los que Vercel detecta (ya usan nuestro
  `build` con `prisma generate`). No hace falta tocar nada.
- Pulsa **Deploy**.

## 5. Comprueba

- Cuando el deploy termine en verde, abre el dominio `*.vercel.app`: debe cargar el catálogo.
- Si sigue fallando, mira **Deployments → (tu deploy) → Building/Functions logs**. Errores
  frecuentes:
  - `Environment variable not found: DATABASE_URL` → falta la variable (paso 2).
  - `relation "User" does not exist` → falta ejecutar `prisma db push` (paso 3).
  - Error de Prisma en runtime → revisa que `DATABASE_URL` tenga `?sslmode=require` (Neon).

## Notas

- Redespliega cada `git push` a `main` automáticamente (yo te subo los cambios al repo).
- Para desarrollo local usa la misma `DATABASE_URL` de Neon (cómodo) o un Postgres local; el
  `.gitignore` ya excluye `.env`.
- Rate limiting: es en memoria (por instancia). En Vercel con varias instancias conviene
  migrarlo a Redis/Upstash más adelante (ver `docs/SECURITY.md`).

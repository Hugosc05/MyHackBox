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

## 2. Variables de entorno en Vercel

Proyecto → **Settings → Environment Variables**, y añade (para *Production* y *Preview*):

| Nombre | Valor |
|--------|-------|
| `DATABASE_URL` | la connection string de Postgres del paso 1 |
| `AUTH_SECRET` | un valor aleatorio: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

Si usaste Vercel Postgres y te creó `DATABASE_URL` sola, solo tienes que añadir `AUTH_SECRET`.

## 3. Crea las tablas (una vez)

El build **no** crea las tablas. Hazlo una vez desde tu equipo apuntando a la BD de producción:

```bash
# en la raíz del proyecto, con la DATABASE_URL de producción
export DATABASE_URL="postgresql://...(la de Neon/Vercel)"
npm install
npx prisma db push
```

(En Windows PowerShell: `$env:DATABASE_URL="postgresql://..."` antes del `npx prisma db push`.)

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

# MyHackBox — Seguridad de la plataforma

Distíngase entre el **contenido** (ataques simulados que se enseñan) y la **seguridad de la
propia web**, que es lo que cubre este documento. Los laboratorios son simulaciones
deterministas en el cliente: no ejecutan código vulnerable real.

## Autenticación y sesiones
- Contraseñas hasheadas con **scrypt** (sal aleatoria por usuario, `N=16384`, clave de 64B).
  Verificación en tiempo constante (`timingSafeEqual`). Nunca se almacena la contraseña.
- Sesión en **cookie firmada con HMAC-SHA256** (`lib/session.ts`), `httpOnly`, `sameSite=lax`,
  `secure` en producción, expiración a 30 días. El secreto viene de `AUTH_SECRET`.
- Identidad de invitado anónima para empezar sin registro; al registrarse se **promueve la
  cuenta en el sitio** conservando el progreso.
- Login con respuesta genérica ("credenciales inválidas") para evitar enumeración de usuarios.

## Superficie de API
- **Validación de entrada con Zod** en todos los endpoints mutadores (`lib/validate.ts`).
- **Rate limiting** por IP en endpoints sensibles (`lib/ratelimit.ts`): login 10/min,
  registro 5/min, submit de flag 30/min, progreso 120/min. En multi-instancia, sustituir el
  store en memoria por Redis manteniendo la interfaz.
- **Protección CSRF**: chequeo de `Origin` frente al `Host` en toda petición mutadora
  (`sameOrigin`), además de `sameSite` en la cookie.
- **Flags validadas server-side** por hash (SHA-256, comparación en tiempo constante). La API
  nunca devuelve la flag correcta.
- Errores sin fugas: mensajes genéricos, sin stack traces al cliente.

## Cabeceras HTTP (`next.config.mjs`)
- **Content-Security-Policy** restrictiva (`default-src 'self'`, sin `object-src`,
  `frame-ancestors 'none'`, fuentes solo desde Google Fonts).
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` mínima.
- **HSTS** en producción.
- `poweredByHeader` desactivado.

## Pendiente recomendado para producción
- Postgres + pooler; migrar el rate-limit a Redis.
- CSP con **nonce por request** para eliminar `'unsafe-inline'` en scripts.
- Rotación de `AUTH_SECRET` y, si se requiere, verificación de email + 2FA.
- Auditoría/logging de intentos de login y envíos de flag.

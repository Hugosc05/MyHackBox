# MyHackBox — Arquitectura de datos

Modelo relacional pensado para distinguir con claridad **progreso guiado** (paso a paso)
de **retos superados** (sandbox con flag).

## Entidades

### `User`
Identidad y agregados de gamificación (XP, racha).

### `Lab`
Catálogo de laboratorios. `mode` distingue `GUIDED` (iniciación) de `CHALLENGE` (testeo).
`category` agrupa por técnica (`SQLI`, `SPOOFING`, `SESSION_HIJACKING`, ...). `order` define
la ruta de aprendizaje.

### `LabStep`
Solo para labs `GUIDED`. Es la definición persistida de cada paso de la FSM: instrucción,
validador esperado y pista. El orden (`index`) marca la secuencia.

### `UserLabProgress`
Estado de un usuario en un lab. Para guiados guarda `currentStepIndex`; para retos guarda si
el flag fue capturado. `status`: `NOT_STARTED | IN_PROGRESS | COMPLETED`.

### `StepCompletion`
Traza granular: qué pasos guiados completó el usuario y cuándo (analítica y reanudación).

### `ChallengeSubmission`
Historial de intentos de flag en labs `CHALLENGE`. `isCorrect` + rate-limit anti fuerza bruta.
El flag correcto vive como **hash** en `Lab.flagHash`, nunca en texto plano ni en el cliente.

### `Achievement` / `UserAchievement`
Insignias desbloqueables (p.ej. "Primera inyección", "Sin pistas").

## Diagrama (relaciones)

```
User 1───∞ UserLabProgress ∞───1 Lab 1───∞ LabStep
 │                                  │
 ├──∞ StepCompletion ∞──1 LabStep   │
 ├──∞ ChallengeSubmission ∞─────────┘
 └──∞ UserAchievement ∞───1 Achievement
```

## Reglas clave

- **Guiado completado** ⇔ `UserLabProgress.status = COMPLETED` con `mode = GUIDED`
  (todos los `LabStep` con su `StepCompletion`).
- **Reto superado** ⇔ existe `ChallengeSubmission.isCorrect = true` para ese `Lab`
  (`mode = CHALLENGE`), lo que también marca su `UserLabProgress` como `COMPLETED`.
- **Gate de progresión**: un lab `CHALLENGE` puede requerir haber completado su equivalente
  `GUIDED` (`Lab.requiresLabId`).
- La validación del flag es **siempre server-side** (comparación de hash), con rate-limit en Redis.

El esquema ejecutable está en [`prisma/schema.prisma`](../prisma/schema.prisma).

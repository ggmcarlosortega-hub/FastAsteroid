# Backend legado — Next.js + Prisma + SQLite

> **Esta carpeta NO forma parte del proyecto Fasteroid actualmente activo.** Es el
> backend original, archivado completo el 2026-08-23 al migrar a **Express + MySQL**
> (ver [`server/`](../server/) en la raíz del repo). Se conserva por dos razones:
> tener una base a la que volver si algo falla en el backend nuevo, y servir de
> referencia para comparar ambas arquitecturas.

## Qué es esto

Hasta esta migración, Fasteroid usaba las rutas de API de **Next.js App Router**
(`app/api/**`) con **Prisma ORM** sobre una base **SQLite** (`dev.db`, un archivo
local). Esta carpeta contiene una copia completa y funcional de esa versión, con la
misma estructura relativa que tenía dentro de `Fasteroid/`:

```text
backend-legado-nextjs-prisma-sqlite/
├── app/api/              → las 11 rutas de API (auth, clientes, domicilios, ubicaciones, domiciliarios)
├── lib/
│   ├── auth.js             → sesión JWT (jose) + cookie httpOnly
│   ├── prisma.js           → cliente de Prisma (singleton, adapter better-sqlite3)
│   └── service-error.js    → ServiceError / toErrorResponse
├── modules/
│   ├── clientes/logic/clientes.service.js      → reglas de negocio de Clientes (Prisma)
│   └── domicilios/logic/domicilios.service.js  → reglas de negocio de Domicilios (Prisma)
├── prisma/
│   ├── schema.prisma        → modelo de datos original
│   ├── migrations/           → las 6 migraciones aplicadas en su momento
│   └── seed.js                → datos de prueba (mismos usuarios/clientes que el seed nuevo)
├── prisma.config.ts
├── proxy.js                 → middleware de Next.js: guardaba sesión + rol para /admin, /domiciliario y /api/*
├── dev.db                   → la base SQLite real, con todo el historial de pruebas de las sesiones anteriores
├── .env / .env.example
└── README.md                 → este archivo
```

Los hooks de cliente (`useClientesList.js`, `useDomiciliosActivos.js`, etc.),
`haversine.js` y `geolocation.js` **no** están acá — esos son código de frontend
puro, sin nada de Prisma, y se quedaron en `Fasteroid/` porque el frontend nuevo
los sigue usando tal cual.

## Por qué se migró

El usuario pidió reemplazar Prisma/SQLite por Express + MySQL con SQL crudo (sin
ORM), por dos razones: no tener claro cómo funciona Prisma por dentro, y necesitar
poder explicar con precisión qué pasa cuando algo falla (pool de conexiones, caída
de la base de datos, condiciones de carrera) — con SQL escrito a mano en vez de un
ORM, ese manejo de errores queda completamente visible. El detalle completo del
plan de migración, las reglas de traducción del modelo de datos, y la sección de
escalabilidad/manejo de fallos están en [`aplicativos.md`](../aplicativos.md), en
la raíz del repo.

## Cómo restaurar esta versión (rollback)

Si el backend nuevo (`server/` + MySQL) falla de forma irrecuperable y hace falta
volver a esta versión:

1. **Mover el código de vuelta a `Fasteroid/`:**
   ```bash
   cp -r backend-legado-nextjs-prisma-sqlite/app/api Fasteroid/app/api
   cp backend-legado-nextjs-prisma-sqlite/lib/{auth,prisma,service-error}.js Fasteroid/lib/
   cp backend-legado-nextjs-prisma-sqlite/modules/clientes/logic/clientes.service.js Fasteroid/modules/clientes/logic/
   cp backend-legado-nextjs-prisma-sqlite/modules/domicilios/logic/domicilios.service.js Fasteroid/modules/domicilios/logic/
   cp -r backend-legado-nextjs-prisma-sqlite/prisma Fasteroid/prisma
   cp backend-legado-nextjs-prisma-sqlite/prisma.config.ts Fasteroid/
   cp backend-legado-nextjs-prisma-sqlite/dev.db Fasteroid/
   cp backend-legado-nextjs-prisma-sqlite/proxy.js Fasteroid/
   cp backend-legado-nextjs-prisma-sqlite/.env Fasteroid/
   ```
2. **Reinstalar las dependencias que se quitaron de `Fasteroid/package.json`:**
   ```bash
   cd Fasteroid
   npm install @prisma/client @prisma/adapter-better-sqlite3 better-sqlite3 bcryptjs jose
   npm install -D prisma dotenv
   npx prisma generate
   ```
3. **Quitar el rewrite** en `Fasteroid/next.config.mjs` (el bloque `rewrites()` que
   manda `/api/**` a Express) — con las rutas de `app/api/` de vuelta, Next.js las
   sirve directo, no necesita reenviar a ningún lado.
4. **Revertir los layouts** `app/admin/layout.js` y `app/domiciliario/layout.js` a
   server components con `getSession()` (o dejarlos como quedaron, ya que también
   funcionan como client component contra `/api/auth/me` — solo que ahora esa ruta
   la serviría el propio Next.js en vez de Express).
5. Apagar (o simplemente ignorar) el proceso de `server/` — ya no hace falta.

El `dev.db` incluido tiene todo el historial real de pruebas hasta el momento de la
migración (2026-08-23), no está vacío.

## Preguntas frecuentes / comparación con el backend nuevo

**¿Por qué Prisma generaba código y esto no?**
Prisma es un ORM: a partir de `schema.prisma` genera un cliente TypeScript/JS
(`@prisma/client`) con métodos como `prisma.domicilio.create(...)` que internamente
arman el SQL. El backend nuevo (`server/`) no genera nada — cada función de
servicio escribe el `SELECT`/`INSERT`/`UPDATE` a mano con `mysql2`.

**¿Por qué SQLite acá y MySQL en el nuevo?**
SQLite es un archivo local (`dev.db`), sin servidor — cómodo para desarrollar solo,
pero no es lo que se usa en un entorno con más de un proceso escribiendo a la vez.
MySQL corre como un servicio real (server/proceso aparte), con su propio manejo de
conexiones concurrentes — más representativo de cómo se despliega un backend real.

**¿Las reglas de negocio son las mismas en los dos?**
Sí, exactamente las mismas (cupos de domicilios, un espacio de baúl por
domiciliario, motivo obligatorio al cancelar, etc.). Lo que cambia es *cómo* se
garantizan a nivel de base de datos: acá con `CHECK` e índices únicos de SQLite;
en MySQL con `CHECK`, `ENUM` nativos, y una columna generada (`espacio_activo`)
porque MySQL no soporta índices únicos parciales como SQLite — el porqué exacto
está documentado en `server/db/schema.sql` y en `aplicativos.md`.

**¿La sesión funciona igual?**
Sí — mismo esquema (JWT firmado con `jose`, cookie `httpOnly` llamada
`fasteroid_session`, mismo `AUTH_SECRET`). Antes la validaba `proxy.js` (middleware
de Next.js) en cada request; ahora la valida Express (`server/lib/middleware/requireAuth.js`)
antes de llegar a cada ruta.

**¿Por qué no se borró directamente?**
Para poder volver atrás sin depender de reconstruir nada desde el historial de
git, y para tener ambas versiones completas a mano al momento de explicar o
justificar la decisión de arquitectura.

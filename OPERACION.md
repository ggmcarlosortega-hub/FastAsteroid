# Operación de Fasteroid — guía práctica del día a día

> Este documento es distinto de `proyecto-unificado.md` (que describe QUÉ hace la
> app y por qué). Acá está el CÓMO: los comandos exactos para prender todo,
> conectar el celular, y administrar quién puede entrar como domiciliario o Admin.

## 1. Qué tiene que estar corriendo

Fasteroid son **tres piezas independientes**, las tres tienen que estar
corriendo al mismo tiempo:

| Pieza | Dónde | Puerto | Para qué |
|---|---|---|---|
| MySQL | Servicio de Windows (`MySQL80`) | 3306 | Guarda todos los datos |
| Servidor (Express) | carpeta `server/` | 4000 | Toda la lógica de negocio y la sesión |
| Frontend (Next.js) | carpeta `Fasteroid/` | 3000 | Lo que se ve en el navegador/celular |

El servidor también abre un puerto extra, **4443**, solo para las
actualizaciones en tiempo real (WebSocket) — el navegador se conecta ahí
directo cuando el frontend es HTTPS, para que Admin y domiciliarios vean los
cambios de los demás sin recargar la página. Usa los mismos certificados que
el frontend (`Fasteroid/certificates/`), así que no hace falta ningún paso
extra al regenerarlos por cambio de IP (sección de abajo). Si el celular está
en la misma red Wi-Fi que ya usa para el puerto 3000, no necesita nada
especial — el firewall de Windows suele preguntar la primera vez que el
servidor abre ese puerto, hay que permitirlo en redes privadas.

MySQL normalmente ya está corriendo solo (arranca con Windows). Si algo falla
con la base de datos, confirmá que el servicio esté activo:

```powershell
Get-Service MySQL80
```

Si dice `Stopped`, iniciálo (necesita una terminal como Administrador):

```powershell
Start-Service MySQL80
```

## 2. Arrancar todo para probar SOLO en esta PC (sin celular)

Dos terminales abiertas al mismo tiempo, una para cada pieza:

**Terminal 1 — servidor:**
```bash
cd server
npm run dev
```

**Terminal 2 — frontend:**
```bash
cd Fasteroid
npm run dev
```

Con esto ya se puede entrar desde el navegador de la PC a `http://localhost:3000`.
Esta forma NO sirve para probar desde el celular (ver sección 3).

## 3. Arrancar todo para probar desde el CELULAR

La única diferencia es el frontend: hay que levantarlo con HTTPS (el celular
necesita un origen seguro para poder usar la cámara/GPS).

**Terminal 1 — servidor (igual que antes):**
```bash
cd server
npm run dev
```

**Terminal 2 — frontend, con HTTPS:**
```bash
cd Fasteroid
npm run dev:https
```

Al final va a mostrar algo como:
```
- Network:       https://192.168.1.58:3000
```

**En el celular** (conectado a la MISMA red Wi-Fi que la PC):

1. Abrí esa dirección `https://<IP-que-muestre-la-terminal>:3000` en Chrome.
2. Va a salir una advertencia de "conexión no privada" (el certificado es
   autofirmado, no de una autoridad reconocida) — es normal y esperado. Tocá
   **Avanzado** → **Continuar a `<IP>` (no seguro)**. Se hace una sola vez por
   celular (mientras no cambie la IP).
3. Ya podés iniciar sesión y usar todo: cámara, GPS, escaneo de comanda.

### Si cambia la IP de la PC (cambiaste de red Wi-Fi, se reinició el router, etc.)

El certificado HTTPS y la configuración están hechos para una IP específica.
Si `npm run dev:https` muestra una IP distinta a la de la última vez, hay que
actualizar dos archivos:

1. **`Fasteroid/next.config.mjs`** — cambiar la IP vieja por la nueva dentro de
   `allowedDevOrigins`.
2. **Regenerar el certificado** (reemplazá `<NUEVA_IP>` por la que te muestre
   la terminal):
   ```bash
   cd Fasteroid
   "C:\Users\ggmca\AppData\Local\mkcert\mkcert-v1.4.4-windows-amd64.exe" -key-file ./certificates/localhost-key.pem -cert-file ./certificates/localhost.pem localhost 127.0.0.1 <NUEVA_IP> ::1
   ```

Después, reiniciá `npm run dev:https`.

## 4. Apagar todo

`Ctrl+C` en cada una de las dos terminales. MySQL se puede dejar corriendo
siempre (no hace falta apagarlo).

## 5. Crear un nuevo domiciliario (o un nuevo Admin)

Hoy no existe un botón en la app para esto — hay que hacerlo por terminal,
editando un archivo y corriendo un comando. Es rápido:

1. Abrí **`server/db/seed.js`**.
2. Buscá la lista `USUARIOS_DEMO` (arriba del archivo) y agregá una línea con
   los datos del nuevo trabajador — el `telefono` es su usuario para iniciar
   sesión, tiene que ser único, no puede repetirse con otro trabajador:

   ```js
   const USUARIOS_DEMO = [
     { telefono: "3000000000", nombre: "Admin Demo", password: "admin123", rol: "Admin" },
     { telefono: "3000000001", nombre: "Domiciliario Demo", password: "domi123", rol: "Domiciliario" },
     // agregá la línea nueva acá, por ejemplo:
     { telefono: "3101234567", nombre: "Pedro Ramírez", password: "unaClaveSegura123", rol: "Domiciliario" },
   ];
   ```

   `rol` solo puede ser `"Domiciliario"` o `"Admin"` (mayúscula inicial, tal cual).

3. Guardá el archivo y corré, desde la carpeta `server/`:
   ```bash
   cd server
   npm run db:seed
   ```

   Este comando es seguro de correr las veces que quieras: a los usuarios que
   ya existen no los toca (no borra ni cambia su contraseña), solo agrega los
   que sean nuevos.

4. Avisale al trabajador su teléfono y contraseña — ya puede entrar en
   `/login` con eso.

**Nota:** este mecanismo (`seed.js`) fue pensado originalmente para datos de
prueba, así que usarlo para altas reales es un poco artesanal. Si el número de
domiciliarios crece o esto se vuelve algo frecuente, vale la pena construir una
pantalla real en el panel de Admin para dar de alta/baja trabajadores sin tocar
código ni la terminal — es un trabajo aparte, avisame cuando lo quieras.

## 6. Desplegar en producción (Vercel + backend aparte)

Vercel solo ejecuta funciones serverless — no puede alojar el servidor Express
tal como está (necesita un proceso persistente para Socket.IO y el pool de
MySQL). La forma real de ponerlo en línea gratis es **partido en 3 piezas**:

| Pieza | Dónde | Notas |
|---|---|---|
| Frontend (Next.js) | Vercel | Encaja directo, sin cambios de arquitectura |
| Servidor (Express) | Render, Railway o Fly.io | Necesita un host que sostenga un proceso persistente (Socket.IO) |
| MySQL | Aiven, Railway, etc. | Tiene que ser alcanzable desde internet, no `localhost` |

El código ya está preparado para esto por variables de entorno — no hace falta
tocar nada más al desplegar, solo configurarlas:

**En el backend** (Render/Railway/etc.), además de las que ya tiene `server/.env`
(`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `AUTH_SECRET`):
- `NODE_ENV=production` — activa `secure` y `sameSite: "none"` en la cookie de
  sesión (`server/lib/auth.js`), necesario porque frontend y backend van a
  quedar en dominios distintos.

**En Vercel** (proyecto del frontend):
- `API_URL` = URL pública del backend (ej. `https://fasteroid-api.onrender.com`)
  — el rewrite de `/api/**` en `next.config.mjs` ya lo usa, sin cambios de código.
- `NEXT_PUBLIC_WS_URL` = la misma URL pública del backend — el navegador se
  conecta ahí directo para el tiempo real (`Fasteroid/lib/socket.js`), porque ya
  no se puede adivinar la URL a partir del dominio de la página (antes asumía
  que front y back compartían dominio, solo con puertos distintos).

**Nota sobre el host gratuito del backend:** las capas gratuitas de Render (y
similares) "duermen" el servicio tras un rato sin tráfico y tardan unos
segundos en despertar con la primera petición — para el negocio esto se nota
como una demora rara en el primer pedido después de un rato sin uso, no es un
error. Si eso molesta, la alternativa es un plan pago (barato) que no duerma.

### Backend en Fly.io, paso a paso

`server/Dockerfile` ya está listo (probado localmente con `docker build` +
`docker run` antes de escribir esto) — arranca en HTTP plano automáticamente
cuando no encuentra los certificados mkcert de desarrollo (no van a existir en
Fly), que es exactamente lo que hace falta: Fly termina el HTTPS en su borde y
reenvía HTTP plano hacia adentro.

1. Instalar el CLI (PowerShell):
   ```powershell
   iwr https://fly.io/install.ps1 -useb | iex
   ```
2. Iniciar sesión (abre el navegador, crea la cuenta si no existe):
   ```bash
   fly auth login
   ```
3. Desde la carpeta `server/`:
   ```bash
   cd server
   fly launch
   ```
   Va a detectar el `Dockerfile` solo. Durante las preguntas:
   - Nombre de la app: el que quieras (define la URL: `https://<nombre>.fly.dev`).
   - Región: la más cercana (`bog` si aparece Bogotá, si no `mia`/Miami).
   - **Si pregunta por agregar una base de datos Postgres/Redis: decir que NO**
     — la app usa MySQL externo (Aiven/Railway/etc.), no lo que ofrece Fly.
   - Al final pregunta si desplegar ya — se puede decir que sí, o correr
     `fly deploy` después a mano.
4. Configurar las variables sensibles como *secrets* (no van en ningún archivo
   del repo):
   ```bash
   fly secrets set NODE_ENV=production
   fly secrets set AUTH_SECRET="el-mismo-valor-de-tu-.env-local"
   fly secrets set DB_HOST=... DB_PORT=3306 DB_USER=... DB_PASSWORD=... DB_NAME=fasteroid
   ```
   (`DB_HOST`/`DB_USER`/etc. son los de tu MySQL alcanzable desde internet —
   sección de arriba — todavía hay que tenerlo creado en Aiven/Railway/etc.
   antes de este paso, y correr `server/db/schema.sql` contra esa base para
   crear las tablas.)
5. `fly deploy` deja la app corriendo en `https://<nombre>.fly.dev` — esa URL
   es el valor de `API_URL` y `NEXT_PUBLIC_WS_URL` en Vercel (sección de
   arriba).

### Cómo diferencia la app a los trabajadores

- Cada trabajador se identifica de forma única por su **número de teléfono**
  (es su usuario de login — no puede haber dos personas con el mismo número).
- El **nombre** es solo para mostrar en pantallas (quién recogió tal domicilio,
  a quién se le asigna uno nuevo, etc.) — se puede repetir sin problema.
- El **rol** (`Domiciliario` o `Admin`) define qué puede ver y hacer cada uno:
  un Domiciliario solo ve y gestiona sus propios domicilios; el Admin ve y
  asigna los de todos.

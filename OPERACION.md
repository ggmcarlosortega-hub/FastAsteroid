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

### Cómo diferencia la app a los trabajadores

- Cada trabajador se identifica de forma única por su **número de teléfono**
  (es su usuario de login — no puede haber dos personas con el mismo número).
- El **nombre** es solo para mostrar en pantallas (quién recogió tal domicilio,
  a quién se le asigna uno nuevo, etc.) — se puede repetir sin problema.
- El **rol** (`Domiciliario` o `Admin`) define qué puede ver y hacer cada uno:
  un Domiciliario solo ve y gestiona sus propios domicilios; el Admin ve y
  asigna los de todos.

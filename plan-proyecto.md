# Fasteroid — Plan de Proyecto

> Sistema de gestión de domicilios para negocio de reparto en Carepa (moto propia, un domiciliario).
> Nombre de trabajo confirmado por la carpeta ya creada en el repo: **Fasteroid** (Fast + Asteroid).

## 1. Contexto y problema a resolver

Hoy el seguimiento de domicilios, kilómetros recorridos, mantenimiento de la moto y clientes frecuentes
se hace de forma manual o no se hace en absoluto. Esto impide saber con certeza:

- Cuánto se factura y cómo se cobra (efectivo vs. transferencia).
- Cuánto cuesta operar la moto (gasolina, taller, compras) frente a lo que se factura.
- Quiénes son los clientes recurrentes y dónde quedan ubicados, para reducir tiempos de entrega.

El objetivo del proyecto es una aplicación (dashboard web + captura desde el celular del domiciliario)
que registre esta operación y la convierta en información accionable.

## 2. Objetivos

**Objetivo general:** construir una herramienta que centralice el registro de domicilios, clientes,
ubicaciones y mantenimiento del vehículo, y que presente esa información en un panel administrativo.

**Objetivos específicos:**

1. Registrar cada domicilio con su cliente, ubicación, estado, forma de pago y distancia recorrida.
2. Registrar cada evento de mantenimiento del vehículo (tanqueo, taller, compras) y su costo.
3. Asociar clientes por número de teléfono y permitirles múltiples ubicaciones.
4. Mostrar un dashboard con métricas mensuales: domicilios realizados, km recorridos, tanqueos,
   cliente más frecuente.
5. (Fase posterior) Automatizar la captura de datos desde una comanda física mediante la cámara.

## 3. Qué cambió respecto al planteamiento original

El documento original (`proyecto-1.txt`) describe todo el sistema como un solo bloque: dashboard,
geolocalización en tiempo real, integración con Google Maps, escaneo OCR de comandas y flujo de entrega
con fotos por compartimento del baúl. Construir todo eso a la vez antes de tener nada operando es el
principal riesgo del proyecto. Los ajustes que hice:

- **Fasear el alcance.** Lo que es un CRUD con reportes (dashboard, clientes, domicilios, mantenimiento)
  va en el MVP. Lo que depende de APIs externas o de precisión de hardware (Google Maps, OCR de
  comandas, cámara en tiempo real) se separa en fases posteriores, porque son las partes con más
  incertidumbre técnica y no bloquean el valor principal (saber qué se entregó, a quién y cuánto costó).
- **Roles confirmados.** Cuentas separadas desde el MVP: login distinto para domiciliario y para
  administrador, con permisos diferenciados (ver sección 5). Además confirmaste que a futuro podría
  haber más de un domiciliario/moto, así que el modelo de datos incluye desde ya quién entregó cada
  domicilio (ver sección 7), en vez de agregarlo después.
- **Reglas de negocio confirmadas.** "Cliente más visitado" se calcula sobre el mes en curso. Los
  kilómetros recorridos por domicilio se estiman con la geolocalización del celular en tiempo real
  (sin usar una API de pago) — ver el enfoque técnico en la sección 6.3.
- **Añadir lo que faltaba y no es opcional:** autenticación/roles, protección de datos personales
  (el sistema guarda teléfonos y ubicaciones de clientes — aplica la Ley 1581 de Habeas Data en
  Colombia), y comportamiento sin conexión (un domiciliario en zonas de mala señal no puede depender
  de estar siempre en línea para marcar una entrega).
- **Revisar el modelo de datos existente** (`databases.plantuml`), que ya está bastante alineado con
  el texto. Ver sección 7 para los ajustes puntuales sugeridos.

## 4. Alcance por fases

### Fase 1 — MVP operativo (con geolocalización gratuita, sin OCR ni APIs de pago)
Registro completo + dashboard + kilómetros por GPS del celular (sin pagar ninguna API). Es el núcleo
que ya genera valor: saber qué se entregó, a quién, cómo se cobró y qué costó mantener la moto.

- Autenticación con cuentas separadas: rol domiciliario y rol administrador, cada uno con su login.
- CRUD de clientes (teléfono como identificador) y sus ubicaciones (alias + lat/long).
- Registro de domicilios: cliente, ubicación destino, domiciliario asignado, estado (en curso/entregado/
  cancelado), método de pago, valor cobrado.
- **Kilómetros recorridos por geolocalización del celular:** mientras el domicilio está "en curso", la
  app toma la ubicación del celular a intervalos (`navigator.geolocation.watchPosition`, gratis, sin
  API de terceros) y suma la distancia entre puntos consecutivos (fórmula de Haversine) hasta marcar
  "entregado". Esto da un recorrido real aproximado, no solo la distancia en línea recta entre origen y
  destino. Ver limitación técnica en la sección 9.
- Foto del pedido tomada en el momento de cargarlo al baúl (antes de salir a entregar), asociada al
  domicilio.
- Registro de mantenimiento: tanqueo, taller, compra adicional, con kilometraje y costo.
- Dashboard con los 4 indicadores mensuales (domicilios, km, tanqueos, cliente top del mes en curso) +
  los desgloses por día/semana/mes.

### Fase 2 — Escaneo de comandas (OCR)
- Captura de foto de la comanda física y extracción de teléfono/dirección/productos.
- Prellenado automático del formulario de domicilio con esos datos, editable antes de confirmar.
- Marcado del espacio del baúl (1/2/3) asignado.

### Fase 3 — Analítica avanzada (opcional, según necesidad real del negocio)
- Comparativo de rentabilidad por domicilio (cobrado vs. costo de gasolina/mantenimiento prorrateado).
- Alertas de mantenimiento preventivo por kilometraje.
- Exportes/reportes descargables.

> Nota: las fases no tienen que ser secuenciales estrictas si hay tiempo para paralelizar, pero **Fase 1
> debe cerrarse primero** porque todo lo demás depende de su modelo de datos y flujo de registro.

## 5. Roles de usuario

Confirmado: cuentas separadas desde el MVP. La asignación de domicilios **no** es un flujo en tiempo
real dentro del panel — es un proceso físico e independiente: el domiciliario recibe pedidos y decide
cuántos lleva en cada salida (limitado por los 3 espacios del baúl), y es él quien los registra en la
app. El administrador define la cantidad/meta de domicilios para el domiciliario, pero no asigna uno
por uno desde la pantalla.

| Rol | Dispositivo | Qué hace |
|---|---|---|
| Domiciliario | Celular | Registra sus propios domicilios (cliente, ubicación, productos) según la carga que lleva en el vehículo, marca entregas/cancelaciones, registra mantenimiento, escanea comandas (Fase 2) |
| Administrador/Dueño | Web (dashboard) | Define la cantidad/meta de domicilios para el domiciliario, consulta métricas e histórico de todos, gestiona clientes |


## 6. Módulos funcionales

### 6.1 Dashboard administrativo
- Resumen mensual: total de domicilios, km recorridos, veces tanqueado, cliente con más visitas.
- Desglose de domicilios por día/semana/mes, separando efectivo vs. transferencia.
- Desglose de km recorridos por cliente, ordenado por distancia y frecuencia.
- Desglose de mantenimiento: tanqueos, kilómetros por tanque, visitas a taller, compras adicionales.
- Ranking de clientes por número de pedidos (semanal/mensual).

### 6.2 Gestión de clientes y ubicaciones
- Alta de cliente por número de teléfono (identificador único).
- Un cliente puede tener múltiples ubicaciones guardadas (alias + coordenadas).
- Al repetir un pedido, se elige entre las ubicaciones ya guardadas o se agrega una nueva.

### 6.3 Gestión de domicilios
- Crear domicilio (lo hace el domiciliario): cliente, ubicación, productos, espacio de baúl asignado
  (máximo 3 domicilios simultáneos por carga, uno por espacio).
- Foto del pedido al momento de cargarlo al baúl, antes de salir a entregar.
- Al crear el domicilio empieza el tracking de ubicación en segundo plano (ver sección 4, Fase 1) hasta
  que se marque como entregado o cancelado.
- Marcar como entregado: detiene el tracking, calcula la distancia recorrida y asocia el pago recibido.
- Marcar como cancelado, con motivo.
- Historial completo por cliente y por domiciliario.

### 6.4 Mantenimiento del vehículo
- Registrar tanqueo: galones, costo, kilometraje actual.
- Registrar visita a taller: descripción, costo.
- Registrar compra adicional: descripción, costo.
- Cálculo de rendimiento (km recorridos por galón) usando kilometraje entre tanqueos.

### 6.5 Escaneo de comandas (Fase 2)
- Captura de foto (en vivo o desde galería).
- Extracción de teléfono, dirección y productos vía OCR.
- Acción rápida de llamada al número extraído.
- Prellenado del formulario de domicilio, con revisión manual antes de guardar.

## 7. Modelo de datos

Ya existe un modelo en [`databases.plantuml`](databases.plantuml) con `Cliente`, `Ubicacion`,
`Domicilio` y `Registro_Mantenimiento`, coherente con el planteamiento. Ajustes sugeridos:

1. **`EspacioBaul` no debería ser un enum de valores `1, 2, 3`.** Un enum representa categorías con
   nombre (como `MetodoPago`), no un rango numérico. Modelarlo como `INT` con un `CHECK (espacio_baul
   BETWEEN 1 AND 3)` es más simple y evita tener que declarar "1", "2", "3" como si fueran etiquetas.
2. **Se agrega la entidad `Usuario`** (rol `Admin` / `Domiciliario`) desde el MVP — ya no se difiere,
   porque confirmaste cuentas separadas y la posibilidad de más de un domiciliario a futuro.
3. **`Domicilio` se relaciona con `Usuario`** mediante `telefono_domiciliario` (FK), quien lo registró y
   lo entrega. Esto es lo que permite que cada domiciliario vea solo lo suyo y que el administrador vea
   el total.
4. **`foto_productos_url` en `Domicilio` se mantiene como una sola foto**, tomada en el momento de cargar
   el pedido al baúl (no al entregar). Confirmaste que el propósito es dejar evidencia de qué productos
   se cargaron, no una foto por compartimento — así que no hace falta la tabla `Foto_Producto` que había
   sugerido antes.
5. **La entidad `Comanda`** (Fase 2) no está modelada todavía — cuando llegue esa fase, se agrega como
   tabla con los campos extraídos por OCR y una relación 1:1 con `Domicilio`.

Los puntos 1 a 3 ya están reflejados en la versión actualizada de [`databases.plantuml`](databases.plantuml)
(ver sección 13). El punto 5 queda pendiente para cuando se construya la Fase 2.

## 8. Requisitos no funcionales

- **Protección de datos personales:** el sistema almacena teléfonos y ubicaciones de clientes reales.
  En Colombia esto cae bajo la Ley 1581 de 2012 (Habeas Data) — como mínimo, informar para qué se usan
  los datos y no compartirlos con terceros sin autorización.
- **Modo sin conexión:** un domiciliario en una zona sin señal debe poder marcar "entregado" y que se
  sincronice cuando vuelva a haber datos, en vez de perder el registro.
- **Consistencia del kilometraje:** el kilometraje registrado en mantenimiento y el distancia_km por
  domicilio deben ser conciliables (la suma de distancias no debería divergir demasiado del odómetro).
- **Seguridad de acceso:** solo el domiciliario y el administrador acceden a los datos; no hay
  registro público.
- **Permisos por rol:** un domiciliario solo puede ver y operar los domicilios que él mismo registró;
  el administrador ve el total de todos los domiciliarios. Esto se aplica desde el MVP, no se difiere.
- **Tracking en segundo plano:** el cálculo de kilómetros depende de que el navegador pueda seguir
  reportando ubicación mientras el domicilio está en curso. Ver la limitación técnica en la sección 9.

## 9. Decisiones registradas y riesgo técnico a vigilar

Todas las preguntas abiertas de la versión anterior quedaron resueltas:

| Pregunta | Decisión |
|---|---|
| Fuente del kilometraje | GPS del celular en tiempo real (`watchPosition` + Haversine), sin API de pago |
| Ventana de "cliente más visitado" | Mes en curso |
| ¿Más de un domiciliario a futuro? | Sí — el modelo soporta varios desde el MVP |
| Foto de productos | Una foto al momento de cargar el pedido al baúl, no una por compartimento |
| API de rutas de Google Maps | No se usa; solo geolocalización gratuita del navegador |
| Roles | Cuentas separadas desde el MVP |
| Asignación de domicilios | El domiciliario decide y registra cuántos lleva por carga (máx. 3); el admin solo define la meta/cantidad, no asigna uno por uno |

**Riesgo técnico a vigilar:** los navegadores móviles limitan o detienen `watchPosition` cuando la
pestaña pasa a segundo plano o la pantalla se bloquea, lo que puede cortar el tracking de un domicilio
a mitad de camino. Mitigación para el MVP: instalar la PWA en la pantalla de inicio (mejora la prioridad
del proceso en segundo plano en Android) y mantener la pantalla activa durante el recorrido. Si en la
práctica el corte de tracking es frecuente, la alternativa de respaldo es capturar solo origen y destino
(una lectura al crear el domicilio y otra al entregar) y aceptar que la distancia sea una aproximación
en línea recta en vez de un recorrido real — se decide con datos reales una vez esté en uso, no antes.

## 10. Stack técnico (según lo ya iniciado en el repo)

El repo ya tiene una carpeta `Fasteroid/` con un componente `page.js` de **Next.js**, así que el
dashboard administrativo se construye ahí. Para la app de captura del domiciliario (cámara, GPS), la
opción más simple es que sea el mismo Next.js como **PWA** (funciona en el navegador del celular, evita
mantener una app nativa aparte); si más adelante se necesita OCR en tiempo real o acceso más profundo a
la cámara, se puede reevaluar una app nativa o híbrida solo para esa parte.

## 11. Métricas de éxito

- El domiciliario registra el 100% de los domicilios del día sin depender de anotaciones en papel.
- El dashboard refleja los datos del mes sin necesidad de cálculos manuales.
- Se puede responder "¿cuánto costó operar la moto este mes vs. cuánto se facturó?" en un solo vistazo.

## 12. Próximos pasos inmediatos

1. ~~Responder las preguntas abiertas de la sección 9~~ — resuelto, ver tabla de decisiones.
2. ~~Ajustar `databases.plantuml` con los cambios de la sección 7~~ — hecho, ver sección 13.
3. Definir el flujo de autenticación (login por teléfono + contraseña/PIN es lo más simple, dado que
   `Cliente` y ahora `Usuario` ya usan teléfono como identificador natural).
4. Construir el MVP de Fase 1 en Next.js siguiendo el orden de dependencias del backlog (sección 14).

## 13. Modelo de datos actualizado

Cambios aplicados a [`databases.plantuml`](databases.plantuml):

- Nueva entidad `Usuario` (teléfono como PK, rol `Admin`/`Domiciliario`).
- `Domicilio` ahora tiene `telefono_domiciliario` (FK a `Usuario`) y `EspacioBaul` pasó de enum a
  `INT` con comentario de rango 1–3.
- Relación `usuario ||--o{ domicilio : "registra/entrega"`.

## 14. Backlog de Fase 1 (MVP) — orden de construcción

Cada bloque depende del anterior porque comparte modelo de datos o pantallas. Dentro de cada bloque, las
tareas están en el orden en que tiene sentido construirlas.

**Bloque 0 — Base del proyecto**
1. Definir esquema de base de datos real (a partir de `databases.plantuml`) y conectar Next.js a ella.
2. Autenticación: login por teléfono + contraseña/PIN, sesión separada por rol (`Admin` /
   `Domiciliario`), y guard de rutas según rol.

**Bloque 1 — Clientes y ubicaciones**
3. CRUD de `Cliente` (alta por teléfono).
4. CRUD de `Ubicacion` asociada a un cliente (alias + lat/long), con opción de agregar varias.

**Bloque 2 — Domicilios (núcleo del negocio)**
5. Formulario de creación de domicilio (solo visible/usable por el domiciliario logueado): cliente,
   ubicación, productos, espacio de baúl (máx. 3 simultáneos).
6. Captura de foto al cargar el pedido al baúl.
7. Tracking de ubicación en segundo plano mientras el domicilio está "en curso" + cálculo de distancia
   (Haversine sobre los puntos capturados).
8. Marcar como entregado (detiene tracking, registra método de pago y valor cobrado) / marcar como
   cancelado (con motivo).
9. Listado/historial de domicilios por domiciliario y por cliente.

**Bloque 3 — Mantenimiento del vehículo**
10. Formulario de registro de mantenimiento (tanqueo / taller / compra adicional) con kilometraje y
    costo.
11. Cálculo de rendimiento (km recorridos por galón) entre tanqueos consecutivos.

**Bloque 4 — Dashboard administrativo**
12. Resumen mensual: domicilios, km, tanqueos, cliente top del mes (solo visible para `Admin`).
13. Desgloses: domicilios por día/semana/mes (efectivo vs. transferencia), km por cliente, detalle de
    mantenimiento, ranking de clientes.

Con esto, el Bloque 2 es el que primero entrega valor real de negocio (ya se puede operar y medir);
los bloques 3 y 4 dependen de que existan datos de domicilios y mantenimiento para tener algo que
mostrar.
</content>

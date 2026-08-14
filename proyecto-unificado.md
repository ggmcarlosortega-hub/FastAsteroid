# Fasteroid — Proyecto de gestión de domicilios en Carepa

> **Nombre del proyecto:** Fasteroid (Fast + Asteroid) — confirmado por la carpeta ya creada en el repo.
> **Ubicación:** Carepa, Antioquia.
> **Tipo de sistema:** Gestión y administración de domicilios mediante aplicación web (dashboard) +
> captura desde el celular del domiciliario (PWA).

> Este documento unifica los dos documentos que existían por separado — [`proyect.md`](proyect.md)
> (la idea completa, módulo por módulo, tal como se planteó originalmente) y
> [`plan-proyecto.md`](plan-proyecto.md) (el plan que fasea esa idea y añade las decisiones, el modelo
> de datos y el backlog) — en un solo lugar, sin perder nada de contexto. `proyecto-1.txt` (el texto
> libre original) y los dos documentos anteriores se conservan en la carpeta como referencia histórica;
> **este archivo es ahora la única fuente de verdad del proyecto.**

---

## 1. Descripción general

El proyecto consiste en desarrollar un sistema para la gestión, seguimiento y control de domicilios
realizados en Carepa por un negocio de reparto que hoy opera con una sola moto y un domiciliario (con
posibilidad de crecer a más adelante).

Hoy ese seguimiento —domicilios, kilómetros recorridos, mantenimiento de la moto, clientes frecuentes—
se hace de forma manual o no se hace en absoluto. Esto impide saber con certeza cuánto se factura y cómo
se cobra (efectivo vs. transferencia), cuánto cuesta operar la moto (gasolina, taller, compras) frente a
lo que se factura, y quiénes son los clientes recurrentes y dónde quedan ubicados para reducir tiempos
de entrega.

El sistema permitirá registrar clientes, pedidos, ubicaciones, recorridos, pagos, entregas,
abastecimiento de combustible y mantenimiento del vehículo utilizado para realizar los domicilios. La
aplicación contará con un **dashboard administrativo** que permitirá visualizar de manera resumida la
información más importante del negocio y acceder al detalle de cada operación.

Uno de los objetivos principales será reducir el tiempo empleado en cada domicilio mediante el
almacenamiento de información de clientes, ubicaciones frecuentes, pedidos anteriores y rutas
utilizadas.

## 2. Objetivos del proyecto

**Objetivo general:** construir una herramienta que centralice el registro de domicilios, clientes,
ubicaciones y mantenimiento del vehículo, y que presente esa información en un panel administrativo.

**Objetivos específicos:**

1. Registrar cada domicilio con su cliente, ubicación, estado, forma de pago y distancia recorrida.
2. Registrar cada evento de mantenimiento del vehículo (tanqueo, taller, compras) y su costo.
3. Asociar clientes por número de teléfono y permitirles múltiples ubicaciones.
4. Mostrar un dashboard con métricas mensuales: domicilios realizados, km recorridos, tanqueos,
   cliente más frecuente.
5. Reducir el tiempo empleado en cada domicilio reutilizando datos de clientes y ubicaciones ya
   registrados.
6. (Fase posterior) Automatizar la captura de datos desde una comanda física mediante la cámara.
7. Generar información histórica que permita tomar decisiones basadas en datos sobre el negocio.

## 3. Fases de desarrollo y alcance

El planteamiento original describe todo el sistema como un solo bloque: dashboard, geolocalización en
tiempo real, integración con Google Maps, escaneo OCR de comandas y flujo de entrega con fotos por
compartimento del baúl. Construir todo eso a la vez antes de tener nada operando es el principal riesgo
del proyecto, así que el alcance se faseó:

### Fase 1 — MVP operativo (geolocalización gratuita, sin OCR ni APIs de pago)
Es el núcleo que ya genera valor: saber qué se entregó, a quién, cómo se cobró y qué costó mantener la
moto.

- Autenticación con cuentas separadas: rol domiciliario y rol administrador, cada uno con su login.
- CRUD de clientes (teléfono como identificador) y sus ubicaciones (alias + lat/long).
- Registro de domicilios: cliente, ubicación destino, domiciliario asignado, estado (en curso/
  entregado/cancelado), método de pago, valor cobrado.
- Consulta de domicilios por día/semana/mes, con filtros (ver sección 7).
- Kilómetros recorridos por geolocalización del celular, sin pagar ninguna API (ver sección 8).
- Foto del pedido al momento de cargarlo al baúl, antes de salir a entregar.
- Registro de mantenimiento: tanqueo, taller, compra adicional, con kilometraje y costo.
- Dashboard con los indicadores mensuales y sus desgloses por día/semana/mes.

### Fase 2 — Escaneo de comandas (OCR)
- Captura de foto de la comanda física y extracción de teléfono/dirección/productos.
- Prellenado automático del formulario de domicilio con esos datos, editable antes de confirmar.
- Marcado del espacio del baúl (1/2/3) asignado.
- Acción rápida de llamada al número extraído.

### Fase 3 — Analítica avanzada y navegación (opcional, según necesidad real del negocio)
- Comparativo de rentabilidad por domicilio (cobrado vs. costo de gasolina/mantenimiento prorrateado).
- Alertas de mantenimiento preventivo por kilometraje.
- Exportes/reportes descargables (Excel/PDF).
- Botón "Iniciar ruta" con deep link a Google Maps, sin usar su API de pago (ver sección 10).

> **Fase 1 debe cerrarse primero**, porque todo lo demás depende de su modelo de datos y flujo de
> registro. Las fases no tienen que ser estrictamente secuenciales si hay tiempo para paralelizar.

### Desglose original de referencia (7 etapas)

El planteamiento inicial dividía el proyecto en 7 etapas más granulares. Se mantienen aquí como
referencia de cómo se pensó originalmente el orden de construcción; las Fases 1–3 de arriba son la
versión vigente y ya incorporan las decisiones tomadas:

1. **Base del sistema:** clientes, domicilios, teléfono como identificador, ubicaciones, métodos de
   pago, estados de domicilio, dashboard básico.
2. **Geolocalización:** captura GPS, registro de ubicación al entregar, historial de ubicaciones,
   cálculo de kilómetros, integración con mapas.
3. **Control del vehículo:** tanqueos, cálculo de consumo, mantenimiento, gastos.
4. **Comandas:** cámara, carga de fotografías, OCR, extracción de datos, verificación.
5. **Organización de pedidos:** espacios del baúl, fotografía de pedidos, identificación rápida.
6. **Reportes:** diarios, semanales, mensuales, estadísticas de clientes/km/combustible/mantenimiento.
7. **Optimización:** rutas optimizadas, clientes frecuentes, ubicaciones favoritas, automatización,
   predicciones, mejoras de rendimiento.

## 4. Roles de usuario y permisos

Cuentas separadas desde el MVP. La asignación de domicilios **no** es un flujo en tiempo real dentro
del panel — es un proceso físico e independiente: el domiciliario recibe pedidos y decide cuántos lleva
en cada salida (limitado por los 3 espacios del baúl), y es él quien los registra en la app. El
administrador define la cantidad/meta de domicilios para el domiciliario, pero no asigna uno por uno
desde la pantalla.

| Rol | Dispositivo | Qué hace |
|---|---|---|
| Domiciliario | Celular | Registra sus propios domicilios (cliente, ubicación, productos) según la carga que lleva en el vehículo, marca entregas/cancelaciones, registra mantenimiento, escanea comandas (Fase 2) |
| Administrador/Dueño | Web (dashboard) | Define la cantidad/meta de domicilios para el domiciliario, consulta métricas e histórico de todos, gestiona clientes |

Un domiciliario solo puede ver y operar los domicilios que él mismo registró; el administrador ve el
total de todos los domiciliarios. Esto se aplica desde el MVP, no se difiere — el modelo de datos
incluye desde ya quién entregó cada domicilio (ver sección 24), pensando en que a futuro podría haber
más de un domiciliario/moto.

## 5. Dashboard administrativo

El sistema contará con un panel administrativo principal donde se mostrará un resumen de las
operaciones realizadas. Cada indicador debe permitir acceder a una vista con información más detallada.

El dashboard deberá mostrar como mínimo:

* Cantidad de domicilios realizados durante el mes, la semana y el día.
* Kilómetros recorridos durante el mes.
* Cantidad de veces que se ha tanqueado el vehículo.
* Cliente con mayor cantidad de visitas y cliente con mayor cantidad de pedidos (mes en curso).
* Cantidad de domicilios cancelados, entregados exitosamente y pendientes.
* Cantidad de domicilios pagados en efectivo vs. mediante transferencia.
* Gastos relacionados con combustible y con mantenimiento del vehículo.

Además:

- Desglose de domicilios por día/semana/mes, separando efectivo vs. transferencia.
- Desglose de km recorridos por cliente, ordenado por distancia y frecuencia.
- Desglose de mantenimiento: tanqueos, kilómetros por tanque, visitas a taller, compras adicionales.
- Ranking de clientes por número de pedidos (semanal/mensual).

## 6. Módulo de domicilios

Este módulo permite registrar y consultar todos los domicilios realizados.

**Información de cada domicilio:** cliente, número de teléfono, dirección/ubicación destino,
coordenadas GPS, productos solicitados, valor del pedido, método de pago, estado, kilómetros
recorridos, domiciliario que lo registra y entrega, fecha y hora de inicio/entrega, espacio de baúl
asignado, observaciones.

**Flujo de creación (confirmado):** lo crea el propio domiciliario según la carga que lleva —
cliente, ubicación, productos, espacio de baúl (máximo 3 domicilios simultáneos por carga, uno por
espacio). Al crear el domicilio empieza el tracking de ubicación en segundo plano hasta que se marque
como entregado o cancelado (ver sección 8).

**Estados del domicilio (modelo vigente):** `En curso`, `Entregado`, `Cancelado` (con motivo). El
planteamiento original contemplaba estados más granulares (`Pendiente`, `En preparación`, `En camino`,
`No entregado` como distinto de `Cancelado`); no se incluyeron en el MVP porque el domiciliario registra
el domicilio cuando ya sale a entregarlo —no hay un flujo previo de "pedido pendiente de asignar"— así
que esos estados intermedios no aplican con el flujo de trabajo confirmado. El campo `motivo` de
cancelación puede absorber matices como "no encontré al cliente" sin necesidad de un estado aparte. Si
en el uso real se necesitan, se agregan después.

Marcar como **entregado** detiene el tracking, calcula la distancia recorrida y asocia el pago
recibido. Marcar como **cancelado** requiere motivo. Se mantiene un historial completo por cliente y
por domiciliario.

## 7. Consulta de domicilios

El sistema permite consultar los domicilios realizados utilizando diferentes períodos de tiempo:
consulta diaria, semanal y mensual.

La información podrá filtrarse por:

* Fecha.
* Cliente.
* Estado.
* Método de pago.
* Distancia recorrida.

También deberá permitir visualizar un resumen del período consultado: domicilios en efectivo,
domicilios por transferencia, total de domicilios, total recaudado y total de kilómetros recorridos.

## 8. Módulo de kilómetros recorridos

El sistema registra la distancia recorrida durante los domicilios. Para cada domicilio se almacena:
kilómetros recorridos, cliente visitado, fecha y hora, ubicación de origen y de destino, cantidad de
visitas al cliente, estado de entrega.

**Enfoque técnico confirmado:** mientras el domicilio está "en curso", la app toma la ubicación del
celular a intervalos (`navigator.geolocation.watchPosition`, gratis, sin API de terceros) y suma la
distancia entre puntos consecutivos con la fórmula de Haversine hasta marcar "entregado". Esto da un
recorrido real aproximado, no solo la distancia en línea recta entre origen y destino. No se usa una
API de pago (como rutas de Google Maps) para este cálculo — ver el riesgo técnico asociado en la
sección 27.

El sistema permitirá identificar:

* Cliente ubicado a mayor distancia y cliente visitado con mayor frecuencia.
* Kilómetros totales recorridos y promedio de kilómetros por domicilio.
* Kilómetros recorridos diariamente, semanalmente y mensualmente.
* Qué clientes generan una mayor cantidad de kilómetros recorridos.

## 9. Geolocalización

El sistema utiliza la ubicación GPS del dispositivo móvil para obtener una ubicación lo más precisa
posible, en dos momentos:

- **Durante el recorrido:** para registrar la ubicación y calcular el desplazamiento realizado
  (tracking en segundo plano, sección 8).
- **Al finalizar el domicilio:** cuando el domiciliario presiona "Entregado", el sistema solicita la
  ubicación actual del dispositivo y la almacena, asociándola posteriormente con el cliente y su
  dirección para mejorar la precisión de futuras entregas.

## 10. Integración con mapas

El planteamiento original proponía usar la API de Google Maps para navegación, mostrar ubicaciones
guardadas, generar rutas y calcular distancias. **Decisión confirmada:** no se usa una API de pago para
calcular kilómetros ni rutas — el cálculo de distancia se hace con GPS + Haversine (sección 8), sin
costo.

Queda pendiente de evaluar, como idea de Fase 3, un botón "Iniciar ruta" que abra la ubicación guardada
directamente en la app de Maps del celular mediante un deep link (`geo:` o
`https://maps.google.com/?q=lat,lng`), sin usar la API de Google — solo abre navegación externa, no
calcula nada del lado del sistema. Es de bajo costo de construir y no bloquea el MVP. Alternativas como
OpenStreetMap podrían evaluarse si más adelante se necesita algo más.

## 11. Módulo de mantenimiento y combustible

Este módulo lleva el control del estado y los gastos relacionados con la moto utilizada para los
domicilios.

**Registro de tanqueo (MVP):** galones/cantidad de combustible, costo total, kilometraje actual. Con
esto se calcula el rendimiento (km recorridos por galón) usando el kilometraje entre tanqueos
consecutivos.

**Registro de mantenimiento (MVP):** tipo (taller / compra adicional), descripción, costo,
kilometraje. Ejemplos: cambio de aceite, cambio de llantas, reparación de frenos, cambio de cadena,
reparaciones eléctricas o mecánicas, compra de repuestos, otros gastos necesarios.

**Campos adicionales sugeridos por el planteamiento original, pendientes de decidir** (no están en el
MVP para no agregar fricción al registro desde el celular; se incorporan solo si el negocio los
necesita realmente):

- Tipo de combustible y estación de servicio, en el registro de tanqueo.
- Repuestos utilizados, como detalle aparte de la descripción del taller.

El sistema permite consultar el gasto total de mantenimiento y combustible durante un período
determinado (mensual, ver dashboard en sección 5).

## 12. Módulo de clientes

El registro de clientes utiliza principalmente el **número de teléfono como medio de identificación**,
para que cuando un cliente vuelva a solicitar un domicilio, el sistema pueda encontrar rápidamente su
información.

**Información almacenada:** teléfono (identificador), fecha de registro, cantidad total de pedidos,
pedidos semanales/mensuales, ubicaciones asociadas, observaciones.

**Pendiente de decidir — campo `nombre`:** el planteamiento original pedía guardar el nombre del
cliente además del teléfono; el modelo de datos vigente (sección 24) todavía no lo incluye. Se decide
al construir el CRUD de clientes (Bloque 1 del backlog, sección 32) si hace falta mostrar un nombre en
vez de solo el número.

## 13. Múltiples ubicaciones por cliente

Un mismo cliente puede tener varias ubicaciones registradas (alias + coordenadas + dirección), útil
cuando pide domicilios desde diferentes lugares:

```text
Cliente: Juan Pérez
Teléfono: 3000000000

Ubicaciones:

1. Casa
2. Trabajo
3. Universidad
4. Dirección adicional
```

Cada ubicación puede tener nombre/descripción, coordenadas GPS, dirección, fecha del último uso y
cantidad de domicilios realizados. Al repetir un pedido, el sistema muestra las ubicaciones guardadas
para elegir rápidamente la correspondiente, o agregar una nueva.

## 14. Módulo de clientes frecuentes

El sistema identifica automáticamente los clientes con mayor interacción con el negocio, con rankings
como:

```text
Clientes con más pedidos          Clientes más visitados
1. Juan Pérez       35 pedidos    1. Juan Pérez       35 visitas
2. María Gómez      28 pedidos    2. María Gómez      28 visitas
3. Carlos López     21 pedidos    3. Carlos López     21 visitas
```

También por semana y por mes. **Decisión confirmada:** el indicador "cliente más visitado" del
dashboard se calcula sobre el **mes en curso**.

## 15. Métodos de pago

Cada domicilio registra el método de pago. Opciones iniciales: efectivo, transferencia, otro. El
dashboard puede mostrar un resumen como:

```text
Domicilios del mes

Total:              150
Efectivo:            90
Transferencia:       60
Cancelados:           8
Entregados:          142
```

También es posible calcular el dinero recibido por cada método de pago.

## 16. Gestión de productos dentro del baúl

La moto cuenta con un baúl dividido en **tres espacios horizontales**. El sistema permite organizar los
productos de acuerdo con el espacio donde serán almacenados:

```text
BAÚL DE LA MOTO

┌─────────────────┐
│ ESPACIO 1       │
│ Pedido #001     │
├─────────────────┤
│ ESPACIO 2       │
│ Pedido #002     │
├─────────────────┤
│ ESPACIO 3       │
│ Pedido #003     │
└─────────────────┘
```

El objetivo es reducir errores y evitar confundir los productos de diferentes clientes. Máximo 3
domicilios simultáneos por carga, uno por espacio.

**Modelo de datos confirmado:** `EspacioBaul` no se modela como un enum de valores `1, 2, 3` (un enum
representa categorías con nombre, no un rango numérico); se modela como `INT` con un
`CHECK (espacio_baul BETWEEN 1 AND 3)`, más simple.

## 17. Fotografía de los productos

**Decisión confirmada:** se toma **una sola foto** del pedido, en el momento de cargarlo al baúl (antes
de salir a entregar) — no una foto por compartimento. El propósito es dejar evidencia de qué productos
se cargaron. La información asociada al domicilio puede mostrarse así:

```text
DOMICILIO #001

Cliente: Juan Pérez
Teléfono: 3000000000

Productos:
- Hamburguesa x2
- Gaseosa x2
- Papas x1

Ubicación: Casa
Baúl: Espacio 1

[ Ver pedido ]
[ Llamar ]
[ Iniciar ruta ]
```

## 18. Registro mediante comandas (OCR) — Fase 2

El sistema contempla usar la cámara del teléfono para digitalizar una comanda física: el domiciliario
toma una fotografía y el sistema extrae automáticamente teléfono, dirección, productos, cantidades,
valor del pedido y observaciones, usando **OCR (Reconocimiento Óptico de Caracteres)**.

La cámara puede usarse en tiempo real (escaneo directo) o sobre una imagen ya almacenada en el
dispositivo. El sistema debe mostrar la información extraída **antes de guardarla**, para que el
domiciliario pueda verificar y corregir cualquier dato mal interpretado, y así prellenar el formulario
de domicilio (editable antes de confirmar) y marcar el espacio del baúl asignado.

## 19. Acciones rápidas para llamadas — Fase 2

Cuando el sistema obtiene el número telefónico del cliente (por registro manual o por OCR de la
comanda), debe ofrecer una acción para llamar directamente, evitando copiar el número a mano:

```text
Cliente: Juan Pérez
Teléfono: 3000000000

[ Llamar ]
```

## 20. Proceso completo de un domicilio

Flujo de referencia una vez esté construida la Fase 2 (con OCR). En el MVP (Fase 1) los pasos 1–4 se
reemplazan por captura manual de los datos del cliente y el pedido:

```text
1. Recibir comanda
        ↓
2. Escanear comanda (Fase 2) / Registrar datos manualmente (Fase 1)
        ↓
3. Extraer información mediante OCR (Fase 2)
        ↓
4. Verificar información
        ↓
5. Buscar cliente por teléfono
        ↓
6. ¿Cliente existente? → Seleccionar ubicación (sí) / Crear cliente (no)
        ↓
7. Registrar pedido
        ↓
8. Asignar ubicación
        ↓
9. Asignar espacio del baúl (máx. 3)
        ↓
10. Iniciar domicilio (arranca tracking GPS en segundo plano)
        ↓
11. Abrir navegación (deep link a Maps, Fase 3) / trasladarse directamente (Fase 1)
        ↓
12. Llegar al destino
        ↓
13. Entregar producto
        ↓
14. Presionar "Entregado"
        ↓
15. Capturar ubicación GPS y detener tracking
        ↓
16. Registrar método de pago
        ↓
17. Guardar kilómetros recorridos (Haversine sobre los puntos capturados)
        ↓
18. Finalizar domicilio → actualizar dashboard
```

## 21. Registro de entrega

Al momento de entregar el pedido, el domiciliario cuenta con un botón **[ ENTREGADO ]**. Al presionarlo,
el sistema:

1. Obtiene la ubicación GPS actual y detiene el tracking en segundo plano.
2. Registra fecha y hora.
3. Registra el estado como "Entregado".
4. Guarda la ubicación.
5. Registra el método de pago y el valor cobrado.
6. Calcula y guarda los kilómetros recorridos.
7. Actualiza las estadísticas del dashboard.
8. Asocia la ubicación con el cliente para futuras entregas.

## 22. Historial de ubicaciones

Cuando se completa un domicilio, la ubicación obtenida puede almacenarse como una nueva ubicación del
cliente (si ya existe, se evita crear duplicados innecesarios), construyendo progresivamente una base
de ubicaciones frecuentes:

```text
Juan Pérez

Ubicaciones:

1. Casa
   📍 6.12345, -76.12345
   Visitas: 15

2. Trabajo
   📍 6.12567, -76.12678
   Visitas: 8

3. Nueva ubicación
   📍 6.12890, -76.12987
   Visitas: 1
```

## 23. Estadísticas generales

Con toda la información almacenada, el sistema puede generar estadísticas como: total de domicilios
(día/semana/mes), total de kilómetros y promedio por domicilio, cliente más visitado y con más pedidos,
total y gasto en combustible, total gastado en mantenimiento, total recibido en efectivo y por
transferencia, domicilios cancelados y exitosos. Estas estadísticas alimentan el dashboard
administrativo (sección 5) y las consultas por período (sección 7).

## 24. Modelo de datos

El modelo vigente está en [`databases.plantuml`](databases.plantuml), con las entidades `Usuario`,
`Cliente`, `Ubicacion`, `Domicilio` y `Registro_Mantenimiento`. Decisiones ya aplicadas:

1. **`EspacioBaul` como `INT` con `CHECK BETWEEN 1 AND 3`**, en vez de enum (sección 16).
2. **Entidad `Usuario`** (teléfono como PK, rol `Admin`/`Domiciliario`) desde el MVP, no diferida.
3. **`Domicilio` relacionado con `Usuario`** mediante `telefono_domiciliario` (FK) — quien lo registró y
   entrega, permitiendo que cada domiciliario vea solo lo suyo y el admin vea el total.
4. **`foto_productos_url` en `Domicilio` como una sola foto** (sección 17), sin tabla `Foto_Producto`
   aparte.
5. Relación `usuario ||--o{ domicilio : "registra/entrega"`.

Pendiente de modelar:

6. **Campo `nombre` en `Cliente`** (sección 12) — hoy la entidad solo tiene `telefono` y
   `fecha_primer_registro`.
7. **Campos adicionales de mantenimiento/tanqueo** (sección 11): tipo de combustible, estación de
   servicio, repuestos utilizados.
8. **Entidad `Comanda`** (Fase 2, sección 18), con los campos extraídos por OCR y relación 1:1 con
   `Domicilio` — se modela cuando se construya esa fase.

## 25. Requisitos no funcionales

- **Protección de datos personales:** el sistema almacena teléfonos y ubicaciones de clientes reales.
  En Colombia esto cae bajo la Ley 1581 de 2012 (Habeas Data) — como mínimo, informar para qué se usan
  los datos y no compartirlos con terceros sin autorización.
- **Modo sin conexión:** un domiciliario en una zona sin señal debe poder marcar "entregado" y que se
  sincronice cuando vuelva a haber datos, en vez de perder el registro.
- **Consistencia del kilometraje:** el kilometraje registrado en mantenimiento y la `distancia_km` por
  domicilio deben ser conciliables (la suma de distancias no debería divergir demasiado del odómetro).
- **Seguridad de acceso:** solo el domiciliario y el administrador acceden a los datos; no hay registro
  público.
- **Permisos por rol:** aplicados desde el MVP (ver sección 4), no se difieren.
- **Tracking en segundo plano:** el cálculo de kilómetros depende de que el navegador pueda seguir
  reportando ubicación mientras el domicilio está en curso (ver riesgo en sección 27).

## 26. Decisiones registradas y preguntas abiertas

Todas las preguntas abiertas del planteamiento original quedaron resueltas:

| Pregunta | Decisión |
|---|---|
| Fuente del kilometraje | GPS del celular en tiempo real (`watchPosition` + Haversine), sin API de pago |
| Ventana de "cliente más visitado" | Mes en curso |
| ¿Más de un domiciliario a futuro? | Sí — el modelo soporta varios desde el MVP |
| Foto de productos | Una foto al momento de cargar el pedido al baúl, no una por compartimento |
| API de rutas de Google Maps | No se usa para calcular distancia; se evalúa un botón de deep link sin API en Fase 3 |
| Roles | Cuentas separadas desde el MVP |
| Asignación de domicilios | El domiciliario decide y registra cuántos lleva por carga (máx. 3); el admin solo define la meta/cantidad, no asigna uno por uno |

**Preguntas nuevas, todavía abiertas** (no bloquean el arranque del MVP):

| Pregunta | Estado |
|---|---|
| ¿Se necesita el campo `nombre` en `Cliente`? | Pendiente — se decide en Bloque 1 del backlog (sección 32) |
| ¿Hacen falta estados intermedios del domicilio (`Pendiente`, `En preparación`, `En camino`)? | Pendiente — el flujo actual no parece necesitarlos, se revisa con uso real |
| ¿Se necesitan campos extra de mantenimiento (tipo de combustible, estación, repuestos)? | Pendiente — se agregan si el negocio los pide |

## 27. Riesgo técnico a vigilar

Los navegadores móviles limitan o detienen `watchPosition` cuando la pestaña pasa a segundo plano o la
pantalla se bloquea, lo que puede cortar el tracking de un domicilio a mitad de camino.

**Mitigación para el MVP:** instalar la PWA en la pantalla de inicio (mejora la prioridad del proceso en
segundo plano en Android) y mantener la pantalla activa durante el recorrido. Si en la práctica el corte
de tracking es frecuente, la alternativa de respaldo es capturar solo origen y destino (una lectura al
crear el domicilio y otra al entregar) y aceptar que la distancia sea una aproximación en línea recta en
vez de un recorrido real — se decide con datos reales una vez esté en uso, no antes.

## 28. Stack técnico

El repo ya tiene una carpeta `Fasteroid/` con un componente `page.js` de **Next.js**, así que el
dashboard administrativo se construye ahí. Para la app de captura del domiciliario (cámara, GPS), la
opción más simple es que sea el mismo Next.js como **PWA** (funciona en el navegador del celular, evita
mantener una app nativa aparte); si más adelante se necesita OCR en tiempo real o acceso más profundo a
la cámara, se puede reevaluar una app nativa o híbrida solo para esa parte.

## 29. Posible estructura de módulos

```text
SISTEMA
│
├── Dashboard
│
├── Domicilios
│   ├── Nuevo domicilio
│   ├── Domicilios diarios
│   ├── Domicilios semanales
│   └── Domicilios mensuales
│
├── Clientes
│   ├── Registrar cliente
│   ├── Buscar cliente
│   ├── Historial
│   └── Ubicaciones
│
├── Comandas (Fase 2)
│   ├── Escanear comanda
│   ├── OCR
│   └── Historial de comandas
│
├── Rutas
│   ├── Ubicaciones
│   ├── Navegación
│   └── Kilómetros
│
├── Vehículo
│   ├── Combustible
│   ├── Tanqueos
│   ├── Mantenimiento
│   └── Gastos
│
└── Reportes
    ├── Domicilios
    ├── Clientes
    ├── Kilómetros
    ├── Combustible
    └── Mantenimiento
```

## 30. Funcionalidades futuras

Ideas planteadas en el documento original que no tienen todavía una fase asignada, porque dependen de
qué tan lejos se quiera llevar el proyecto después de la Fase 3:

* Optimización automática de rutas y agrupación de domicilios cercanos.
* Notificaciones (ej. al cliente cuando el domicilio va en camino).
* Reportes gráficos y exportación a Excel/PDF (parte de esto ya está en Fase 3).
* Control de ingresos y gastos más detallado.
* Predicción de combustible necesario según la carga del día.
* Alertas de mantenimiento preventivo (ya en Fase 3).
* Copias de seguridad automáticas.
* Aplicación móvil nativa (si la PWA queda corta).
* Lectura avanzada de comandas mediante inteligencia artificial y reconocimiento automático de
  productos (más allá del OCR de texto simple).
* Cálculo de distancia mediante una API de mapas, si el enfoque gratuito (GPS + Haversine) no resulta
  suficientemente preciso en la práctica.
* Control de tiempo por domicilio (cuánto tarda desde que sale hasta que entrega).

## 31. Consideraciones técnicas

Para la implementación se deben evaluar distintas tecnologías por funcionalidad: base de datos para
clientes/domicilios/ubicaciones/mantenimiento, GPS del dispositivo móvil, servicio de OCR para lectura
de comandas (Fase 2), cámara del dispositivo, sistema de llamadas telefónicas, autenticación para
usuarios administrativos y domiciliarios, almacenamiento de fotografías, y generación de estadísticas y
gráficos.

Antes de seleccionar servicios externos como Google Maps u OCR en la nube, se debe revisar la
disponibilidad de las APIs necesarias, costos, límites de uso y condiciones actuales del servicio — por
eso quedaron fuera del MVP (sección 3).

## 32. Backlog de la Fase 1 (MVP) — orden de construcción

Cada bloque depende del anterior porque comparte modelo de datos o pantallas. Dentro de cada bloque, las
tareas están en el orden en que tiene sentido construirlas.

**Bloque 0 — Base del proyecto**
1. Definir esquema de base de datos real (a partir de `databases.plantuml`) y conectar Next.js a ella.
2. Autenticación: login por teléfono + contraseña/PIN, sesión separada por rol (`Admin` /
   `Domiciliario`), y guard de rutas según rol.

**Bloque 1 — Clientes y ubicaciones**
3. CRUD de `Cliente` (alta por teléfono; decidir si se agrega `nombre`, sección 26).
4. CRUD de `Ubicacion` asociada a un cliente (alias + lat/long), con opción de agregar varias.

**Bloque 2 — Domicilios (núcleo del negocio)**
5. Formulario de creación de domicilio (solo visible/usable por el domiciliario logueado): cliente,
   ubicación, productos, espacio de baúl (máx. 3 simultáneos).
6. Captura de foto al cargar el pedido al baúl.
7. Tracking de ubicación en segundo plano mientras el domicilio está "en curso" + cálculo de distancia
   (Haversine sobre los puntos capturados).
8. Marcar como entregado (detiene tracking, registra método de pago y valor cobrado) / marcar como
   cancelado (con motivo).
9. Listado/historial de domicilios por domiciliario y por cliente, con consulta por día/semana/mes y
   filtros (sección 7).

**Bloque 3 — Mantenimiento del vehículo**
10. Formulario de registro de mantenimiento (tanqueo / taller / compra adicional) con kilometraje y
    costo.
11. Cálculo de rendimiento (km recorridos por galón) entre tanqueos consecutivos.

**Bloque 4 — Dashboard administrativo**
12. Resumen mensual: domicilios, km, tanqueos, cliente top del mes, gastos de combustible y
    mantenimiento (solo visible para `Admin`).
13. Desgloses: domicilios por día/semana/mes (efectivo vs. transferencia), km por cliente, detalle de
    mantenimiento, ranking de clientes.

El Bloque 2 es el que primero entrega valor real de negocio (ya se puede operar y medir); los bloques 3
y 4 dependen de que existan datos de domicilios y mantenimiento para tener algo que mostrar.

## 33. Métricas de éxito

- El domiciliario registra el 100% de los domicilios del día sin depender de anotaciones en papel.
- El dashboard refleja los datos del mes sin necesidad de cálculos manuales.
- Se puede responder "¿cuánto costó operar la moto este mes vs. cuánto se facturó?" en un solo vistazo.

## 34. Próximos pasos inmediatos

1. ~~Responder las preguntas abiertas del planteamiento original~~ — resuelto, ver tabla de decisiones
   (sección 26).
2. ~~Ajustar `databases.plantuml` con los cambios del modelo de datos~~ — hecho, ver sección 24.
3. Resolver las preguntas nuevas de la sección 26 (nombre de cliente, estados intermedios, campos de
   mantenimiento) antes o durante el Bloque 1 del backlog.
4. Definir el flujo de autenticación (login por teléfono + contraseña/PIN es lo más simple, dado que
   `Cliente` y `Usuario` ya usan teléfono como identificador natural).
5. Construir el MVP de Fase 1 en Next.js siguiendo el orden de dependencias del backlog (sección 32).

## 35. Objetivo principal y resultado esperado

El objetivo del proyecto es crear una herramienta que permita **centralizar y automatizar la gestión de
domicilios**, reduciendo el tiempo necesario para registrar clientes, buscar ubicaciones, realizar
llamadas, organizar pedidos y completar entregas. Además, el sistema debe generar información histórica
para conocer el comportamiento del negocio y tomar decisiones basadas en datos: cuántos domicilios se
realizan, cuáles son los clientes más frecuentes, cuánto se recorre diariamente, cuánto se gasta en
combustible y mantenimiento, cuáles son las ubicaciones más utilizadas, qué métodos de pago son más
frecuentes y cuál es el rendimiento aproximado del vehículo.

Al finalizar el desarrollo se espera contar con un sistema capaz de administrar el proceso completo de
un domicilio, desde la recepción del pedido hasta la entrega del producto, permitiendo que el
domiciliario pueda:

**Recibir → (Escanear, Fase 2) → Registrar → Ubicar → Organizar → (Navegar, Fase 3) → Entregar →
Confirmar → Guardar ubicación → Actualizar estadísticas.**

Mientras tanto, el administrador podrá consultar toda la información histórica del negocio mediante un
dashboard centralizado. De esta manera, el proyecto no solamente funcionará como un sistema para
registrar domicilios, sino como una herramienta para **gestionar, analizar y optimizar el funcionamiento
del servicio de domicilios en Carepa**.
</content>

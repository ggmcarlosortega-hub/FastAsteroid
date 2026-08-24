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

Cuentas separadas desde el MVP.

**Decisión actualizada (reemplaza la versión original de esta sección):** el planteamiento inicial
decía que la asignación de domicilios no era un flujo dentro del panel y que el administrador solo
definía la meta/cantidad, sin asignar uno por uno. Esto cambió: **el administrador también puede crear
un domicilio directamente desde el panel y asignarlo a un domiciliario específico**, además de que el
domiciliario puede seguir registrando los suyos propios desde el celular. Las reglas de negocio (máximo
3 domicilios simultáneos, uno por espacio del baúl) aplican igual sin importar quién lo crea, evaluadas
sobre el domiciliario al que queda asignado.

| Rol | Dispositivo | Qué hace |
|---|---|---|
| Domiciliario | Celular | Registra sus propios domicilios (cliente, ubicación, productos) según la carga que lleva en el vehículo, marca entregas/cancelaciones, registra mantenimiento, escanea comandas (Fase 2) |
| Administrador/Dueño | Web (dashboard) | Crea y asigna domicilios a un domiciliario, consulta métricas e histórico de todos, gestiona clientes |

Un domiciliario solo puede ver y **operar** (marcar entregado/cancelado) los domicilios asignados a él;
el administrador ve el total de todos los domiciliarios y puede crear domicilios para cualquiera de
ellos, pero no marca entregas/cancelaciones desde el panel — eso sigue siendo del domiciliario, porque
depende del tracking GPS que corre en su celular durante la entrega real. Esto se aplica desde el MVP,
no se difiere — el modelo de datos incluye desde ya quién entregó cada domicilio (ver sección 24),
pensando en que a futuro podría haber más de un domiciliario/moto.

**Asignación del espacio del baúl (ajustada tras revisión):** cuando el domiciliario registra su propio
domicilio, elige el espacio del baúl en ese mismo momento porque ya lo tiene en mano. Pero cuando el
Admin crea y asigna un domicilio, el Admin **no** elige el espacio del baúl — el domicilio queda en un
estado intermedio, "Asignado" (sin espacio de baúl todavía), y solo el domiciliario, al recogerlo
físicamente, elige en cuál de sus 3 espacios lo lleva. Recién ahí el domicilio pasa a "En_curso" y entra
a contar para el límite de 3 simultáneos. El Admin sí ve estos domicilios "Asignado" en su panel
(pendientes de recoger), pero sin poder tocar el espacio del baúl.

**Corrección de un domicilio ya creado:** el Admin puede editar los `productos` y el `precio` de un
domicilio existente (por ejemplo si se equivocó al seleccionar los productos al crearlo). No se permite
editar cliente, ubicación, domiciliario asignado ni espacio del baúl desde esta edición — solo corregir
el pedido en sí.

**Alcance de las métricas por rol (confirmado, 2026-08-23):** el domiciliario solo ve las estadísticas
de **su día actual** en su propia vista (`/domiciliario`) — sin selector de semana/mes ni la gráfica de
ganancias/pérdidas. Las métricas completas (día/semana/mes, ganancias/pérdidas, histórico de todos los
domiciliarios) quedan reservadas exclusivamente al panel del Administrador.

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
- **Ganancias y pérdidas** (confirmado): comparación gráfica, por período (día/semana/mes), entre lo
  ganado (suma de `precio` de domicilios entregados) y lo perdido (suma de `precio` de domicilios
  cancelados) — posible porque `precio` se fija desde la creación del domicilio, sin importar el
  desenlace (ver sección 24). Se adelantó su construcción a `/admin/domicilios` antes de que el resto
  del dashboard (Bloque 4 del backlog) esté listo.

## 6. Módulo de domicilios

Este módulo permite registrar y consultar todos los domicilios realizados.

**Información de cada domicilio:** cliente, número de teléfono, dirección/ubicación destino,
coordenadas GPS, productos solicitados, valor del pedido, método de pago, estado, kilómetros
recorridos, domiciliario que lo registra y entrega, fecha y hora de inicio/entrega, espacio de baúl
asignado, observaciones.

**Flujo de creación (confirmado, ajustado tras revisión):** lo crea el propio domiciliario según la carga
que lleva, o el administrador asignándolo a un domiciliario (ver sección 4) — cliente, ubicación,
productos, **precio** (valor del pedido, fijado desde este momento). El espacio de baúl (máximo 3
domicilios simultáneos por carga, uno por espacio) **solo lo elige el domiciliario**: si lo crea él mismo,
lo elige de una vez al registrarlo; si lo crea el Admin, el domiciliario lo elige después, al recoger el
domicilio físicamente (ver sección 4 y "Estados del domicilio" más abajo). El tracking de ubicación en
segundo plano (sección 8) empieza cuando el domicilio pasa a `En curso`, no antes.

**Captura de ubicación al entregar (confirmado, ajustado tras segunda revisión):** al presionar
"Entregado", el sistema exige la ubicación GPS actual del domiciliario — sin ella no se puede confirmar
la entrega. Esa ubicación **reemplaza** la que quedó asignada al domicilio al crearlo, en vez de solo
compararse contra ella: el cliente muchas veces no tiene clara su ubicación exacta y el Admin puede
equivocarse al asignarla por la rapidez con la que despacha — el punto real donde se hizo la entrega es
la fuente de verdad. Concretamente: se compara (Haversine) contra las ubicaciones ya guardadas del
cliente; si coincide con una existente, el domicilio queda apuntando a esa (no se duplica, ver sección
22) y todo pasa en un solo panel (método de pago + valor cobrado). Si no coincide con ninguna, ese
primer panel no basta —no pide nombre de entrada— y recién ahí se abre un **segundo panel**, exigiendo
el nombre del lugar antes de crear la ubicación nueva y cerrar la entrega. (Versión
anterior de esta sección: comparar y solo marcar la entrega como "incoherente" sin corregir el registro
— se descartó porque no resolvía el problema real, solo lo señalaba.)

**Estados del domicilio (modelo vigente, ajustado tras revisión):** `Asignado`, `En curso`, `Entregado`,
`Cancelado` (con motivo). El estado `Asignado` es nuevo: existe únicamente para domicilios creados por el
Admin, en la ventana de tiempo entre que el Admin lo asigna y el domiciliario lo recoge y elige el
espacio del baúl — no cuenta para el límite de 3 domicilios simultáneos ni tiene tracking GPS activo
todavía. El planteamiento original contemplaba estados más granulares (`Pendiente`, `En preparación`,
`En camino`, `No entregado` como distinto de `Cancelado`); siguen sin incluirse porque, salvo por la
espera de recogida que ya cubre `Asignado`, el resto del flujo no tiene pasos intermedios reales en este
negocio. El campo `motivo` de cancelación puede absorber matices como "no encontré al cliente" sin
necesidad de un estado aparte. Si en el uso real se necesitan más estados, se agregan después.

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

**Implementado (2026-08-23), adelantado de Fase 3:** un botón "Ver en Google Maps" que abre la
coordenada guardada de la ubicación directamente en la app de Maps del celular (o el navegador) mediante
un deep link público (`https://www.google.com/maps/search/?api=1&query=lat,lng`), sin usar la API de
Google — solo abre navegación externa, no calcula nada del lado del sistema. Presente en el detalle de
cada domicilio y en las tarjetas de domicilios activos del domiciliario. Alternativas como OpenStreetMap
podrían evaluarse si más adelante se necesita algo más.

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

**Decisión confirmada — campo `nombre`:** `Cliente` sí incluye `nombre` (obligatorio), además del
teléfono como identificador. Se agregó al modelo de datos (sección 24) al construir el CRUD de clientes
(Bloque 1 del backlog, sección 32).

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

## 18. Registro mediante comandas (OCR) — Fase 2 (implementado, 2026-08-23)

**Confirmado y construido:** el domiciliario fotografía la comanda física (foto ya usada además como la
foto obligatoria del pedido, sin pedir una segunda) y el sistema extrae automáticamente teléfono,
nombre del cliente, referencia de dirección, productos y valor total, usando **Tesseract.js** — OCR que
corre 100% en el navegador del celular (WebAssembly), sin costo ni API key, en línea con la decisión de
no depender de APIs de pago. La imagen se preprocesa (escala de grises + contraste) antes de leerla, lo
que sube notablemente la confianza del OCR sobre una foto real.

La información extraída se muestra siempre en un paso de revisión, **editable antes de confirmar**
(exigido desde el planteamiento original) — necesario en la práctica: sobre una comanda real fotografiada
con el fondo visible, la confianza del OCR ronda 40-60% y el teléfono es el campo que más falla, así que
el domiciliario debe revisarlo con cuidado antes de continuar. Con el teléfono ya corregido, el sistema
busca si el cliente existe: si tiene ubicaciones guardadas, se eligen de una lista (o se indica que es una
dirección nueva); si no existe o no tiene ninguna, se crea una ubicación nueva con la referencia de texto
de la comanda como alias y la posición GPS del domiciliario en ese momento como coordenada de partida —
temporal, porque el flujo de entrega (sección 6) ya la reemplaza por la posición real capturada ahí, sin
que el domiciliario tenga que hacer nada extra.

## 19. Acciones rápidas para llamadas — Fase 2 (implementado, 2026-08-23)

**Confirmado y construido:** cuando el sistema tiene el número telefónico del cliente (por registro
manual, por escaneo de comanda, o en el detalle de cualquier domicilio) se ofrece un botón **Llamar**
que abre el marcador nativo del celular con un enlace `tel:` estándar — no requiere ningún permiso
especial del navegador, el sistema operativo se encarga de confirmar la llamada:

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

1. **`EspacioBaul` como `INT` nullable con `CHECK` (`NULL` o entre 1 y 3)**, en vez de enum (sección 16).
   Es `NULL` mientras el domicilio está `Asignado` (creado por el Admin, aún sin recoger) — ver punto 12.
2. **Entidad `Usuario`** (teléfono como PK, rol `Admin`/`Domiciliario`) desde el MVP, no diferida.
3. **`Domicilio` relacionado con `Usuario`** mediante `telefono_domiciliario` (FK) — quien lo registró y
   entrega, permitiendo que cada domiciliario vea solo lo suyo y el admin vea el total.
4. **`foto_productos_url` en `Domicilio` como una sola foto** (sección 17), sin tabla `Foto_Producto`
   aparte.
5. Relación `usuario ||--o{ domicilio : "registra/entrega"`.
6. **Campo `nombre` en `Cliente`** (sección 12), obligatorio, junto a `telefono` y
   `fecha_primer_registro`.
7. **Campo `motivo_cancelacion` en `Domicilio`** (nullable), no estaba en el planteamiento original
   pero la sección 6 exige motivo obligatorio al cancelar — se valida en la capa de servicio (y con un
   `CHECK` en la migración) que sea obligatorio cuando `estado = Cancelado`.
8. **Campo `productos` en `Domicilio`** (obligatorio, texto libre), no estaba en el planteamiento
   original pero las secciones 3 y 6 piden registrar los productos solicitados al crear el domicilio.
9. **`valor_recaudado` y `metodo_pago` en `Domicilio` son nullable**: según el flujo de las secciones
   20-21, se registran al marcar el domicilio como entregado, no al crearlo.
10. **Índice único parcial** `(telefono_domiciliario, espacio_baul)` sobre domicilios con
    `estado = En_curso`: garantiza a nivel de base de datos la regla de la sección 16 (máximo 3
    domicilios simultáneos por domiciliario, uno por espacio de baúl).
11. **Campo `precio` en `Domicilio`** (obligatorio): es el "valor del pedido" que ya mencionaba la
    sección 6 del planteamiento original, pero que no había quedado modelado. Se fija al **crear** el
    domicilio (a diferencia de `valor_recaudado`, que se registra al entregar) precisamente para que
    exista un valor conocido de antemano sin importar si el domicilio termina entregado o cancelado —
    es la base de la gráfica de ganancias/pérdidas del panel de Admin (sección 5).
12. **Estado `Asignado` agregado a `EstadoDomicilio`**: domicilios creados por el Admin nacen en este
    estado (sin `espacio_baul`) hasta que el domiciliario los recoge y elige el espacio, momento en que
    pasan a `En_curso` (sección 4 y 6). No participa del índice único parcial del punto 10 porque su
    `espacio_baul` siempre es `NULL`.
13. **`Domicilio.id_ubicacion` se reasigna al entregar** (revisión posterior al punto 13 original, que
    proponía un campo `distancia_ubicacion_entrega_km` de solo advertencia — se descartó, ver sección 6):
    la ubicación GPS capturada al entregar reemplaza la ubicación asignada al crear el domicilio,
    reutilizando una ubicación existente del cliente si coincide (Haversine) o creando una nueva si no.
    No se agregó ningún campo nuevo al modelo — es una reasignación de la FK ya existente.

Pendiente de modelar:

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
| Asignación de domicilios | **Actualizado (ver sección 4):** el domiciliario sigue registrando los suyos según la carga que lleva, y además el administrador puede crear un domicilio y asignarlo a un domiciliario específico desde el panel |
| ¿Se necesita el campo `nombre` en `Cliente`? | Sí, obligatorio — agregado al modelo en el Bloque 1 del backlog |
| ¿Quién elige el espacio del baúl cuando el Admin asigna el domicilio? | El Admin no lo elige — el domicilio queda `Asignado` sin espacio hasta que el domiciliario lo recoge y lo elige él mismo (ver sección 4 y 6) |
| ¿Qué pasa si la ubicación capturada al entregar no coincide con la asignada por el Admin? | **Revisado:** ya no se marca solo como advertencia — la ubicación real capturada al entregar reemplaza la asignada (reutilizando una ya guardada del cliente si coincide, o creando una nueva) porque el cliente o el Admin pueden haberse equivocado al asignarla (ver sección 6) |
| ¿Puede el Admin corregir un domicilio ya creado? | Sí, `productos` y `precio` — pensado para errores al seleccionar productos (ver sección 4) |

**Preguntas nuevas, todavía abiertas** (no bloquean el arranque del MVP):

| Pregunta | Estado |
|---|---|
| ¿Hacen falta estados intermedios del domicilio (`Pendiente`, `En preparación`, `En camino`)? | Parcialmente resuelto — se agregó `Asignado` (espera de recogida cuando el Admin crea el domicilio); el resto no parece necesitarse, se revisa con uso real |
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

**Actualizado (2026-08-23):** el backend se migró de rutas de API de Next.js + Prisma + SQLite a un
servidor **Express** separado (`server/`) que habla **MySQL** directamente con `mysql2` (sin ORM,
SQL escrito a mano). Motivo: entender con precisión qué pasa cuando algo falla (pool de conexiones,
caída de la base de datos, condiciones de carrera) requiere ver el manejo de errores explícito, no
abstraído detrás de un ORM. El detalle completo de la migración, las reglas de traducción del modelo
de datos y una sección de escalabilidad/manejo de fallos están en
[`aplicativos.md`](aplicativos.md).

- **Frontend:** `Fasteroid/` — Next.js (App Router), ahora exclusivamente frontend. Un `rewrite` en
  `next.config.mjs` reenvía todo `/api/**` al servidor Express, así el navegador ve un solo origen y
  las cookies de sesión funcionan sin configurar CORS. Sigue siendo la app de captura del
  domiciliario (cámara, GPS) como **PWA** en el navegador del celular.
- **Backend:** `server/` — Express + `mysql2`, dueño único de la base de datos y de la sesión (JWT
  con `jose`, cookie `httpOnly`, bcrypt para contraseñas — mismo esquema de antes, reimplementado sin
  Next.js).
- **Base de datos:** MySQL (antes SQLite). El modelo de datos (entidades, relaciones, reglas de
  negocio) no cambió — sección 24 y `databases.plantuml` siguen siendo la fuente de verdad conceptual.
- **Backend anterior (Next.js + Prisma + SQLite):** archivado completo, sin borrar, en
  [`backend-legado-nextjs-prisma-sqlite/`](backend-legado-nextjs-prisma-sqlite/) en la raíz del repo,
  con instrucciones de cómo restaurarlo si hiciera falta volver atrás.

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

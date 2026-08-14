# Planificación base del proyecto de domicilios en Carepa

> **Nombre del proyecto:** Pendiente por definir
> **Ubicación:** Carepa, Antioquia
> **Tipo de sistema:** Gestión y administración de domicilios mediante aplicación web/móvil

---

## 1. Descripción general

El proyecto consiste en desarrollar un sistema para la gestión, seguimiento y control de domicilios realizados en Carepa.

El sistema permitirá registrar clientes, pedidos, ubicaciones, recorridos, pagos, entregas, abastecimiento de combustible y mantenimiento del vehículo utilizado para realizar los domicilios.

La aplicación contará con un **dashboard administrativo** que permitirá visualizar de manera resumida la información más importante del negocio y, posteriormente, acceder al detalle de cada operación.

Uno de los objetivos principales será reducir el tiempo empleado en cada domicilio mediante el almacenamiento de información de clientes, ubicaciones frecuentes, pedidos anteriores y rutas utilizadas.

---

# 2. Dashboard administrativo

El sistema contará con un panel administrativo principal donde se mostrará un resumen de las operaciones realizadas.

## Información principal

El dashboard deberá mostrar como mínimo:

* Cantidad de domicilios realizados durante el mes.
* Cantidad de domicilios realizados durante el día.
* Cantidad de domicilios realizados durante la semana.
* Kilómetros recorridos durante el mes.
* Cantidad de veces que se ha tanqueado el vehículo.
* Cliente con mayor cantidad de visitas.
* Cliente con mayor cantidad de pedidos.
* Cantidad de domicilios cancelados.
* Cantidad de domicilios pagados en efectivo.
* Cantidad de domicilios pagados mediante transferencia.
* Cantidad de domicilios entregados exitosamente.
* Cantidad de domicilios pendientes.
* Gastos relacionados con combustible.
* Gastos relacionados con mantenimiento del vehículo.

Cada indicador del dashboard deberá permitir acceder a una vista con información más detallada.

---

# 3. Módulo de domicilios

Este módulo permitirá registrar y consultar todos los domicilios realizados.

## Información de cada domicilio

Cada domicilio deberá almacenar información como:

* Identificador del domicilio.
* Fecha.
* Hora de inicio.
* Hora de entrega.
* Cliente.
* Número de teléfono.
* Dirección o ubicación.
* Coordenadas GPS.
* Productos solicitados.
* Valor del pedido.
* Método de pago.
* Estado del domicilio.
* Kilómetros recorridos.
* Observaciones.
* Ubicación registrada al momento de la entrega.

## Estados del domicilio

Se podrán manejar diferentes estados:

* Pendiente.
* En preparación.
* En camino.
* Entregado.
* Cancelado.
* No entregado.

---

# 4. Consulta de domicilios

El sistema permitirá consultar los domicilios realizados utilizando diferentes períodos de tiempo.

### Consulta diaria

Permitirá visualizar todos los domicilios realizados durante un día específico.

### Consulta semanal

Permitirá consultar los domicilios realizados durante una semana determinada.

### Consulta mensual

Permitirá consultar todos los domicilios realizados durante un mes.

La información podrá filtrarse por:

* Fecha.
* Cliente.
* Estado.
* Método de pago.
* Distancia recorrida.
* Domicilios exitosos.
* Domicilios cancelados.

También deberá permitir visualizar un resumen de:

* Domicilios en efectivo.
* Domicilios por transferencia.
* Total de domicilios.
* Total recaudado.
* Total de kilómetros recorridos.

---

# 5. Módulo de kilómetros recorridos

El sistema deberá registrar la distancia recorrida durante los domicilios.

Para cada domicilio se almacenará la información relacionada con el recorrido.

## Información

* Kilómetros recorridos.
* Cliente visitado.
* Fecha.
* Hora.
* Ubicación de origen.
* Ubicación de destino.
* Cantidad de visitas al cliente.
* Estado de entrega.

El sistema permitirá identificar:

* Cliente ubicado a mayor distancia.
* Cliente visitado con mayor frecuencia.
* Kilómetros totales recorridos.
* Promedio de kilómetros por domicilio.
* Kilómetros recorridos diariamente.
* Kilómetros recorridos semanalmente.
* Kilómetros recorridos mensualmente.

También se podrá determinar qué clientes generan una mayor cantidad de kilómetros recorridos.

---

# 6. Módulo de mantenimiento y combustible

Este módulo permitirá llevar el control del estado y los gastos relacionados con la moto utilizada para realizar los domicilios.

## Registro de tanqueos

Cada vez que se tanquee el vehículo se deberá registrar:

* Fecha.
* Kilometraje del vehículo.
* Cantidad de combustible.
* Valor pagado.
* Tipo de combustible.
* Estación de servicio.
* Kilómetros recorridos desde el tanqueo anterior.

Con esta información se podrá calcular aproximadamente:

* Kilómetros recorridos por tanque.
* Consumo promedio.
* Costo por kilómetro.
* Gasto mensual en combustible.
* Cantidad de tanqueos mensuales.

---

# 7. Registro de mantenimiento

Se deberá contar con un historial de mantenimiento del vehículo.

Cada mantenimiento podrá registrar:

* Fecha.
* Kilometraje.
* Tipo de mantenimiento.
* Descripción del trabajo realizado.
* Taller.
* Valor pagado.
* Repuestos utilizados.
* Compras adicionales.
* Observaciones.

Ejemplos:

* Cambio de aceite.
* Cambio de llantas.
* Reparación de frenos.
* Cambio de cadena.
* Reparaciones eléctricas.
* Reparaciones mecánicas.
* Compra de repuestos.
* Otros gastos necesarios para el funcionamiento de la moto.

El sistema permitirá consultar el gasto total de mantenimiento durante un período determinado.

---

# 8. Módulo de clientes

El registro de clientes utilizará principalmente el **número de teléfono como medio de identificación**.

Esto permitirá que, cuando un cliente vuelva a solicitar un domicilio, el sistema pueda encontrar rápidamente su información.

## Información del cliente

Se podrá almacenar:

* Nombre.
* Número de teléfono.
* Fecha de registro.
* Última visita.
* Cantidad total de pedidos.
* Cantidad de pedidos semanales.
* Cantidad de pedidos mensuales.
* Ubicaciones asociadas.
* Observaciones.

---

# 9. Múltiples ubicaciones por cliente

Un mismo cliente podrá tener varias ubicaciones registradas.

Esto será útil cuando una persona solicite domicilios desde diferentes lugares.

Por ejemplo:

```text
Cliente: Juan Pérez
Teléfono: 3000000000

Ubicaciones:

1. Casa
2. Trabajo
3. Universidad
4. Dirección adicional
```

Cada ubicación podrá tener:

* Nombre o descripción.
* Coordenadas GPS.
* Dirección.
* Fecha del último uso.
* Cantidad de domicilios realizados.
* Observaciones.

De esta manera, cuando el cliente vuelva a solicitar un domicilio, el sistema podrá mostrar sus ubicaciones anteriores y seleccionar rápidamente la correspondiente.

---

# 10. Geolocalización

El sistema deberá utilizar la ubicación GPS del dispositivo móvil para obtener una ubicación lo más precisa posible.

La ubicación podrá utilizarse principalmente en dos momentos:

### Durante el recorrido

Para registrar la ubicación y calcular el desplazamiento realizado.

### Al finalizar el domicilio

Cuando el domiciliario presione el botón **"Entregado"**, el sistema deberá solicitar la ubicación actual del dispositivo y almacenarla.

Esta ubicación podrá asociarse posteriormente con el cliente y su dirección.

Esto permitirá mejorar la precisión de futuras entregas.

---

# 11. Integración con mapas

Se plantea utilizar una API de mapas, como **Google Maps**, para facilitar la navegación.

El sistema podría permitir:

* Mostrar las ubicaciones guardadas del cliente.
* Seleccionar una ubicación anterior.
* Abrir la ubicación en Google Maps.
* Generar una ruta hacia el destino.
* Obtener coordenadas GPS.
* Calcular distancias.
* Calcular aproximadamente el recorrido.
* Utilizar ubicaciones almacenadas para futuros domicilios.

La integración con Google Maps deberá evaluarse posteriormente teniendo en cuenta las APIs disponibles, sus costos, límites de uso y las necesidades reales del proyecto.

También podrían evaluarse alternativas como OpenStreetMap u otros servicios de mapas.

---

# 12. Registro mediante comandas

El sistema deberá contemplar la posibilidad de utilizar la cámara del teléfono para digitalizar una comanda física.

La idea es que el domiciliario pueda tomar una fotografía de la comanda y que el sistema extraiga automáticamente la información relevante.

## Información que se intentará obtener

Por ejemplo:

* Nombre del cliente.
* Número de teléfono.
* Productos solicitados.
* Cantidades.
* Valor del pedido.
* Dirección.
* Observaciones.

Para esto se podría utilizar tecnología **OCR (Reconocimiento Óptico de Caracteres)**.

El sistema deberá mostrar la información extraída antes de guardarla para que el usuario pueda verificar y corregir cualquier dato que haya sido interpretado incorrectamente.

---

# 13. Uso de la cámara

La cámara del dispositivo podrá utilizarse de dos formas:

### Captura en tiempo real

El usuario podrá abrir la cámara directamente desde el sistema y escanear la comanda.

### Imagen almacenada

El usuario podrá seleccionar una fotografía previamente almacenada en el dispositivo.

El sistema procesará la imagen y extraerá los datos correspondientes.

---

# 14. Acciones rápidas para llamadas

Cuando el sistema obtenga el número telefónico del cliente, deberá proporcionar una acción para llamar directamente.

Por ejemplo:

```text
Cliente:
Juan Pérez

Teléfono:
3000000000

[ Llamar ]
```

Al presionar el botón **"Llamar"**, el sistema deberá utilizar la función de llamada del dispositivo para que el número aparezca listo para realizar la llamada.

Esto evitará tener que copiar manualmente el número.

---

# 15. Gestión de productos dentro del baúl

La moto cuenta con un baúl dividido en **tres espacios horizontales**.

El sistema deberá permitir organizar los productos de acuerdo con el espacio donde serán almacenados.

Por ejemplo:

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

El objetivo es reducir errores y evitar confundir los productos correspondientes a diferentes clientes.

---

# 16. Fotografía de los productos

Una vez registrada la comanda, el sistema podrá asociar los productos correspondientes al domicilio.

Opcionalmente, se podrá incorporar una fotografía del pedido antes de salir a realizar la entrega.

La información podría mostrar:

```text
DOMICILIO #001

Cliente:
Juan Pérez

Teléfono:
3000000000

Productos:
- Hamburguesa x2
- Gaseosa x2
- Papas x1

Ubicación:
Casa

Baúl:
Espacio 1

[ Ver pedido ]
[ Llamar ]
[ Iniciar ruta ]
```

La fotografía podría utilizarse como referencia visual para identificar rápidamente el pedido.

---

# 17. Proceso completo de un domicilio

El flujo principal del sistema podría funcionar de la siguiente manera:

```text
1. Recibir comanda
        ↓
2. Escanear comanda
        ↓
3. Extraer información mediante OCR
        ↓
4. Verificar información
        ↓
5. Buscar cliente por teléfono
        ↓
6. ¿Cliente existente?
        ↓
   ┌────┴────┐
   │         │
  SÍ        NO
   │         │
   ↓         ↓
Seleccionar  Crear
ubicación   cliente
   │         │
   └────┬────┘
        ↓
7. Registrar pedido
        ↓
8. Asignar ubicación
        ↓
9. Asignar espacio del baúl
        ↓
10. Iniciar domicilio
        ↓
11. Abrir navegación
        ↓
12. Llegar al destino
        ↓
13. Entregar producto
        ↓
14. Presionar "Entregado"
        ↓
15. Capturar ubicación GPS
        ↓
16. Registrar método de pago
        ↓
17. Guardar kilómetros recorridos
        ↓
18. Finalizar domicilio
```

---

# 18. Registro de entrega

Al momento de entregar el pedido, el domiciliario deberá contar con un botón:

**[ ENTREGADO ]**

Al presionarlo, el sistema deberá:

1. Obtener la ubicación GPS actual.
2. Registrar la fecha.
3. Registrar la hora.
4. Registrar el estado como "Entregado".
5. Guardar la ubicación.
6. Registrar el método de pago.
7. Registrar los kilómetros correspondientes.
8. Actualizar las estadísticas del dashboard.
9. Asociar la ubicación con el cliente.
10. Guardar la información para futuras entregas.

---

# 19. Historial de ubicaciones

Cuando se complete un domicilio, la ubicación obtenida podrá almacenarse como una nueva ubicación del cliente.

Si la ubicación ya existe, el sistema deberá evitar crear duplicados innecesarios.

Ejemplo:

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

Esto permitirá construir progresivamente una base de ubicaciones frecuentes.

---

# 20. Módulo de clientes frecuentes

El sistema deberá identificar automáticamente los clientes que tengan mayor interacción con el negocio.

Se podrán generar rankings como:

### Clientes con más pedidos

```text
1. Juan Pérez       35 pedidos
2. María Gómez      28 pedidos
3. Carlos López     21 pedidos
```

### Clientes más visitados

```text
1. Juan Pérez       35 visitas
2. María Gómez      28 visitas
3. Carlos López     21 visitas
```

### Clientes por semana

Permitirá conocer cuáles fueron los clientes con mayor cantidad de pedidos durante una semana.

### Clientes por mes

Permitirá conocer cuáles fueron los clientes con mayor cantidad de pedidos durante un mes.

---

# 21. Métodos de pago

Cada domicilio deberá permitir registrar el método de pago.

Opciones iniciales:

* Efectivo.
* Transferencia.
* Otro.

El dashboard podrá mostrar:

```text
Domicilios del mes

Total:              150
Efectivo:            90
Transferencia:       60
Cancelados:           8
Entregados:          142
```

También será posible calcular el dinero recibido por cada método de pago.

---

# 22. Estadísticas generales

Con toda la información almacenada, el sistema podrá generar estadísticas como:

* Total de domicilios.
* Total de domicilios por día.
* Total de domicilios por semana.
* Total de domicilios por mes.
* Total de kilómetros.
* Promedio de kilómetros por domicilio.
* Cliente más visitado.
* Cliente con mayor número de pedidos.
* Total de combustible utilizado.
* Total gastado en combustible.
* Total gastado en mantenimiento.
* Total recibido en efectivo.
* Total recibido por transferencia.
* Domicilios cancelados.
* Domicilios exitosos.

---

# 23. Posible estructura de módulos

El sistema podría dividirse inicialmente en los siguientes módulos:

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
├── Comandas
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

---

# 24. Objetivo principal

El objetivo del proyecto será crear una herramienta que permita **centralizar y automatizar la gestión de domicilios**, reduciendo el tiempo necesario para registrar clientes, buscar ubicaciones, realizar llamadas, organizar pedidos y completar entregas.

Además, el sistema permitirá generar información histórica para conocer el comportamiento del negocio y tomar decisiones basadas en datos.

La información recopilada permitirá conocer:

* Cuántos domicilios se realizan.
* Cuáles son los clientes más frecuentes.
* Cuánto se recorre diariamente.
* Cuánto se gasta en combustible.
* Cuánto se gasta en mantenimiento.
* Cuáles son las ubicaciones más utilizadas.
* Qué métodos de pago son más frecuentes.
* Cuáles son los clientes que generan mayor cantidad de domicilios.
* Cuál es el rendimiento aproximado del vehículo.

---

# 25. Funcionalidades futuras

Una vez implementada la versión inicial, se podrían agregar funcionalidades adicionales:

* Optimización automática de rutas.
* Agrupación de varios domicilios cercanos.
* Historial completo del cliente.
* Notificaciones.
* Reportes gráficos.
* Exportación a Excel o PDF.
* Control de ingresos y gastos.
* Predicción de combustible necesario.
* Alertas de mantenimiento.
* Sistema de usuarios y permisos.
* Copias de seguridad.
* Aplicación móvil.
* Integración con servicios de mapas.
* Lectura avanzada de comandas mediante inteligencia artificial.
* Reconocimiento automático de productos.
* Cálculo automático de distancia mediante GPS.
* Control de tiempo por domicilio.

---

# 26. Consideraciones técnicas

Para la implementación se deberán evaluar diferentes tecnologías para cada funcionalidad.

Entre ellas:

* Base de datos para clientes, domicilios, ubicaciones y mantenimiento.
* GPS del dispositivo móvil.
* API de mapas y navegación.
* Servicio de OCR para lectura de comandas.
* Cámara del dispositivo.
* Sistema de llamadas telefónicas.
* Sistema de autenticación para usuarios administrativos.
* Sistema de almacenamiento de fotografías.
* Sistema de generación de estadísticas y gráficos.

Antes de seleccionar servicios externos como Google Maps, se deberá revisar la disponibilidad de las APIs necesarias, costos, límites de uso y condiciones actuales del servicio.

---

# 27. Prioridad de desarrollo

Para evitar intentar construir todo el sistema al mismo tiempo, se recomienda dividir el proyecto en etapas.

## Fase 1 — Base del sistema

* Registro de clientes.
* Registro de domicilios.
* Número telefónico como identificador.
* Registro de ubicaciones.
* Métodos de pago.
* Estados de domicilio.
* Dashboard básico.

## Fase 2 — Geolocalización

* Captura GPS.
* Registro de ubicación al entregar.
* Historial de ubicaciones.
* Cálculo de kilómetros.
* Integración con mapas.

## Fase 3 — Control del vehículo

* Registro de tanqueos.
* Cálculo de consumo.
* Registro de mantenimiento.
* Gastos del vehículo.

## Fase 4 — Comandas

* Cámara.
* Carga de fotografías.
* OCR.
* Extracción de teléfono y datos del pedido.
* Verificación de información.

## Fase 5 — Organización de pedidos

* Organización de pedidos dentro del baúl.
* Tres espacios disponibles.
* Fotografía de pedidos.
* Identificación rápida del domicilio.

## Fase 6 — Reportes

* Reportes diarios.
* Reportes semanales.
* Reportes mensuales.
* Estadísticas de clientes.
* Estadísticas de kilómetros.
* Estadísticas de combustible.
* Estadísticas de mantenimiento.

## Fase 7 — Optimización

* Rutas optimizadas.
* Clientes frecuentes.
* Ubicaciones favoritas.
* Automatización de procesos.
* Predicciones y recomendaciones.
* Mejoras de rendimiento.

---

# 28. Resultado esperado

Al finalizar el desarrollo se espera contar con un sistema capaz de administrar el proceso completo de un domicilio, desde la recepción de la comanda hasta la entrega del producto.

El sistema deberá permitir que el domiciliario pueda:

**Recibir → Escanear → Registrar → Ubicar → Organizar → Navegar → Entregar → Confirmar → Guardar ubicación → Actualizar estadísticas.**

Mientras tanto, el administrador podrá consultar toda la información histórica del negocio mediante un dashboard centralizado.

De esta manera, el proyecto no solamente funcionará como un sistema para registrar domicilios, sino como una herramienta para **gestionar, analizar y optimizar el funcionamiento del servicio de domicilios en Carepa**.

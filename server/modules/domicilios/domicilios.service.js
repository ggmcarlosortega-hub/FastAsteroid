const crypto = require("crypto");
const { pool } = require("../../db/pool");
const { ServiceError } = require("../../lib/service-error");
const { haversineKm } = require("../../lib/haversine");
const { emitCambio } = require("../../lib/realtime");
const inventarioService = require("../inventario/inventario.service");

// El baúl físico tiene 3 secciones con 3 espacios cada una (ver imagenes/Baul.png
// en la raíz del repo) — 9 espacios en total, numerados 1-9. Mantener sincronizado
// con Fasteroid/modules/domicilios/components/EspacioBaulSelector.js y con el
// CHECK de la columna espacio_baul en db/schema.sql.
const ESPACIOS_VALIDOS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const METODOS_PAGO_VALIDOS = ["Efectivo", "Transferencia", "Ambos"];
// Debajo de esto, la ubicación GPS capturada al entregar se considera "la misma"
// que una ya guardada del cliente (evita duplicados, sección 22 del documento).
const UMBRAL_UBICACION_DUPLICADA_KM = 0.1;

// Se listan explícitamente las columnas de domicilio (en vez de d.*) para no
// exponer espacio_activo, que es un detalle interno de MySQL (ver schema.sql) sin
// equivalente en el modelo de datos original.
const SELECT_CON_RELACIONES = `
  SELECT
    d.id_domicilio, d.telefono_cliente, d.telefono_domiciliario, d.id_ubicacion,
    d.productos, d.precio, d.fecha_hora_creacion, d.fecha_hora_entrega,
    d.valor_recaudado, d.valor_efectivo, d.valor_transferencia, d.metodo_pago,
    d.estado, d.distancia_km, d.latitud_recogida, d.longitud_recogida, d.espacio_baul,
    d.foto_productos_url, d.motivo_cancelacion,
    c.telefono AS c_telefono, c.nombre AS c_nombre, c.fecha_primer_registro AS c_fecha_primer_registro,
    u.id_ubicacion AS u_id_ubicacion, u.telefono_cliente AS u_telefono_cliente,
    u.latitud AS u_latitud, u.longitud AS u_longitud, u.alias_direccion AS u_alias_direccion,
    m.id_municipio AS m_id_municipio, m.nombre AS m_nombre, m.recargo_domicilio AS m_recargo_domicilio,
    dom.telefono AS dom_telefono, dom.nombre AS dom_nombre
  FROM domicilio d
  JOIN cliente c ON c.telefono = d.telefono_cliente
  JOIN ubicacion u ON u.id_ubicacion = d.id_ubicacion
  LEFT JOIN municipio m ON m.id_municipio = u.id_municipio
  LEFT JOIN usuario dom ON dom.telefono = d.telefono_domiciliario
`;

// DECIMAL vuelve como string desde mysql2 (para no perder precisión sin que lo
// pidas) — hay que convertir precio/valor_recaudado a Number explícitamente, si no
// el frontend termina concatenando strings donde esperaba sumar dinero.
function hydrate(row) {
  return {
    id_domicilio: row.id_domicilio,
    telefono_cliente: row.telefono_cliente,
    telefono_domiciliario: row.telefono_domiciliario,
    id_ubicacion: row.id_ubicacion,
    productos: row.productos,
    precio: Number(row.precio),
    fecha_hora_creacion: row.fecha_hora_creacion,
    fecha_hora_entrega: row.fecha_hora_entrega,
    valor_recaudado: row.valor_recaudado != null ? Number(row.valor_recaudado) : null,
    valor_efectivo: row.valor_efectivo != null ? Number(row.valor_efectivo) : null,
    valor_transferencia: row.valor_transferencia != null ? Number(row.valor_transferencia) : null,
    metodo_pago: row.metodo_pago,
    estado: row.estado,
    distancia_km: row.distancia_km,
    latitud_recogida: row.latitud_recogida,
    longitud_recogida: row.longitud_recogida,
    espacio_baul: row.espacio_baul,
    foto_productos_url: row.foto_productos_url,
    motivo_cancelacion: row.motivo_cancelacion,
    cliente: {
      telefono: row.c_telefono,
      nombre: row.c_nombre,
      fecha_primer_registro: row.c_fecha_primer_registro,
    },
    ubicacion: {
      id_ubicacion: row.u_id_ubicacion,
      telefono_cliente: row.u_telefono_cliente,
      latitud: row.u_latitud,
      longitud: row.u_longitud,
      alias_direccion: row.u_alias_direccion,
      municipio: row.m_id_municipio
        ? { id_municipio: row.m_id_municipio, nombre: row.m_nombre, recargo_domicilio: Number(row.m_recargo_domicilio) }
        : null,
    },
    // NULL mientras el domicilio está en la lista de espera compartida, sin tomar
    // todavía por ningún domiciliario (ver comentario de la tabla en schema.sql).
    domiciliario: row.dom_telefono ? { telefono: row.dom_telefono, nombre: row.dom_nombre } : null,
  };
}

async function getDomicilioPorId(id, runner = pool) {
  const [rows] = await runner.execute(`${SELECT_CON_RELACIONES} WHERE d.id_domicilio = ?`, [id]);
  return rows[0] ? hydrate(rows[0]) : null;
}

async function getDomicilio(id, { telefono, rol }) {
  const domicilio = await getDomicilioPorId(id);
  if (!domicilio) {
    throw new ServiceError("Domicilio no encontrado", 404);
  }
  if (rol !== "Admin" && domicilio.telefono_domiciliario !== telefono) {
    throw new ServiceError("No autorizado", 403);
  }
  return domicilio;
}

async function listActivos(telefonoDomiciliario) {
  const [rows] = await pool.execute(
    `${SELECT_CON_RELACIONES} WHERE d.telefono_domiciliario = ? AND d.estado = 'En_curso' ORDER BY d.fecha_hora_creacion ASC`,
    [telefonoDomiciliario]
  );
  return rows.map(hydrate);
}

// Vista de Admin: todos los domicilios en curso, de cualquier domiciliario.
async function listActivosTodos() {
  const [rows] = await pool.execute(
    `${SELECT_CON_RELACIONES} WHERE d.estado = 'En_curso' ORDER BY d.fecha_hora_creacion ASC`
  );
  return rows.map(hydrate);
}

// Lista de espera compartida: domicilios que el Admin creó pero que todavía no toma
// ningún domiciliario. Es la misma lista para el Admin y para cualquier domiciliario —
// "cualquiera lo toma primero" (ver recogerDomicilio). El filtro por NULL es
// defensivo: por diseño todo domicilio 'Asignado' debería tener telefono_domiciliario
// NULL, pero protege contra datos viejos de antes de este cambio.
async function listAsignadosTodos() {
  const [rows] = await pool.execute(
    `${SELECT_CON_RELACIONES} WHERE d.estado = 'Asignado' AND d.telefono_domiciliario IS NULL ORDER BY d.fecha_hora_creacion ASC`
  );
  return rows.map(hydrate);
}

// Versión liviana para el selector de "a quién asignar" — un domiciliario
// desactivado no debe poder recibir domicilios nuevos, pero sí puede seguir
// entregando los que ya tenía en curso (por eso el desactivar no toca eso).
async function listDomiciliarios() {
  const [rows] = await pool.execute(
    "SELECT telefono, nombre FROM usuario WHERE rol = 'Domiciliario' AND activo = TRUE ORDER BY nombre ASC"
  );
  return rows;
}

// Lista completa (activos e inactivos) con el total histórico recaudado por
// cada domiciliario, para la pantalla "Domiciliarios" del Admin.
async function listDomiciliariosConTotales() {
  const [rows] = await pool.execute(
    `SELECT u.telefono, u.nombre, u.activo,
            COALESCE(SUM(d.valor_efectivo), 0) AS total_efectivo,
            COALESCE(SUM(d.valor_transferencia), 0) AS total_transferencia
     FROM usuario u
     LEFT JOIN domicilio d ON d.telefono_domiciliario = u.telefono AND d.estado = 'Entregado'
     WHERE u.rol = 'Domiciliario'
     GROUP BY u.telefono, u.nombre, u.activo
     ORDER BY u.nombre ASC`
  );
  return rows.map((row) => ({
    telefono: row.telefono,
    nombre: row.nombre,
    activo: !!row.activo,
    total_efectivo: Number(row.total_efectivo),
    total_transferencia: Number(row.total_transferencia),
  }));
}

async function setActivoDomiciliario(telefono, activo) {
  const [result] = await pool.execute(
    "UPDATE usuario SET activo = ? WHERE telefono = ? AND rol = 'Domiciliario'",
    [!!activo, telefono]
  );
  if (result.affectedRows === 0) {
    throw new ServiceError("Domiciliario no encontrado", 404);
  }
  emitCambio("domiciliarios:changed");
}

async function listHistorial({ telefonoDomiciliario, desde, hasta, estado } = {}) {
  const conditions = [];
  const params = [];

  if (estado) {
    conditions.push("d.estado = ?");
    params.push(estado);
  } else {
    conditions.push("d.estado IN ('Entregado', 'Cancelado')");
  }
  if (telefonoDomiciliario) {
    conditions.push("d.telefono_domiciliario = ?");
    params.push(telefonoDomiciliario);
  }
  if (desde) {
    conditions.push("d.fecha_hora_creacion >= ?");
    params.push(new Date(desde));
  }
  if (hasta) {
    conditions.push("d.fecha_hora_creacion <= ?");
    params.push(new Date(hasta));
  }

  const where = `WHERE ${conditions.join(" AND ")}`;
  const [rows] = await pool.execute(
    `${SELECT_CON_RELACIONES} ${where} ORDER BY d.fecha_hora_creacion DESC`,
    params
  );
  return rows.map(hydrate);
}

// Valida las líneas de producto elegidas del catálogo ([{id_producto, cantidad}])
// y devuelve tanto las líneas resueltas (con precio_unitario congelado al momento de
// la venta) como el texto de despliegue que se guarda en domicilio.productos, para
// que toda la UI que ya muestra ese campo siga funcionando sin cambios.
async function resolverLineasProductos(productosLineas) {
  if (!Array.isArray(productosLineas) || productosLineas.length === 0) {
    throw new ServiceError("Elige al menos un producto", 400);
  }

  const lineas = [];
  for (const linea of productosLineas) {
    const id_producto = linea?.id_producto;
    const cantidad = Number(linea?.cantidad);
    if (!id_producto || !Number.isInteger(cantidad) || cantidad <= 0) {
      throw new ServiceError("Cada producto necesita una cantidad válida", 400);
    }

    const [rows] = await pool.execute(
      "SELECT id_producto, nombre, precio_venta, activo FROM producto WHERE id_producto = ?",
      [id_producto]
    );
    const producto = rows[0];
    if (!producto || !producto.activo) {
      throw new ServiceError("Uno de los productos elegidos ya no está disponible", 400);
    }

    lineas.push({
      id_producto,
      cantidad,
      precio_unitario: Number(producto.precio_venta),
      nombre: producto.nombre,
    });
  }

  // No se puede vender más de lo que hay en existencia (comprado - vendido, mismo
  // cálculo que la pantalla de Inventario). Se suma por id_producto por si el
  // catálogo trae la misma línea repetida, para no dejar pasar el total.
  const disponibleMap = await inventarioService.getDisponibleMap();
  const cantidadPorProducto = new Map();
  for (const l of lineas) {
    cantidadPorProducto.set(l.id_producto, (cantidadPorProducto.get(l.id_producto) ?? 0) + l.cantidad);
  }
  for (const [id_producto, cantidadPedida] of cantidadPorProducto) {
    const disponible = disponibleMap.get(id_producto) ?? 0;
    if (cantidadPedida > disponible) {
      const nombre = lineas.find((l) => l.id_producto === id_producto).nombre;
      throw new ServiceError(`Solo quedan ${Math.max(disponible, 0)} unidades de "${nombre}"`, 400);
    }
  }

  const productos = lineas.map((l) => `${l.cantidad}x ${l.nombre}`).join(", ");
  return { productos, lineas };
}

async function insertarLineasProducto(id_domicilio, lineas) {
  for (const linea of lineas) {
    await pool.execute(
      `INSERT INTO domicilio_producto (id_domicilio_producto, id_domicilio, id_producto, cantidad, precio_unitario)
       VALUES (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), id_domicilio, linea.id_producto, linea.cantidad, linea.precio_unitario]
    );
  }
}

// Cuando lo crea el Admin (creadoPorAdmin=true), queda "Asignado" SIN domiciliario ni
// espacio de baúl — entra a la lista de espera compartida, y cualquier domiciliario
// disponible lo toma después con recogerDomicilio(). Cuando lo crea el propio
// domiciliario, lo tiene en mano de una vez y elige el espacio ahí mismo, arrancando
// directo en "En_curso" como antes.
async function crearDomicilio(telefonoDomiciliario, data, { creadoPorAdmin = false } = {}) {
  const telefono_cliente = data.telefono_cliente?.trim();
  const id_ubicacion = data.id_ubicacion?.trim();
  const precio = Number(data.precio);
  const foto_productos_url = data.foto_productos_url ?? null;

  // El domiciliario (propio) siempre viene de su sesión y sigue siendo obligatorio acá.
  // Cuando lo crea el Admin, en cambio, ya no elige a nadie.
  if (!creadoPorAdmin && !telefonoDomiciliario) {
    throw new ServiceError("telefono_domiciliario es obligatorio", 400);
  }
  if (!telefono_cliente || !id_ubicacion) {
    throw new ServiceError("cliente y ubicación son obligatorios", 400);
  }
  if (!Number.isFinite(precio) || precio <= 0) {
    throw new ServiceError("precio debe ser mayor a 0", 400);
  }
  if (!foto_productos_url) {
    throw new ServiceError("La foto del pedido es obligatoria", 400);
  }

  const { productos, lineas } = await resolverLineasProductos(data.productos_lineas);

  if (!creadoPorAdmin) {
    const [domiciliarioRows] = await pool.execute("SELECT rol FROM usuario WHERE telefono = ?", [
      telefonoDomiciliario,
    ]);
    if (!domiciliarioRows[0] || domiciliarioRows[0].rol !== "Domiciliario") {
      throw new ServiceError("El domiciliario indicado no existe", 400);
    }
  }

  const [ubicacionRows] = await pool.execute(
    "SELECT telefono_cliente FROM ubicacion WHERE id_ubicacion = ?",
    [id_ubicacion]
  );
  if (!ubicacionRows[0] || ubicacionRows[0].telefono_cliente !== telefono_cliente) {
    throw new ServiceError("La ubicación no pertenece a ese cliente", 400);
  }

  const id_domicilio = crypto.randomUUID();

  if (creadoPorAdmin) {
    // telefono_domiciliario queda NULL (columna omitida) — entra a la lista de
    // espera compartida, sin nadie asignado todavía.
    await pool.execute(
      `INSERT INTO domicilio
         (id_domicilio, telefono_cliente, id_ubicacion, productos, precio, estado, foto_productos_url)
       VALUES (?, ?, ?, ?, ?, 'Asignado', ?)`,
      [id_domicilio, telefono_cliente, id_ubicacion, productos, precio, foto_productos_url]
    );
    await insertarLineasProducto(id_domicilio, lineas);
    emitCambio("domicilios:changed");
    return getDomicilioPorId(id_domicilio);
  }

  const espacio_baul = Number(data.espacio_baul);
  if (!ESPACIOS_VALIDOS.includes(espacio_baul)) {
    throw new ServiceError(`espacio_baul debe estar entre 1 y ${ESPACIOS_VALIDOS.length}`, 400);
  }

  // Punto de partida para calcular distancia_km al entregar (Parte 1 del cambio de
  // hoy) — obligatorio igual que la foto: sin esto no hay cómo calcular la
  // distancia recorrida más adelante.
  const latitudRecogida = Number(data.ubicacion_recogida?.latitud);
  const longitudRecogida = Number(data.ubicacion_recogida?.longitud);
  if (!Number.isFinite(latitudRecogida) || !Number.isFinite(longitudRecogida)) {
    throw new ServiceError(
      "No se pudo capturar tu ubicación GPS. Actívala e intenta de nuevo",
      400
    );
  }

  const activos = await listActivos(telefonoDomiciliario);
  if (activos.length >= ESPACIOS_VALIDOS.length) {
    throw new ServiceError(
      `Ya tienes ${ESPACIOS_VALIDOS.length} domicilios en curso (máximo por carga)`,
      409
    );
  }
  if (activos.some((d) => d.espacio_baul === espacio_baul)) {
    throw new ServiceError(`El espacio ${espacio_baul} del baúl ya está ocupado`, 409);
  }

  try {
    await pool.execute(
      `INSERT INTO domicilio
         (id_domicilio, telefono_cliente, telefono_domiciliario, id_ubicacion, productos, precio, espacio_baul, foto_productos_url, latitud_recogida, longitud_recogida)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_domicilio,
        telefono_cliente,
        telefonoDomiciliario,
        id_ubicacion,
        productos,
        precio,
        espacio_baul,
        foto_productos_url,
        latitudRecogida,
        longitudRecogida,
      ]
    );
  } catch (err) {
    // Red de seguridad a nivel de base de datos contra la condición de carrera que
    // el chequeo de arriba (SELECT activos, después INSERT) no cubre del todo: el
    // índice único domicilio_espacio_activo_unico (ver schema.sql) es quien
    // realmente garantiza que dos solicitudes simultáneas no ocupen el mismo
    // espacio — acá solo se traduce ER_DUP_ENTRY (1062) al mensaje del usuario.
    if (err.code === "ER_DUP_ENTRY") {
      throw new ServiceError("Ese espacio del baúl ya está ocupado por otro domicilio en curso", 409);
    }
    throw err;
  }

  await insertarLineasProducto(id_domicilio, lineas);
  emitCambio("domicilios:changed");
  return getDomicilioPorId(id_domicilio);
}

// El domiciliario toma un domicilio de la lista de espera compartida (creada por el
// Admin, sin nadie asignado todavía) y ahí mismo elige en qué espacio del baúl lo
// lleva — solo entonces pasa a "En_curso" y queda fijado a él. "Recoger" es, en la
// práctica, la acción de "tomar" de la lista de espera.
async function recogerDomicilio(id, telefonoDomiciliario, data) {
  const [rows] = await pool.execute("SELECT * FROM domicilio WHERE id_domicilio = ?", [id]);
  const domicilio = rows[0];
  if (!domicilio) {
    throw new ServiceError("Domicilio no encontrado", 404);
  }
  // Ya no se asigna a un domiciliario específico al crearlo — cualquiera disponible
  // puede tomar uno de la lista de espera (telefono_domiciliario queda NULL hasta que
  // alguien lo toma). Si ya tiene domiciliario, otro se adelantó.
  if (domicilio.telefono_domiciliario != null) {
    throw new ServiceError("Ese domicilio ya fue tomado por otro domiciliario", 409);
  }
  if (domicilio.estado !== "Asignado") {
    throw new ServiceError("Ese domicilio ya fue recogido o cerrado", 409);
  }

  const [domiciliarioRows] = await pool.execute("SELECT activo FROM usuario WHERE telefono = ?", [
    telefonoDomiciliario,
  ]);
  if (!domiciliarioRows[0]?.activo) {
    throw new ServiceError("Tu cuenta está desactivada — no puedes tomar domicilios nuevos", 403);
  }

  const espacio_baul = Number(data.espacio_baul);
  if (!ESPACIOS_VALIDOS.includes(espacio_baul)) {
    throw new ServiceError(`espacio_baul debe estar entre 1 y ${ESPACIOS_VALIDOS.length}`, 400);
  }

  // Mismo punto de partida que en crearDomicilio — acá es donde estaba el
  // domiciliario al recoger un domicilio que le asignó el Admin.
  const latitudRecogida = Number(data.ubicacion_recogida?.latitud);
  const longitudRecogida = Number(data.ubicacion_recogida?.longitud);
  if (!Number.isFinite(latitudRecogida) || !Number.isFinite(longitudRecogida)) {
    throw new ServiceError(
      "No se pudo capturar tu ubicación GPS. Actívala e intenta de nuevo",
      400
    );
  }

  const activos = await listActivos(telefonoDomiciliario);
  if (activos.length >= ESPACIOS_VALIDOS.length) {
    throw new ServiceError(
      `Ya tienes ${ESPACIOS_VALIDOS.length} domicilios en curso (máximo por carga)`,
      409
    );
  }
  if (activos.some((d) => d.espacio_baul === espacio_baul)) {
    throw new ServiceError(`El espacio ${espacio_baul} del baúl ya está ocupado`, 409);
  }

  try {
    // La condición telefono_domiciliario IS NULL en el WHERE es lo que hace el
    // "tomar" atómico: si dos domiciliarios llegan casi al mismo tiempo, el UPDATE
    // del segundo en llegar afecta 0 filas (el primero ya lo cerró) — MySQL bloquea
    // la fila durante cada UPDATE, así que no hay ventana real entre "consultar" y
    // "guardar" como si fueran dos pasos separados.
    const [result] = await pool.execute(
      `UPDATE domicilio
       SET telefono_domiciliario = ?, estado = 'En_curso', espacio_baul = ?,
           latitud_recogida = ?, longitud_recogida = ?
       WHERE id_domicilio = ? AND telefono_domiciliario IS NULL AND estado = 'Asignado'`,
      [telefonoDomiciliario, espacio_baul, latitudRecogida, longitudRecogida, id]
    );
    if (result.affectedRows === 0) {
      throw new ServiceError("Ese domicilio ya fue tomado por otro domiciliario", 409);
    }
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ServiceError("Ese espacio del baúl ya está ocupado por otro domicilio en curso", 409);
    }
    throw err;
  }

  emitCambio("domicilios:changed");
  return getDomicilioPorId(id);
}

// El Admin corrige productos/precio de un domicilio ya creado, por ejemplo si se
// equivocó al seleccionar los productos (sección 4 del documento).
async function actualizarDomicilio(id, data) {
  const [rows] = await pool.execute("SELECT id_domicilio FROM domicilio WHERE id_domicilio = ?", [id]);
  if (!rows[0]) {
    throw new ServiceError("Domicilio no encontrado", 404);
  }

  const productos = data.productos?.trim();
  const precio = Number(data.precio);
  if (!productos) {
    throw new ServiceError("productos es obligatorio", 400);
  }
  if (!Number.isFinite(precio) || precio <= 0) {
    throw new ServiceError("precio debe ser mayor a 0", 400);
  }

  await pool.execute("UPDATE domicilio SET productos = ?, precio = ? WHERE id_domicilio = ?", [
    productos,
    precio,
    id,
  ]);
  emitCambio("domicilios:changed");
  return getDomicilioPorId(id);
}

async function getDomicilioActivoDeDomiciliario(id, telefonoDomiciliario) {
  const [rows] = await pool.execute("SELECT * FROM domicilio WHERE id_domicilio = ?", [id]);
  const domicilio = rows[0];
  if (!domicilio) {
    throw new ServiceError("Domicilio no encontrado", 404);
  }
  if (domicilio.telefono_domiciliario !== telefonoDomiciliario) {
    throw new ServiceError("No autorizado", 403);
  }
  if (domicilio.estado !== "En_curso") {
    throw new ServiceError("Ese domicilio ya fue cerrado", 409);
  }
  return domicilio;
}

// Al entregar, la ubicación GPS real del domiciliario reemplaza la asignada al
// crear el domicilio (por el Admin o el propio cliente): en la práctica el cliente
// muchas veces no tiene clara su ubicación exacta y el Admin puede equivocarse por
// la rapidez con la que asigna — el punto donde realmente se hizo la entrega es la
// fuente de verdad. Si coincide (Haversine) con una ubicación ya guardada del
// cliente, el domicilio simplemente queda apuntando a esa. Si no coincide con
// ninguna, hace falta un nombre para crear la ubicación nueva — si todavía no
// llegó (primer intento, antes de mostrarle el segundo panel al domiciliario), se
// corta acá con un error distinguible en vez de crear algo o cerrar el domicilio.
// `conn` es la conexión de la transacción de marcarEntregado (no el pool general):
// si el UPDATE del domicilio falla después de crear la ubicación, el rollback de
// la transacción también deshace esa ubicación nueva, en vez de dejarla huérfana.
async function resolverUbicacionEntrega(conn, telefonoCliente, ubicacionEntrega, nombreLugar) {
  const [ubicaciones] = await conn.execute("SELECT * FROM ubicacion WHERE telefono_cliente = ?", [
    telefonoCliente,
  ]);

  const existente = ubicaciones.find(
    (u) => haversineKm(u, ubicacionEntrega) <= UMBRAL_UBICACION_DUPLICADA_KM
  );
  if (existente) {
    return { id_ubicacion: existente.id_ubicacion, esNueva: false };
  }

  if (!nombreLugar?.trim()) {
    throw new ServiceError(
      "Esta ubicación no coincide con ninguna guardada del cliente. Indica el nombre del lugar",
      409,
      { requiereNombreLugar: true }
    );
  }

  const id_ubicacion = crypto.randomUUID();
  await conn.execute(
    "INSERT INTO ubicacion (id_ubicacion, telefono_cliente, latitud, longitud, alias_direccion) VALUES (?, ?, ?, ?, ?)",
    [id_ubicacion, telefonoCliente, ubicacionEntrega.latitud, ubicacionEntrega.longitud, nombreLugar.trim()]
  );
  return { id_ubicacion, esNueva: true };
}

async function marcarEntregado(id, telefonoDomiciliario, data) {
  const domicilioActivo = await getDomicilioActivoDeDomiciliario(id, telefonoDomiciliario);

  const metodo_pago = data.metodo_pago;
  if (!METODOS_PAGO_VALIDOS.includes(metodo_pago)) {
    throw new ServiceError("metodo_pago inválido", 400);
  }

  // "Ambos" reparte el cobro entre efectivo y transferencia — el total sale de
  // sumar las dos partes, no se confía en un valor_recaudado aparte (así no puede
  // quedar descuadrado). Para un solo método, el monto completo va a esa columna
  // y la otra queda en 0 — así cualquier reporte que sume valor_efectivo/
  // valor_transferencia (desglose del Admin, barra del domiciliario) no necesita
  // casos especiales según el método.
  let valor_efectivo;
  let valor_transferencia;
  if (metodo_pago === "Ambos") {
    valor_efectivo = Number(data.valor_efectivo);
    valor_transferencia = Number(data.valor_transferencia);
    if (
      !Number.isFinite(valor_efectivo) ||
      valor_efectivo <= 0 ||
      !Number.isFinite(valor_transferencia) ||
      valor_transferencia <= 0
    ) {
      throw new ServiceError("Indica cuánto se pagó en efectivo y cuánto por transferencia", 400);
    }
  } else {
    const valorRecaudadoInput = Number(data.valor_recaudado);
    if (!Number.isFinite(valorRecaudadoInput) || valorRecaudadoInput <= 0) {
      throw new ServiceError("valor_recaudado debe ser mayor a 0", 400);
    }
    valor_efectivo = metodo_pago === "Efectivo" ? valorRecaudadoInput : 0;
    valor_transferencia = metodo_pago === "Transferencia" ? valorRecaudadoInput : 0;
  }
  const valor_recaudado = valor_efectivo + valor_transferencia;

  const latitudEntrega = Number(data.ubicacion_entrega?.latitud);
  const longitudEntrega = Number(data.ubicacion_entrega?.longitud);
  if (!Number.isFinite(latitudEntrega) || !Number.isFinite(longitudEntrega)) {
    throw new ServiceError(
      "No se pudo capturar tu ubicación GPS. Activa la ubicación e intenta de nuevo",
      400
    );
  }
  const ubicacionEntrega = { latitud: latitudEntrega, longitud: longitudEntrega };

  // Distancia real: Haversine entre el punto de partida guardado al recoger/crear
  // el domicilio (crearDomicilio/recogerDomicilio) y el punto de llegada de acá —
  // ya no se confía en ningún valor mandado por el cliente (antes venía de un
  // tracking en vivo con watchPosition, poco confiable con pantalla bloqueada).
  // Si el domicilio no tiene punto de partida guardado (uno que ya estaba en
  // curso antes de este cambio), la distancia queda NULL en vez de fallar la
  // entrega.
  const distancia_km =
    domicilioActivo.latitud_recogida != null && domicilioActivo.longitud_recogida != null
      ? haversineKm(
          { latitud: domicilioActivo.latitud_recogida, longitud: domicilioActivo.longitud_recogida },
          ubicacionEntrega
        )
      : null;

  // Transacción explícita: si el UPDATE del domicilio falla después de haber
  // creado una ubicación nueva, el rollback deshace ambas cosas — no queda una
  // ubicación "huérfana" sin domicilio que la haya usado.
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { id_ubicacion: idUbicacionEntrega, esNueva } = await resolverUbicacionEntrega(
      conn,
      domicilioActivo.telefono_cliente,
      ubicacionEntrega,
      data.nombre_lugar
    );

    await conn.execute(
      `UPDATE domicilio
       SET estado = 'Entregado', fecha_hora_entrega = NOW(), metodo_pago = ?,
           valor_recaudado = ?, valor_efectivo = ?, valor_transferencia = ?,
           distancia_km = ?, id_ubicacion = ?
       WHERE id_domicilio = ?`,
      [metodo_pago, valor_recaudado, valor_efectivo, valor_transferencia, distancia_km, idUbicacionEntrega, id]
    );

    await conn.commit();

    emitCambio("domicilios:changed");
    // resolverUbicacionEntrega puede haber creado una ubicación nueva para el
    // cliente (ver arriba) — ClienteDetallePage.js también necesita enterarse.
    if (esNueva) emitCambio("clientes:changed");

    const domicilio = await getDomicilioPorId(id);
    return {
      ...domicilio,
      ubicacionNueva: esNueva,
      ubicacionActualizada: idUbicacionEntrega !== domicilioActivo.id_ubicacion,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function marcarCancelado(id, telefonoDomiciliario, data) {
  await getDomicilioActivoDeDomiciliario(id, telefonoDomiciliario);

  const motivo_cancelacion = data.motivo_cancelacion?.trim();
  if (!motivo_cancelacion) {
    throw new ServiceError("El motivo de cancelación es obligatorio", 400);
  }

  await pool.execute(
    "UPDATE domicilio SET estado = 'Cancelado', fecha_hora_entrega = NOW(), motivo_cancelacion = ? WHERE id_domicilio = ?",
    [motivo_cancelacion, id]
  );
  emitCambio("domicilios:changed");
  return getDomicilioPorId(id);
}

module.exports = {
  getDomicilio,
  listActivos,
  listActivosTodos,
  listAsignadosTodos,
  listDomiciliarios,
  listDomiciliariosConTotales,
  setActivoDomiciliario,
  listHistorial,
  crearDomicilio,
  recogerDomicilio,
  actualizarDomicilio,
  marcarEntregado,
  marcarCancelado,
};

const crypto = require("crypto");
const { pool } = require("../../db/pool");
const { ServiceError } = require("../../lib/service-error");
const { haversineKm } = require("../../lib/haversine");

const ESPACIOS_VALIDOS = [1, 2, 3];
const METODOS_PAGO_VALIDOS = ["Efectivo", "Transferencia"];
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
    d.valor_recaudado, d.metodo_pago, d.estado, d.distancia_km, d.espacio_baul,
    d.foto_productos_url, d.motivo_cancelacion,
    c.telefono AS c_telefono, c.nombre AS c_nombre, c.fecha_primer_registro AS c_fecha_primer_registro,
    u.id_ubicacion AS u_id_ubicacion, u.telefono_cliente AS u_telefono_cliente,
    u.latitud AS u_latitud, u.longitud AS u_longitud, u.alias_direccion AS u_alias_direccion,
    dom.telefono AS dom_telefono, dom.nombre AS dom_nombre
  FROM domicilio d
  JOIN cliente c ON c.telefono = d.telefono_cliente
  JOIN ubicacion u ON u.id_ubicacion = d.id_ubicacion
  JOIN usuario dom ON dom.telefono = d.telefono_domiciliario
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
    metodo_pago: row.metodo_pago,
    estado: row.estado,
    distancia_km: row.distancia_km,
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
    },
    domiciliario: { telefono: row.dom_telefono, nombre: row.dom_nombre },
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

// Domicilios que el Admin ya asignó a este domiciliario pero que todavía no
// recoge (sin espacio de baúl asignado todavía) — sección 4 del documento.
async function listAsignados(telefonoDomiciliario) {
  const [rows] = await pool.execute(
    `${SELECT_CON_RELACIONES} WHERE d.telefono_domiciliario = ? AND d.estado = 'Asignado' ORDER BY d.fecha_hora_creacion ASC`,
    [telefonoDomiciliario]
  );
  return rows.map(hydrate);
}

// Vista de Admin: todos los domicilios asignados y pendientes de recoger, de
// cualquier domiciliario.
async function listAsignadosTodos() {
  const [rows] = await pool.execute(
    `${SELECT_CON_RELACIONES} WHERE d.estado = 'Asignado' ORDER BY d.fecha_hora_creacion ASC`
  );
  return rows.map(hydrate);
}

async function listDomiciliarios() {
  const [rows] = await pool.execute(
    "SELECT telefono, nombre FROM usuario WHERE rol = 'Domiciliario' ORDER BY nombre ASC"
  );
  return rows;
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

// Cuando lo crea el Admin (creadoPorAdmin=true), queda "Asignado" sin espacio de
// baúl: el domiciliario recién lo elige al recogerlo con recogerDomicilio() (sección
// 4). Cuando lo crea el propio domiciliario, lo tiene en mano de una vez y elige el
// espacio ahí mismo, arrancando directo en "En_curso" como antes.
async function crearDomicilio(telefonoDomiciliario, data, { creadoPorAdmin = false } = {}) {
  const telefono_cliente = data.telefono_cliente?.trim();
  const id_ubicacion = data.id_ubicacion?.trim();
  const productos = data.productos?.trim();
  const precio = Number(data.precio);
  const foto_productos_url = data.foto_productos_url ?? null;

  if (!telefonoDomiciliario) {
    throw new ServiceError("telefono_domiciliario es obligatorio", 400);
  }
  if (!telefono_cliente || !id_ubicacion || !productos) {
    throw new ServiceError("cliente, ubicación y productos son obligatorios", 400);
  }
  if (!Number.isFinite(precio) || precio <= 0) {
    throw new ServiceError("precio debe ser mayor a 0", 400);
  }
  if (!foto_productos_url) {
    throw new ServiceError("La foto del pedido es obligatoria", 400);
  }

  const [domiciliarioRows] = await pool.execute("SELECT rol FROM usuario WHERE telefono = ?", [
    telefonoDomiciliario,
  ]);
  if (!domiciliarioRows[0] || domiciliarioRows[0].rol !== "Domiciliario") {
    throw new ServiceError("El domiciliario indicado no existe", 400);
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
    await pool.execute(
      `INSERT INTO domicilio
         (id_domicilio, telefono_cliente, telefono_domiciliario, id_ubicacion, productos, precio, estado, foto_productos_url)
       VALUES (?, ?, ?, ?, ?, ?, 'Asignado', ?)`,
      [id_domicilio, telefono_cliente, telefonoDomiciliario, id_ubicacion, productos, precio, foto_productos_url]
    );
    return getDomicilioPorId(id_domicilio);
  }

  const espacio_baul = Number(data.espacio_baul);
  if (!ESPACIOS_VALIDOS.includes(espacio_baul)) {
    throw new ServiceError("espacio_baul debe ser 1, 2 o 3", 400);
  }

  const activos = await listActivos(telefonoDomiciliario);
  if (activos.length >= 3) {
    throw new ServiceError("Ya tienes 3 domicilios en curso (máximo por carga)", 409);
  }
  if (activos.some((d) => d.espacio_baul === espacio_baul)) {
    throw new ServiceError(`El espacio ${espacio_baul} del baúl ya está ocupado`, 409);
  }

  try {
    await pool.execute(
      `INSERT INTO domicilio
         (id_domicilio, telefono_cliente, telefono_domiciliario, id_ubicacion, productos, precio, espacio_baul, foto_productos_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_domicilio, telefono_cliente, telefonoDomiciliario, id_ubicacion, productos, precio, espacio_baul, foto_productos_url]
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

  return getDomicilioPorId(id_domicilio);
}

// El domiciliario recoge un domicilio "Asignado" por el Admin y ahí mismo elige en
// qué espacio del baúl lo lleva — solo entonces pasa a "En_curso" (sección 4).
async function recogerDomicilio(id, telefonoDomiciliario, data) {
  const [rows] = await pool.execute("SELECT * FROM domicilio WHERE id_domicilio = ?", [id]);
  const domicilio = rows[0];
  if (!domicilio) {
    throw new ServiceError("Domicilio no encontrado", 404);
  }
  if (domicilio.telefono_domiciliario !== telefonoDomiciliario) {
    throw new ServiceError("No autorizado", 403);
  }
  if (domicilio.estado !== "Asignado") {
    throw new ServiceError("Ese domicilio ya fue recogido o cerrado", 409);
  }

  const espacio_baul = Number(data.espacio_baul);
  if (!ESPACIOS_VALIDOS.includes(espacio_baul)) {
    throw new ServiceError("espacio_baul debe ser 1, 2 o 3", 400);
  }

  const activos = await listActivos(telefonoDomiciliario);
  if (activos.length >= 3) {
    throw new ServiceError("Ya tienes 3 domicilios en curso (máximo por carga)", 409);
  }
  if (activos.some((d) => d.espacio_baul === espacio_baul)) {
    throw new ServiceError(`El espacio ${espacio_baul} del baúl ya está ocupado`, 409);
  }

  try {
    await pool.execute("UPDATE domicilio SET estado = 'En_curso', espacio_baul = ? WHERE id_domicilio = ?", [
      espacio_baul,
      id,
    ]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ServiceError("Ese espacio del baúl ya está ocupado por otro domicilio en curso", 409);
    }
    throw err;
  }

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
  const valor_recaudado = Number(data.valor_recaudado);
  const distancia_km = data.distancia_km != null ? Number(data.distancia_km) : null;

  if (!METODOS_PAGO_VALIDOS.includes(metodo_pago)) {
    throw new ServiceError("metodo_pago inválido", 400);
  }
  if (!Number.isFinite(valor_recaudado) || valor_recaudado <= 0) {
    throw new ServiceError("valor_recaudado debe ser mayor a 0", 400);
  }

  const latitudEntrega = Number(data.ubicacion_entrega?.latitud);
  const longitudEntrega = Number(data.ubicacion_entrega?.longitud);
  if (!Number.isFinite(latitudEntrega) || !Number.isFinite(longitudEntrega)) {
    throw new ServiceError(
      "No se pudo capturar tu ubicación GPS. Activa la ubicación e intenta de nuevo",
      400
    );
  }
  const ubicacionEntrega = { latitud: latitudEntrega, longitud: longitudEntrega };

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
           valor_recaudado = ?, distancia_km = ?, id_ubicacion = ?
       WHERE id_domicilio = ?`,
      [metodo_pago, valor_recaudado, distancia_km, idUbicacionEntrega, id]
    );

    await conn.commit();

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
  return getDomicilioPorId(id);
}

module.exports = {
  getDomicilio,
  listActivos,
  listActivosTodos,
  listAsignados,
  listAsignadosTodos,
  listDomiciliarios,
  listHistorial,
  crearDomicilio,
  recogerDomicilio,
  actualizarDomicilio,
  marcarEntregado,
  marcarCancelado,
};

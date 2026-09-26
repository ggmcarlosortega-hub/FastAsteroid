const crypto = require("crypto");
const { pool } = require("../../db/pool");
const { ServiceError } = require("../../lib/service-error");
const { emitCambio } = require("../../lib/realtime");

async function listClientes(q) {
  const where = q ? "WHERE c.telefono LIKE ? OR c.nombre LIKE ?" : "";
  const params = q ? [`%${q}%`, `%${q}%`] : [];

  const [rows] = await pool.execute(
    `SELECT
       c.telefono, c.nombre, c.fecha_primer_registro,
       (SELECT COUNT(*) FROM ubicacion u WHERE u.telefono_cliente = c.telefono) AS ubicaciones_count,
       (SELECT COUNT(*) FROM domicilio d WHERE d.telefono_cliente = c.telefono) AS domicilios_count
     FROM cliente c
     ${where}
     ORDER BY c.fecha_primer_registro DESC`,
    params
  );

  return rows.map((r) => ({
    telefono: r.telefono,
    nombre: r.nombre,
    fecha_primer_registro: r.fecha_primer_registro,
    _count: { ubicaciones: r.ubicaciones_count, domicilios: r.domicilios_count },
  }));
}

async function createCliente({ telefono, nombre }) {
  telefono = telefono?.trim();
  nombre = nombre?.trim();

  if (!telefono || !nombre) {
    throw new ServiceError("telefono y nombre son obligatorios", 400);
  }

  try {
    await pool.execute("INSERT INTO cliente (telefono, nombre) VALUES (?, ?)", [telefono, nombre]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ServiceError("Ya existe un cliente con ese teléfono", 409);
    }
    throw err;
  }

  const [rows] = await pool.execute(
    "SELECT telefono, nombre, fecha_primer_registro FROM cliente WHERE telefono = ?",
    [telefono]
  );
  emitCambio("clientes:changed");
  return rows[0];
}

async function getCliente(telefono) {
  const [clienteRows] = await pool.execute(
    "SELECT telefono, nombre, fecha_primer_registro FROM cliente WHERE telefono = ?",
    [telefono]
  );
  const cliente = clienteRows[0];
  if (!cliente) {
    throw new ServiceError("Cliente no encontrado", 404);
  }

  const [ubicacionRows] = await pool.execute(
    `SELECT u.id_ubicacion, u.telefono_cliente, u.latitud, u.longitud, u.alias_direccion,
            m.id_municipio, m.nombre AS municipio_nombre, m.recargo_domicilio
     FROM ubicacion u
     LEFT JOIN municipio m ON m.id_municipio = u.id_municipio
     WHERE u.telefono_cliente = ? ORDER BY u.alias_direccion ASC`,
    [telefono]
  );
  const ubicaciones = ubicacionRows.map((row) => ({
    id_ubicacion: row.id_ubicacion,
    telefono_cliente: row.telefono_cliente,
    latitud: row.latitud,
    longitud: row.longitud,
    alias_direccion: row.alias_direccion,
    municipio: row.id_municipio
      ? { id_municipio: row.id_municipio, nombre: row.municipio_nombre, recargo_domicilio: Number(row.recargo_domicilio) }
      : null,
  }));

  return { ...cliente, ubicaciones };
}

async function updateCliente(telefono, { nombre }) {
  nombre = nombre?.trim();
  if (!nombre) {
    throw new ServiceError("nombre es obligatorio", 400);
  }

  const [result] = await pool.execute("UPDATE cliente SET nombre = ? WHERE telefono = ?", [
    nombre,
    telefono,
  ]);
  if (result.affectedRows === 0) {
    throw new ServiceError("Cliente no encontrado", 404);
  }

  const [rows] = await pool.execute(
    "SELECT telefono, nombre, fecha_primer_registro FROM cliente WHERE telefono = ?",
    [telefono]
  );
  emitCambio("clientes:changed");
  return rows[0];
}

async function deleteCliente(telefono) {
  try {
    const [result] = await pool.execute("DELETE FROM cliente WHERE telefono = ?", [telefono]);
    if (result.affectedRows === 0) {
      throw new Error("Cliente no encontrado");
    }
  } catch {
    // Mismo mensaje genérico para "no existe" y para "tiene domicilios/ubicaciones
    // asociados" (violación de FK, ER_ROW_IS_REFERENCED_2) — igual que el
    // comportamiento original con Prisma.
    throw new ServiceError(
      "No se pudo eliminar (verifica que el cliente exista y no tenga domicilios asociados)",
      409
    );
  }
  emitCambio("clientes:changed");
}

async function addUbicacion(telefono, { alias_direccion, latitud, longitud, id_municipio }) {
  alias_direccion = alias_direccion?.trim();
  latitud = Number(latitud);
  longitud = Number(longitud);
  id_municipio = id_municipio || null;

  if (!alias_direccion || Number.isNaN(latitud) || Number.isNaN(longitud)) {
    throw new ServiceError("alias_direccion, latitud y longitud son obligatorios", 400);
  }

  const [clienteRows] = await pool.execute("SELECT telefono FROM cliente WHERE telefono = ?", [
    telefono,
  ]);
  if (clienteRows.length === 0) {
    throw new ServiceError("Cliente no encontrado", 404);
  }

  let municipio = null;
  if (id_municipio) {
    const [municipioRows] = await pool.execute(
      "SELECT id_municipio, nombre, recargo_domicilio FROM municipio WHERE id_municipio = ?",
      [id_municipio]
    );
    if (!municipioRows[0]) {
      throw new ServiceError("El municipio indicado no existe", 400);
    }
    municipio = { ...municipioRows[0], recargo_domicilio: Number(municipioRows[0].recargo_domicilio) };
  }

  const id_ubicacion = crypto.randomUUID();
  await pool.execute(
    "INSERT INTO ubicacion (id_ubicacion, telefono_cliente, alias_direccion, latitud, longitud, id_municipio) VALUES (?, ?, ?, ?, ?, ?)",
    [id_ubicacion, telefono, alias_direccion, latitud, longitud, id_municipio]
  );

  emitCambio("clientes:changed");
  return { id_ubicacion, telefono_cliente: telefono, alias_direccion, latitud, longitud, municipio };
}

// Solo alias y municipio son editables — el punto del mapa no se toca (si
// quedó mal ubicado, la solución es borrar y crear una nueva, no editar esta).
// Esto tapa el hueco real: una ubicación creada antes de que existiera
// "municipio", o sin elegir uno, se quedaba así para siempre porque no había
// forma de corregirla — solo crear o borrar.
async function updateUbicacion(id, { alias_direccion, id_municipio }) {
  alias_direccion = alias_direccion?.trim();
  id_municipio = id_municipio || null;

  if (!alias_direccion) {
    throw new ServiceError("alias_direccion es obligatorio", 400);
  }

  let municipio = null;
  if (id_municipio) {
    const [municipioRows] = await pool.execute(
      "SELECT id_municipio, nombre, recargo_domicilio FROM municipio WHERE id_municipio = ?",
      [id_municipio]
    );
    if (!municipioRows[0]) {
      throw new ServiceError("El municipio indicado no existe", 400);
    }
    municipio = { ...municipioRows[0], recargo_domicilio: Number(municipioRows[0].recargo_domicilio) };
  }

  const [result] = await pool.execute(
    "UPDATE ubicacion SET alias_direccion = ?, id_municipio = ? WHERE id_ubicacion = ?",
    [alias_direccion, id_municipio, id]
  );
  if (result.affectedRows === 0) {
    throw new ServiceError("Ubicación no encontrada", 404);
  }

  const [rows] = await pool.execute(
    "SELECT id_ubicacion, telefono_cliente, alias_direccion, latitud, longitud FROM ubicacion WHERE id_ubicacion = ?",
    [id]
  );
  emitCambio("clientes:changed");
  return { ...rows[0], municipio };
}

async function deleteUbicacion(id) {
  try {
    const [result] = await pool.execute("DELETE FROM ubicacion WHERE id_ubicacion = ?", [id]);
    if (result.affectedRows === 0) {
      throw new Error("Ubicación no encontrada");
    }
  } catch {
    throw new ServiceError(
      "No se pudo eliminar (verifica que la ubicación exista y no tenga domicilios asociados)",
      409
    );
  }
  emitCambio("clientes:changed");
}

module.exports = {
  listClientes,
  createCliente,
  getCliente,
  updateCliente,
  deleteCliente,
  addUbicacion,
  updateUbicacion,
  deleteUbicacion,
};

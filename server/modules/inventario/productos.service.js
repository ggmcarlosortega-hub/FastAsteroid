const crypto = require("crypto");
const { pool } = require("../../db/pool");
const { ServiceError } = require("../../lib/service-error");
const { emitCambio } = require("../../lib/realtime");
const inventarioService = require("./inventario.service");
const lotesService = require("./lotes.service");

function hydrate(row, disponibleMap, costoPromedioMap) {
  const costo_promedio = costoPromedioMap ? costoPromedioMap.get(row.id_producto) ?? null : undefined;
  return {
    id_producto: row.id_producto,
    nombre: row.nombre,
    precio_venta: Number(row.precio_venta),
    activo: !!row.activo,
    fecha_creacion: row.fecha_creacion,
    categoria: row.id_categoria ? { id_categoria: row.id_categoria, nombre: row.nombre_categoria } : null,
    // Solo se calcula cuando listProductos() lo pide (ver soloActivos) — el picker de
    // productos al crear un domicilio lo usa para no dejar vender más de lo que hay.
    ...(disponibleMap ? { disponible: disponibleMap.get(row.id_producto) ?? 0 } : {}),
    // costo_promedio es null cuando el producto nunca tuvo una compra costeada — el
    // margen no se inventa en ese caso (ver getCostoPromedioMap en lotes.service.js).
    ...(costoPromedioMap
      ? { costo_promedio, margen: costo_promedio != null ? Number(row.precio_venta) - costo_promedio : null }
      : {}),
  };
}

const SELECT_CON_CATEGORIA = `
  SELECT p.id_producto, p.nombre, p.precio_venta, p.activo, p.fecha_creacion,
         c.id_categoria, c.nombre AS nombre_categoria
  FROM producto p
  LEFT JOIN categoria_producto c ON c.id_categoria = p.id_categoria
`;

// soloActivos=true es lo que usa el selector de productos al crear un domicilio —
// un producto desactivado no debe poder elegirse para una venta nueva, pero sigue
// existiendo para no romper el historial de domicilios ya creados con él.
async function listProductos({ soloActivos = false } = {}) {
  const where = soloActivos ? "WHERE p.activo = TRUE" : "";
  const [[rows], disponibleMap, costoPromedioMap] = await Promise.all([
    pool.execute(`${SELECT_CON_CATEGORIA} ${where} ORDER BY p.nombre ASC`),
    inventarioService.getDisponibleMap(),
    lotesService.getCostoPromedioMap(),
  ]);
  return rows.map((row) => hydrate(row, disponibleMap, costoPromedioMap));
}

async function createProducto({ nombre, precio_venta, id_categoria }) {
  nombre = nombre?.trim();
  const precio = Number(precio_venta);
  id_categoria = id_categoria || null;

  if (!nombre) {
    throw new ServiceError("nombre es obligatorio", 400);
  }
  if (!Number.isFinite(precio) || precio <= 0) {
    throw new ServiceError("precio_venta debe ser mayor a 0", 400);
  }

  const id_producto = crypto.randomUUID();
  await pool.execute(
    "INSERT INTO producto (id_producto, nombre, precio_venta, id_categoria) VALUES (?, ?, ?, ?)",
    [id_producto, nombre, precio, id_categoria]
  );

  const [rows] = await pool.execute(`${SELECT_CON_CATEGORIA} WHERE p.id_producto = ?`, [id_producto]);
  emitCambio("productos:changed");
  return hydrate(rows[0]);
}

async function updateProducto(id, { nombre, precio_venta, activo, id_categoria }) {
  nombre = nombre?.trim();
  const precio = Number(precio_venta);
  id_categoria = id_categoria || null;

  if (!nombre) {
    throw new ServiceError("nombre es obligatorio", 400);
  }
  if (!Number.isFinite(precio) || precio <= 0) {
    throw new ServiceError("precio_venta debe ser mayor a 0", 400);
  }

  const [result] = await pool.execute(
    "UPDATE producto SET nombre = ?, precio_venta = ?, activo = ?, id_categoria = ? WHERE id_producto = ?",
    [nombre, precio, activo !== false, id_categoria, id]
  );
  if (result.affectedRows === 0) {
    throw new ServiceError("Producto no encontrado", 404);
  }

  const [rows] = await pool.execute(`${SELECT_CON_CATEGORIA} WHERE p.id_producto = ?`, [id]);
  emitCambio("productos:changed");
  return hydrate(rows[0]);
}

// Alta masiva: crea varias líneas de una sola vez (ej. al cargar un catálogo
// completo) — se valida cada línea antes de insertar cualquiera, para no dejar
// el catálogo a medias si una fila viene mal.
async function createProductosBulk(lineas) {
  if (!Array.isArray(lineas) || lineas.length === 0) {
    throw new ServiceError("Debes indicar al menos un producto", 400);
  }

  const limpias = lineas.map((linea, i) => {
    const nombre = linea.nombre?.trim();
    const precio = Number(linea.precio_venta);
    if (!nombre) {
      throw new ServiceError(`Fila ${i + 1}: nombre es obligatorio`, 400);
    }
    if (!Number.isFinite(precio) || precio <= 0) {
      throw new ServiceError(`Fila ${i + 1}: precio_venta debe ser mayor a 0`, 400);
    }
    return { id_producto: crypto.randomUUID(), nombre, precio_venta: precio, id_categoria: linea.id_categoria || null };
  });

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    for (const linea of limpias) {
      await conexion.execute(
        "INSERT INTO producto (id_producto, nombre, precio_venta, id_categoria) VALUES (?, ?, ?, ?)",
        [linea.id_producto, linea.nombre, linea.precio_venta, linea.id_categoria]
      );
    }
    await conexion.commit();
  } catch (err) {
    await conexion.rollback();
    throw err;
  } finally {
    conexion.release();
  }

  const [rows] = await pool.query(
    `${SELECT_CON_CATEGORIA} WHERE p.id_producto IN (?) ORDER BY p.nombre ASC`,
    [limpias.map((l) => l.id_producto)]
  );
  emitCambio("productos:changed");
  // OJO: rows.map(hydrate) directo pasa (row, index, array) — hydrate() recibía
  // el índice como disponibleMap y el arreglo completo como costoPromedioMap,
  // y como un arreglo es "truthy" entraba a costoPromedioMap.get(...), que no
  // existe en un Array. Con la arrow function solo se pasa `row`.
  return rows.map((row) => hydrate(row));
}

module.exports = { listProductos, createProducto, updateProducto, createProductosBulk };

const crypto = require("crypto");
const { pool } = require("../../db/pool");
const { ServiceError } = require("../../lib/service-error");
const { emitCambio } = require("../../lib/realtime");

function hydrate(row) {
  return {
    id_lote: row.id_lote,
    id_producto: row.id_producto,
    id_proveedor: row.id_proveedor,
    numero_lote: row.numero_lote,
    cantidad_comprada: row.cantidad_comprada,
    costo_unitario: row.costo_unitario != null ? Number(row.costo_unitario) : null,
    fecha_caducidad: row.fecha_caducidad,
    fecha_compra: row.fecha_compra,
    producto: { nombre: row.producto_nombre },
    proveedor: { nombre: row.proveedor_nombre },
  };
}

const SELECT_CON_RELACIONES = `
  SELECT l.id_lote, l.id_producto, l.id_proveedor, l.numero_lote, l.cantidad_comprada,
         l.costo_unitario, l.fecha_caducidad, l.fecha_compra,
         p.nombre AS producto_nombre, pr.nombre AS proveedor_nombre
  FROM lote_compra l
  JOIN producto p ON p.id_producto = l.id_producto
  JOIN proveedor pr ON pr.id_proveedor = l.id_proveedor
`;

async function listLotes() {
  const [rows] = await pool.execute(`${SELECT_CON_RELACIONES} ORDER BY l.fecha_compra DESC`);
  return rows.map(hydrate);
}

async function validarLinea({ id_producto, id_proveedor, cantidad_comprada, costo_unitario }, conn = pool) {
  const cantidad = Number(cantidad_comprada);
  const costo = Number(costo_unitario);

  if (!id_producto || !id_proveedor) {
    throw new ServiceError("producto y proveedor son obligatorios", 400);
  }
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new ServiceError("cantidad_comprada debe ser mayor a 0", 400);
  }
  if (!Number.isFinite(costo) || costo <= 0) {
    throw new ServiceError("costo_unitario debe ser mayor a 0", 400);
  }

  const [productoRows] = await conn.execute("SELECT id_producto FROM producto WHERE id_producto = ?", [
    id_producto,
  ]);
  if (!productoRows[0]) {
    throw new ServiceError("El producto indicado no existe", 400);
  }
  const [proveedorRows] = await conn.execute("SELECT id_proveedor FROM proveedor WHERE id_proveedor = ?", [
    id_proveedor,
  ]);
  if (!proveedorRows[0]) {
    throw new ServiceError("El proveedor indicado no existe", 400);
  }

  return { cantidad, costo };
}

async function createLote({ id_producto, id_proveedor, numero_lote, cantidad_comprada, costo_unitario, fecha_caducidad }) {
  const { cantidad, costo } = await validarLinea({ id_producto, id_proveedor, cantidad_comprada, costo_unitario });

  const id_lote = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO lote_compra (id_lote, id_producto, id_proveedor, numero_lote, cantidad_comprada, costo_unitario, fecha_caducidad)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id_lote, id_producto, id_proveedor, numero_lote?.trim() || null, cantidad, costo, fecha_caducidad || null]
  );

  const [rows] = await pool.execute(`${SELECT_CON_RELACIONES} WHERE l.id_lote = ?`, [id_lote]);
  emitCambio("lotes:changed");
  return hydrate(rows[0]);
}

// Varias líneas de una sola factura (mismo proveedor/número de lote/fecha para
// todas) — se validan todas antes de insertar cualquiera, mismo patrón que
// createProductosBulk en productos.service.js, para no dejar la compra a medias
// si una línea viene mal (ej. producto elegido dos veces con datos distintos).
async function createLotesBulk({ id_proveedor, numero_lote, fecha_caducidad, lineas }) {
  if (!Array.isArray(lineas) || lineas.length === 0) {
    throw new ServiceError("Debes indicar al menos una línea", 400);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const limpias = [];
    for (const [i, linea] of lineas.entries()) {
      try {
        const { cantidad, costo } = await validarLinea(
          { id_producto: linea.id_producto, id_proveedor, cantidad_comprada: linea.cantidad_comprada, costo_unitario: linea.costo_unitario },
          conn
        );
        limpias.push({ id_producto: linea.id_producto, cantidad, costo });
      } catch (err) {
        throw new ServiceError(`Línea ${i + 1}: ${err.message}`, err.status ?? 400);
      }
    }

    const ids = [];
    for (const linea of limpias) {
      const id_lote = crypto.randomUUID();
      ids.push(id_lote);
      await conn.execute(
        `INSERT INTO lote_compra (id_lote, id_producto, id_proveedor, numero_lote, cantidad_comprada, costo_unitario, fecha_caducidad)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id_lote, linea.id_producto, id_proveedor, numero_lote?.trim() || null, linea.cantidad, linea.costo, fecha_caducidad || null]
      );
    }

    await conn.commit();

    const [rows] = await pool.query(`${SELECT_CON_RELACIONES} WHERE l.id_lote IN (?) ORDER BY l.fecha_compra DESC`, [ids]);
    emitCambio("lotes:changed");
    return rows.map(hydrate);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Costo promedio ponderado por unidad, por producto — solo sobre lotes que sí
// tienen costo registrado (los de antes de este campo quedan NULL y no entran).
// Usado tanto para mostrar el margen del catálogo como, si hiciera falta, para
// cualquier reporte de costos.
async function getCostoPromedioMap() {
  const [rows] = await pool.execute(`
    SELECT id_producto, SUM(cantidad_comprada * costo_unitario) / SUM(cantidad_comprada) AS costo_promedio
    FROM lote_compra
    WHERE costo_unitario IS NOT NULL
    GROUP BY id_producto
  `);
  return new Map(rows.map((r) => [r.id_producto, Number(r.costo_promedio)]));
}

// Gasto total en compras de los últimos 7 días — mismo período implícito que
// "de la semana" pedido para la tarjeta de la pestaña Compras.
async function getGastoSemanal() {
  const [rows] = await pool.execute(`
    SELECT COALESCE(SUM(cantidad_comprada * costo_unitario), 0) AS total
    FROM lote_compra
    WHERE costo_unitario IS NOT NULL AND fecha_compra >= NOW() - INTERVAL 7 DAY
  `);
  return Number(rows[0].total);
}

module.exports = { listLotes, createLote, createLotesBulk, getCostoPromedioMap, getGastoSemanal };

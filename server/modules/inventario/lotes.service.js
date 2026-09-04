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
    fecha_caducidad: row.fecha_caducidad,
    fecha_compra: row.fecha_compra,
    producto: { nombre: row.producto_nombre },
    proveedor: { nombre: row.proveedor_nombre },
  };
}

async function listLotes() {
  const [rows] = await pool.execute(`
    SELECT l.id_lote, l.id_producto, l.id_proveedor, l.numero_lote, l.cantidad_comprada,
           l.fecha_caducidad, l.fecha_compra,
           p.nombre AS producto_nombre, pr.nombre AS proveedor_nombre
    FROM lote_compra l
    JOIN producto p ON p.id_producto = l.id_producto
    JOIN proveedor pr ON pr.id_proveedor = l.id_proveedor
    ORDER BY l.fecha_compra DESC
  `);
  return rows.map(hydrate);
}

async function createLote({ id_producto, id_proveedor, numero_lote, cantidad_comprada, fecha_caducidad }) {
  const cantidad = Number(cantidad_comprada);

  if (!id_producto || !id_proveedor) {
    throw new ServiceError("producto y proveedor son obligatorios", 400);
  }
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new ServiceError("cantidad_comprada debe ser mayor a 0", 400);
  }

  const [productoRows] = await pool.execute("SELECT id_producto FROM producto WHERE id_producto = ?", [
    id_producto,
  ]);
  if (!productoRows[0]) {
    throw new ServiceError("El producto indicado no existe", 400);
  }
  const [proveedorRows] = await pool.execute("SELECT id_proveedor FROM proveedor WHERE id_proveedor = ?", [
    id_proveedor,
  ]);
  if (!proveedorRows[0]) {
    throw new ServiceError("El proveedor indicado no existe", 400);
  }

  const id_lote = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO lote_compra (id_lote, id_producto, id_proveedor, numero_lote, cantidad_comprada, fecha_caducidad)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id_lote, id_producto, id_proveedor, numero_lote?.trim() || null, cantidad, fecha_caducidad || null]
  );

  const [rows] = await pool.execute(`
    SELECT l.id_lote, l.id_producto, l.id_proveedor, l.numero_lote, l.cantidad_comprada,
           l.fecha_caducidad, l.fecha_compra,
           p.nombre AS producto_nombre, pr.nombre AS proveedor_nombre
    FROM lote_compra l
    JOIN producto p ON p.id_producto = l.id_producto
    JOIN proveedor pr ON pr.id_proveedor = l.id_proveedor
    WHERE l.id_lote = ?
  `, [id_lote]);
  emitCambio("lotes:changed");
  return hydrate(rows[0]);
}

module.exports = { listLotes, createLote };

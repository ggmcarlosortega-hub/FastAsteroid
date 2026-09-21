const { pool } = require("../../db/pool");

// Inventario = comprado (suma de lote_compra) - vendido (suma de domicilio_producto
// de domicilios que no están Cancelado — un domicilio cancelado no debería restar
// del inventario, el producto nunca salió de verdad). LEFT JOIN + COALESCE porque un
// producto recién creado puede no tener compras ni ventas todavía.
async function queryComprasVentas() {
  const [rows] = await pool.execute(`
    SELECT
      p.id_producto,
      p.nombre,
      p.precio_venta,
      p.activo,
      COALESCE(compras.total, 0) AS comprado,
      COALESCE(ventas.total, 0) AS vendido
    FROM producto p
    LEFT JOIN (
      SELECT id_producto, SUM(cantidad_comprada) AS total
      FROM lote_compra
      GROUP BY id_producto
    ) compras ON compras.id_producto = p.id_producto
    LEFT JOIN (
      SELECT dp.id_producto, SUM(dp.cantidad) AS total
      FROM domicilio_producto dp
      JOIN domicilio d ON d.id_domicilio = dp.id_domicilio
      WHERE d.estado <> 'Cancelado'
      GROUP BY dp.id_producto
    ) ventas ON ventas.id_producto = p.id_producto
    ORDER BY p.nombre ASC
  `);
  return rows;
}

async function getInventario() {
  const rows = await queryComprasVentas();
  return rows.map((r) => ({
    id_producto: r.id_producto,
    nombre: r.nombre,
    precio_venta: Number(r.precio_venta),
    activo: !!r.activo,
    comprado: Number(r.comprado),
    vendido: Number(r.vendido),
    inventario: Number(r.comprado) - Number(r.vendido),
  }));
}

// Usado para validar ventas (resolverLineasProductos en domicilios.service.js) y
// para que el selector de productos muestre cuánto queda de cada uno — un producto
// no debería poder venderse por encima de esto (ver decisión de inventario negativo).
async function getDisponibleMap() {
  const rows = await queryComprasVentas();
  return new Map(rows.map((r) => [r.id_producto, Number(r.comprado) - Number(r.vendido)]));
}

module.exports = { getInventario, getDisponibleMap };

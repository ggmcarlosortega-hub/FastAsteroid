const { pool } = require("../../db/pool");

// Inventario = comprado (suma de lote_compra) - vendido (suma de domicilio_producto
// de domicilios que no están Cancelado — un domicilio cancelado no debería restar
// del inventario, el producto nunca salió de verdad). LEFT JOIN + COALESCE porque un
// producto recién creado puede no tener compras ni ventas todavía.
// `conn` opcional: cuando resolverLineasProductos() llama a getDisponibleMap()
// dentro de una transacción con las filas de producto ya bloqueadas
// (FOR UPDATE), esta consulta debe correr sobre esa MISMA conexión — si usara
// el pool directo, leería fuera de la transacción y el lock de arriba no
// serviría de nada contra la condición de carrera (ver crearDomicilio).
async function queryComprasVentas(conn = pool) {
  const [rows] = await conn.execute(`
    SELECT
      p.id_producto,
      p.nombre,
      p.precio_venta,
      p.activo,
      c.id_categoria,
      c.nombre AS nombre_categoria,
      c.id_categoria_padre,
      cp.nombre AS nombre_categoria_padre,
      COALESCE(compras.total, 0) AS comprado,
      COALESCE(ventas.total, 0) AS vendido
    FROM producto p
    LEFT JOIN categoria_producto c ON c.id_categoria = p.id_categoria
    LEFT JOIN categoria_producto cp ON cp.id_categoria = c.id_categoria_padre
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
    // Mismo shape que hydrate() en productos.service.js — así el mismo
    // helper de agrupación por categoría del frontend sirve para ambas listas.
    categoria: r.id_categoria
      ? {
          id_categoria: r.id_categoria,
          nombre: r.nombre_categoria,
          categoria_padre:
            r.id_categoria_padre != null
              ? { id_categoria: r.id_categoria_padre, nombre: r.nombre_categoria_padre }
              : null,
        }
      : null,
    comprado: Number(r.comprado),
    vendido: Number(r.vendido),
    inventario: Number(r.comprado) - Number(r.vendido),
  }));
}

// Usado para validar ventas (resolverLineasProductos en domicilios.service.js) y
// para que el selector de productos muestre cuánto queda de cada uno — un producto
// no debería poder venderse por encima de esto (ver decisión de inventario negativo).
async function getDisponibleMap(conn = pool) {
  const rows = await queryComprasVentas(conn);
  return new Map(rows.map((r) => [r.id_producto, Number(r.comprado) - Number(r.vendido)]));
}

module.exports = { getInventario, getDisponibleMap };

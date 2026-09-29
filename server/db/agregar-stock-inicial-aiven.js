// Da stock inicial (100 unidades) a cada producto del catálogo recién subido,
// con costo_unitario = precio_venta - 19% (para que el margen se vea de una
// vez en Inventario/Productos). Sin fecha de caducidad. Usa el único
// proveedor que ya existe en Aiven ("Rigos") — se necesita un id_proveedor
// porque lote_compra lo exige (ver lotes.service.js, validarLinea).
//
// Idempotente: un producto que YA tiene algún lote_compra (ej. "Triple Carne",
// que ya traía su propio stock) se salta, para no inflarlo con un segundo
// lote encima del que ya tenía.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.aiven") });
const crypto = require("crypto");
const { pool } = require("./pool");

const DESCUENTO_COSTO = 0.19; // costo = precio_venta * (1 - 0.19)
const CANTIDAD_INICIAL = 100;

async function main() {
  const [proveedores] = await pool.execute("SELECT id_proveedor, nombre FROM proveedor LIMIT 1");
  if (!proveedores[0]) {
    console.error("No hay ningún proveedor en la base — crea uno primero.");
    process.exit(1);
  }
  const id_proveedor = proveedores[0].id_proveedor;
  console.log(`Usando proveedor: "${proveedores[0].nombre}"`);

  const [[{ total }]] = await pool.execute("SELECT COUNT(*) AS total FROM producto");
  const [productos] = await pool.execute(`
    SELECT p.id_producto, p.nombre, p.precio_venta
    FROM producto p
    LEFT JOIN lote_compra l ON l.id_producto = p.id_producto
    WHERE l.id_lote IS NULL
    GROUP BY p.id_producto
  `);

  let creados = 0;
  for (const p of productos) {
    const precio_venta = Number(p.precio_venta);
    const costo_unitario = Math.round(precio_venta * (1 - DESCUENTO_COSTO));
    await pool.execute(
      `INSERT INTO lote_compra (id_lote, id_producto, id_proveedor, numero_lote, cantidad_comprada, costo_unitario, fecha_caducidad)
       VALUES (?, ?, ?, NULL, ?, ?, NULL)`,
      [crypto.randomUUID(), p.id_producto, id_proveedor, CANTIDAD_INICIAL, costo_unitario]
    );
    console.log(`  + ${p.nombre}: 100 u. a $${costo_unitario.toLocaleString("es-CO")} c/u (venta $${precio_venta.toLocaleString("es-CO")})`);
    creados++;
  }

  console.log(`\nListo. Lotes creados: ${creados}. Ya tenían stock (saltados): ${total - creados}. Total productos: ${total}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error agregando stock inicial:", err);
  process.exit(1);
});

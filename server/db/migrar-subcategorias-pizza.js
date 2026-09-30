// Migración de DATOS de negocio (no de esquema, por eso NO se comitea a git,
// mismo criterio que importar-catalogo-aiven.js / agregar-stock-inicial-aiven.js):
// crea la categoría "Pizzas" y la asigna como padre de cada categoría
// "Pizzas <Sabor>" ya existente (Rigos, Hawaiana, etc.) — las 13 se crearon
// sueltas en Aiven antes de que el sistema soportara subcategorías. Idempotente:
// correrlo de nuevo no duplica la categoría padre ni vuelve a reasignar lo que
// ya quedó bien.
require("dotenv").config();
const crypto = require("crypto");
const { pool } = require("./pool");

const NOMBRE_PADRE = "Pizzas";

async function main() {
  let [padreRows] = await pool.execute("SELECT id_categoria FROM categoria_producto WHERE nombre = ?", [
    NOMBRE_PADRE,
  ]);
  let idPadre = padreRows[0]?.id_categoria;

  if (!idPadre) {
    idPadre = crypto.randomUUID();
    await pool.execute("INSERT INTO categoria_producto (id_categoria, nombre) VALUES (?, ?)", [
      idPadre,
      NOMBRE_PADRE,
    ]);
    console.log(`+ categoría padre "${NOMBRE_PADRE}" creada:`, idPadre);
  } else {
    console.log(`= categoría padre "${NOMBRE_PADRE}" ya existía:`, idPadre);
  }

  // "Pizzas <Sabor>" pero no "Pizzas" misma, y solo las que todavía no tienen
  // padre (para no reasignar algo que alguien ya haya movido a mano).
  const [hijas] = await pool.execute(
    `SELECT id_categoria, nombre FROM categoria_producto
     WHERE nombre LIKE 'Pizzas %' AND id_categoria_padre IS NULL AND id_categoria != ?`,
    [idPadre]
  );

  for (const hija of hijas) {
    await pool.execute("UPDATE categoria_producto SET id_categoria_padre = ? WHERE id_categoria = ?", [
      idPadre,
      hija.id_categoria,
    ]);
    console.log(`  + "${hija.nombre}" -> subcategoría de "${NOMBRE_PADRE}"`);
  }

  if (hijas.length === 0) {
    console.log("= ninguna categoría de sabor pendiente por reasignar");
  }

  console.log("\nMigración de subcategorías de Pizzas completa.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en la migración:", err);
  process.exit(1);
});

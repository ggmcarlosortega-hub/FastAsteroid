// Migración de esquema (se comitea a git, ver convención en
// 2026-09-29-vehiculos-subcategorias-precision.js): agrega producto.tamano —
// necesario para poder ofrecer, al elegir una pizza, solo los bordes del
// MISMO tamaño (Jumbo/Grande/Mediana/Pequeña/Pizzeta). Antes el tamaño de una
// pizza o de un borde vivía únicamente como una palabra suelta dentro de
// producto.nombre (ej. "Jumbo Mixta", "Borde de Queso Jumbo"), sin ninguna
// columna que permitiera cruzarlos por tamaño de forma confiable.
//
// Idempotente: se puede correr más de una vez sin romper nada.
require("dotenv").config();
const { pool } = require("../pool");

async function columnaExiste(tabla, columna) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS n FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tabla, columna]
  );
  return rows[0].n > 0;
}

async function main() {
  if (!(await columnaExiste("producto", "tamano"))) {
    await pool.query("ALTER TABLE producto ADD COLUMN tamano VARCHAR(20) NULL AFTER precio_venta");
    console.log("+ columna producto.tamano agregada");
  } else {
    console.log("= columna producto.tamano ya existía");
  }

  console.log("\nMigración completa.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en la migración:", err);
  process.exit(1);
});

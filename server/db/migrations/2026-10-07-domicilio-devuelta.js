// Migración de esquema (se comitea a git): cuando el cobro es en efectivo, se guarda lo
// que recibió el domiciliario y la devuelta que dio al cliente.
//
// Idempotente: revisa antes de cada cambio.
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
  if (!(await columnaExiste("domicilio", "efectivo_recibido"))) {
    await pool.query("ALTER TABLE domicilio ADD COLUMN efectivo_recibido DECIMAL(10,2) NULL");
    console.log("+ columna domicilio.efectivo_recibido agregada");
  }
  if (!(await columnaExiste("domicilio", "devuelta"))) {
    await pool.query("ALTER TABLE domicilio ADD COLUMN devuelta DECIMAL(10,2) NULL");
    console.log("+ columna domicilio.devuelta agregada");
  }
  console.log("\nMigración completa.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en la migración:", err);
  process.exit(1);
});

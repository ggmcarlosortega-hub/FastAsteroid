// Migración de esquema (se comitea a git, igual que las anteriores): cada domicilio
// guarda el municipio de su adición (recargo) y el valor del recargo que se sumó al
// precio. Así, al entregar, el cambio de recargo se puede aplicar al pedido y al
// municipio para los pedidos futuros.
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

async function fkExiste(nombreFk) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS n FROM information_schema.table_constraints
     WHERE table_schema = DATABASE() AND constraint_name = ?`,
    [nombreFk]
  );
  return rows[0].n > 0;
}

async function main() {
  if (!(await columnaExiste("domicilio", "id_municipio"))) {
    await pool.query("ALTER TABLE domicilio ADD COLUMN id_municipio CHAR(36) NULL AFTER id_ubicacion");
    console.log("+ columna domicilio.id_municipio agregada");
  }
  if (!(await columnaExiste("domicilio", "recargo_domicilio"))) {
    await pool.query("ALTER TABLE domicilio ADD COLUMN recargo_domicilio DECIMAL(10,2) NULL AFTER id_municipio");
    console.log("+ columna domicilio.recargo_domicilio agregada");
  }
  if (!(await fkExiste("domicilio_municipio_fkey"))) {
    await pool.query(`
      ALTER TABLE domicilio
        ADD CONSTRAINT domicilio_municipio_fkey
        FOREIGN KEY (id_municipio) REFERENCES municipio(id_municipio)
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log("+ FK domicilio -> municipio agregada");
  }

  console.log("\nMigración completa.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en la migración:", err);
  process.exit(1);
});

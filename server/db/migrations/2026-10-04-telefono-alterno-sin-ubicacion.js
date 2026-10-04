// Migración de esquema (se comitea a git, igual que 2026-09-29 y 2026-09-30):
// 1. cliente.telefono_alterno — segundo número opcional que apunta al mismo
//    cliente (y por tanto a las mismas ubicaciones).
// 2. domicilio.id_ubicacion pasa a NULL — un cliente nuevo puede pedir sin
//    ubicación guardada; la ubicación se define al entregar.
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

async function indiceExiste(tabla, nombreIndice) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS n FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [tabla, nombreIndice]
  );
  return rows[0].n > 0;
}

async function columnaEsNullable(tabla, columna) {
  const [rows] = await pool.execute(
    `SELECT IS_NULLABLE FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tabla, columna]
  );
  return rows[0]?.IS_NULLABLE === "YES";
}

async function main() {
  if (!(await columnaExiste("cliente", "telefono_alterno"))) {
    await pool.query("ALTER TABLE cliente ADD COLUMN telefono_alterno VARCHAR(20) NULL AFTER telefono");
    console.log("+ columna cliente.telefono_alterno agregada");
  }
  if (!(await indiceExiste("cliente", "cliente_telefono_alterno_unico"))) {
    await pool.query("ALTER TABLE cliente ADD UNIQUE INDEX cliente_telefono_alterno_unico (telefono_alterno)");
    console.log("+ índice único cliente_telefono_alterno_unico agregado");
  }

  if (!(await columnaEsNullable("domicilio", "id_ubicacion"))) {
    await pool.query("ALTER TABLE domicilio MODIFY id_ubicacion CHAR(36) NULL");
    console.log("+ domicilio.id_ubicacion ahora permite NULL");
  }

  console.log("\nMigración completa.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en la migración:", err);
  process.exit(1);
});

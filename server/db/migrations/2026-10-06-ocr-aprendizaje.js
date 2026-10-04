// Migración de esquema (se comitea a git): tabla de aprendizaje del OCR. Guarda, por
// texto leído de una comanda, el producto o municipio que el domiciliario confirmó para
// él. Así las siguientes comandas con el mismo texto se resuelven sin depender de la
// coincidencia aproximada.
//
// Idempotente: revisa antes de crear.
require("dotenv").config();
const { pool } = require("../pool");

async function tablaExiste(tabla) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS n FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [tabla]
  );
  return rows[0].n > 0;
}

async function main() {
  if (!(await tablaExiste("ocr_aprendizaje"))) {
    await pool.query(`
      CREATE TABLE ocr_aprendizaje (
        id_aprendizaje  CHAR(36)      PRIMARY KEY,
        tipo            ENUM('producto', 'municipio') NOT NULL,
        texto_clave     VARCHAR(255)  NOT NULL,
        id_referencia   CHAR(36)      NOT NULL,
        veces           INT           NOT NULL DEFAULT 1,
        ultima_vez      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY ocr_aprendizaje_tipo_texto (tipo, texto_clave)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("+ tabla ocr_aprendizaje creada");
  } else {
    console.log("= tabla ocr_aprendizaje ya existía");
  }
  console.log("\nMigración completa.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en la migración:", err);
  process.exit(1);
});

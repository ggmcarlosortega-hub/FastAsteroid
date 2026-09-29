// Migración de esquema (no de datos de negocio, por eso SÍ se comitea a git,
// a diferencia de los scripts de catálogo/stock en server/db/*-aiven.js):
// 1. Tabla `vehiculo` + `registro_mantenimiento.id_vehiculo` — antes todo el
//    módulo de Mantenimiento asumía una sola moto global.
// 2. `categoria_producto.id_categoria_padre` — soporte de subcategorías.
// 3. `domicilio.precision_recogida_m` / `precision_entrega_m` — para poder
//    diagnosticar con datos reales (no solo inferencia) por qué
//    `distancia_km` venía dando valores absurdamente chicos en producción.
//
// Idempotente: se puede correr más de una vez sin romper nada (usa
// IF NOT EXISTS / revisa antes de crear cada FK). No usa schema.sql (ese es
// un DROP+CREATE completo, destruiría datos reales) — son ALTER TABLE sobre
// una base que ya existe y tiene datos.
require("dotenv").config();
const crypto = require("crypto");
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
  // --- 1. Vehículos ---
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehiculo (
      id_vehiculo     CHAR(36)      PRIMARY KEY,
      nombre          VARCHAR(255)  NOT NULL,
      placa           VARCHAR(20)   NULL UNIQUE,
      activo          BOOLEAN       NOT NULL DEFAULT TRUE,
      fecha_creacion  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("+ tabla vehiculo lista");

  if (!(await columnaExiste("registro_mantenimiento", "id_vehiculo"))) {
    await pool.query(
      "ALTER TABLE registro_mantenimiento ADD COLUMN id_vehiculo CHAR(36) NULL AFTER id_registro"
    );
    console.log("+ columna registro_mantenimiento.id_vehiculo agregada");
  }

  const [vehiculosExistentes] = await pool.execute("SELECT id_vehiculo FROM vehiculo LIMIT 1");
  let idVehiculoDefault = vehiculosExistentes[0]?.id_vehiculo;
  if (!idVehiculoDefault) {
    idVehiculoDefault = crypto.randomUUID();
    await pool.execute("INSERT INTO vehiculo (id_vehiculo, nombre) VALUES (?, 'Moto 1')", [
      idVehiculoDefault,
    ]);
    console.log("+ vehículo por defecto 'Moto 1' creado:", idVehiculoDefault);
  }

  const [sinVehiculo] = await pool.execute(
    "UPDATE registro_mantenimiento SET id_vehiculo = ? WHERE id_vehiculo IS NULL",
    [idVehiculoDefault]
  );
  if (sinVehiculo.affectedRows > 0) {
    console.log(`+ ${sinVehiculo.affectedRows} registro(s) de mantenimiento asignados a 'Moto 1'`);
  }

  await pool.query("ALTER TABLE registro_mantenimiento MODIFY id_vehiculo CHAR(36) NOT NULL");
  if (!(await fkExiste("registro_mantenimiento_vehiculo_fkey"))) {
    await pool.query(`
      ALTER TABLE registro_mantenimiento
        ADD CONSTRAINT registro_mantenimiento_vehiculo_fkey
        FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo)
        ON DELETE RESTRICT ON UPDATE CASCADE
    `);
    console.log("+ FK registro_mantenimiento -> vehiculo agregada");
  }

  // --- 2. Subcategorías ---
  if (!(await columnaExiste("categoria_producto", "id_categoria_padre"))) {
    await pool.query(
      "ALTER TABLE categoria_producto ADD COLUMN id_categoria_padre CHAR(36) NULL AFTER id_categoria"
    );
    console.log("+ columna categoria_producto.id_categoria_padre agregada");
  }
  if (!(await fkExiste("categoria_producto_padre_fkey"))) {
    await pool.query(`
      ALTER TABLE categoria_producto
        ADD CONSTRAINT categoria_producto_padre_fkey
        FOREIGN KEY (id_categoria_padre) REFERENCES categoria_producto(id_categoria)
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log("+ FK categoria_producto -> categoria_producto (padre) agregada");
  }

  // --- 3. Precisión GPS ---
  if (!(await columnaExiste("domicilio", "precision_recogida_m"))) {
    await pool.query("ALTER TABLE domicilio ADD COLUMN precision_recogida_m DOUBLE NULL");
    console.log("+ columna domicilio.precision_recogida_m agregada");
  }
  if (!(await columnaExiste("domicilio", "precision_entrega_m"))) {
    await pool.query("ALTER TABLE domicilio ADD COLUMN precision_entrega_m DOUBLE NULL");
    console.log("+ columna domicilio.precision_entrega_m agregada");
  }

  console.log("\nMigración completa.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en la migración:", err);
  process.exit(1);
});

const fs = require("fs");
const mysql = require("mysql2/promise");

// Un MySQL gestionado en la nube (Aiven y la mayoría de las capas gratis de
// otros proveedores) exige conexión con SSL — el MySQL local de desarrollo
// (mismo Windows, sin nada de por medio) no la necesita y no la pide sola. Se
// activa solo si hay un certificado configurado, así que en local no cambia
// nada. Dos formas de darlo, según convenga:
// - DB_SSL_CA_FILE: ruta a un archivo .pem en disco — la más simple para
//   correr scripts locales (ej. db/seed-aiven.js) con el .pem que baja el
//   proveedor tal cual, sin pelear con saltos de línea dentro de un .env.
// - DB_SSL_CA: el CONTENIDO completo del certificado como texto — para cuando
//   no hay forma de subir un archivo aparte (ej. `fly secrets set`, que sí
//   maneja bien un valor multilínea pasado por la terminal).
function resolverCertificadoCA() {
  if (process.env.DB_SSL_CA_FILE) return fs.readFileSync(process.env.DB_SSL_CA_FILE, "utf8");
  if (process.env.DB_SSL_CA) return process.env.DB_SSL_CA;
  return null;
}
const certificadoCA = resolverCertificadoCA();

// Pool de conexiones: mysql2 gestiona hasta `connectionLimit` conexiones abiertas y
// hace cola (`queueLimit`) para las solicitudes que llegan cuando todas están ocupadas.
// Si el pool se agota y la cola también, `pool.execute()`/`pool.getConnection()`
// rechazan la promesa — se documenta el manejo de ese fallo en aplicativos.md
// (sección de escalabilidad, Milestone 7 del plan de migración).
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  queueLimit: 0,
  waitForConnections: true,
  dateStrings: false,
  ...(certificadoCA ? { ssl: { ca: certificadoCA } } : {}),
});

module.exports = { pool };

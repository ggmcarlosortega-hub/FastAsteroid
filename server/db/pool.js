const mysql = require("mysql2/promise");

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
});

module.exports = { pool };

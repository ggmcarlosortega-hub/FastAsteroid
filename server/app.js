const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { pool } = require("./db/pool");
const authRoutes = require("./routes/auth.routes");
const clientesRoutes = require("./routes/clientes.routes");
const ubicacionesRoutes = require("./routes/ubicaciones.routes");
const domiciliosRoutes = require("./routes/domicilios.routes");
const domiciliariosRoutes = require("./routes/domiciliarios.routes");
const statsRoutes = require("./routes/stats.routes");

const app = express();

// Next.js habla con este servidor a través de un rewrite (mismo origen desde el
// navegador), así que CORS permisivo acá solo importa para pruebas directas contra
// localhost:4000 en desarrollo — no es la puerta de entrada real en producción.
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "up" });
  } catch (err) {
    // Si MySQL no responde (apagado, credenciales inválidas, pool agotado), no se
    // cae el proceso: se informa con 503 para que quien llame sepa que es un fallo
    // temporal de infraestructura, no un error de la solicitud.
    res.status(503).json({ ok: false, db: "down", error: err.message });
  }
});

// /api/auth/* es la única rama pública (sin requireAuth), igual que
// PUBLIC_API_PATHS en Fasteroid/proxy.js.
app.use("/api/auth", authRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/ubicaciones", ubicacionesRoutes);
app.use("/api/domicilios", domiciliosRoutes);
app.use("/api/domiciliarios", domiciliariosRoutes);
app.use("/api/stats", statsRoutes);

// Middleware de error centralizado: cualquier error no capturado en una ruta cae
// acá en vez de tumbar el proceso de Node. Se documenta en detalle en
// aplicativos.md (sección de escalabilidad y manejo de fallos).
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status ?? 500;
  res.status(status).json({ error: err.message ?? "Error interno del servidor" });
});

module.exports = app;

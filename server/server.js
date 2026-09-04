require("dotenv/config");
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const app = require("./app");
const { initRealtime } = require("./lib/realtime");

const PORT = process.env.PORT || 4000;
const WS_HTTPS_PORT = process.env.WS_HTTPS_PORT || 4443;

// Mismos certificados mkcert que ya usa el frontend (Fasteroid/certificates) —
// cuando cambie la IP LAN y se regeneren (procedimiento en OPERACION.md), este
// servidor queda al día solo, sin un paso nuevo. Si no existen (ej. entorno sin
// HTTPS configurado), el socket sigue disponible por HTTP plano en PORT.
const CERT_DIR = path.join(__dirname, "..", "Fasteroid", "certificates");
const KEY_PATH = path.join(CERT_DIR, "localhost-key.pem");
const CERT_PATH = path.join(CERT_DIR, "localhost.pem");

const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
  console.log(`Fasteroid API escuchando en http://localhost:${PORT}`);
});

let httpsServer = null;
if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
  httpsServer = https.createServer(
    { key: fs.readFileSync(KEY_PATH), cert: fs.readFileSync(CERT_PATH) },
    app
  );
  httpsServer.listen(WS_HTTPS_PORT, () => {
    console.log(`Fasteroid API (HTTPS, para el socket) escuchando en https://localhost:${WS_HTTPS_PORT}`);
  });
} else {
  console.log("No se encontraron certificados en Fasteroid/certificates — el socket usará HTTP plano.");
}

initRealtime(httpServer, httpsServer);

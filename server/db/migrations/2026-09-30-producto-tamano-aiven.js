// Corre 2026-09-30-producto-tamano.js pero apuntando a Aiven — mismo patrón
// que seed-aiven.js (lee server/.env.aiven, no server/.env).
require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env.aiven") });
require("./2026-09-30-producto-tamano.js");

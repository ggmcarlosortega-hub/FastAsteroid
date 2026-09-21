// Corre el mismo seed.js pero apuntando a Aiven en vez del MySQL local — lee
// server/.env.aiven (no server/.env) para no arriesgarse a dejar el entorno de
// desarrollo local hablándole por error a producción. .env.aiven ya cae dentro
// del patrón ".env*" de server/.gitignore, así que nunca se sube al repo.
//
// Uso: node db/seed-aiven.js
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.aiven") });
require("./seed.js");

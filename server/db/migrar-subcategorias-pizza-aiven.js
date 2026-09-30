// Corre migrar-subcategorias-pizza.js pero apuntando a Aiven — mismo patrón
// que seed-aiven.js (lee server/.env.aiven, no server/.env).
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.aiven") });
require("./migrar-subcategorias-pizza.js");

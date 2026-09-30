// Corre backfill-tamano-pizzas-bordes.js pero apuntando a Aiven — mismo
// patrón que seed-aiven.js (lee server/.env.aiven, no server/.env).
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.aiven") });
require("./backfill-tamano-pizzas-bordes.js");

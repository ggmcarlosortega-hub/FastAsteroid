// Migración de DATOS de negocio (no de esquema, por eso NO se comitea a git,
// mismo criterio que migrar-subcategorias-pizza.js): rellena producto.tamano
// para las pizzas y bordes ya existentes, parseando la palabra de tamaño que
// hoy vive suelta dentro de `nombre` (ver importar-catalogo-aiven.js):
//   - Pizzas ("Pizzas <Sabor>", hijas de la categoría "Pizzas"): el tamaño es
//     la PRIMERA palabra de nombre, ej. "Jumbo Mixta" -> tamano="Jumbo".
//     Los productos "Porcion <Sabor>" no tienen tamaño de la lista y quedan
//     con tamano=NULL a propósito (una porción no lleva borde).
//   - Bordes (categoría "Bordes"): el tamaño es la ÚLTIMA palabra de nombre,
//     ej. "Borde de Queso Jumbo" -> tamano="Jumbo".
// Idempotente: solo toca filas con tamano IS NULL.
require("dotenv").config();
const { pool } = require("./pool");

const TAMANOS_PIZZA = ["Jumbo", "Grande", "Mediana", "Pequeña", "Pizzeta"];

async function main() {
  const [pizzas] = await pool.execute(`
    SELECT p.id_producto, p.nombre
    FROM producto p
    JOIN categoria_producto c ON c.id_categoria = p.id_categoria
    JOIN categoria_producto padre ON padre.id_categoria = c.id_categoria_padre
    WHERE padre.nombre = 'Pizzas' AND p.tamano IS NULL
  `);

  let actualizadas = 0;
  for (const pizza of pizzas) {
    const primeraPalabra = pizza.nombre.split(" ")[0];
    if (!TAMANOS_PIZZA.includes(primeraPalabra)) continue; // ej. "Porcion <Sabor>" — sin tamaño a propósito
    await pool.execute("UPDATE producto SET tamano = ? WHERE id_producto = ?", [primeraPalabra, pizza.id_producto]);
    console.log(`  + "${pizza.nombre}" -> tamano="${primeraPalabra}"`);
    actualizadas++;
  }
  console.log(`= ${actualizadas} pizza(s) actualizada(s) (${pizzas.length - actualizadas} sin tamaño de lista, ej. porciones)`);

  const [bordes] = await pool.execute(`
    SELECT p.id_producto, p.nombre
    FROM producto p
    JOIN categoria_producto c ON c.id_categoria = p.id_categoria
    WHERE c.nombre = 'Bordes' AND p.tamano IS NULL
  `);

  let bordesActualizados = 0;
  for (const borde of bordes) {
    const palabras = borde.nombre.trim().split(" ");
    const ultimaPalabra = palabras[palabras.length - 1];
    if (!TAMANOS_PIZZA.includes(ultimaPalabra)) {
      console.log(`  ! "${borde.nombre}" no termina en un tamaño reconocido, se deja sin tamaño`);
      continue;
    }
    await pool.execute("UPDATE producto SET tamano = ? WHERE id_producto = ?", [ultimaPalabra, borde.id_producto]);
    console.log(`  + "${borde.nombre}" -> tamano="${ultimaPalabra}"`);
    bordesActualizados++;
  }
  console.log(`= ${bordesActualizados} borde(s) actualizado(s)`);

  console.log("\nBackfill de tamano completo.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en el backfill:", err);
  process.exit(1);
});

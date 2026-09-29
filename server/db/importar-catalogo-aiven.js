// Importa el catálogo completo (pizzas, hamburguesas, perros, salchipapas,
// picadas, comida rápida, arepizza y bordes) al Aiven de producción —
// transcrito del menú físico "DAY-PIZZA" que envió el usuario. Idempotente:
// si un producto con ese nombre ya existe, se salta (no lo duplica ni lo
// pisa), así se puede correr más de una vez sin miedo.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.aiven") });
const crypto = require("crypto");
const { pool } = require("./pool");

const TAMANOS_PIZZA = ["Jumbo", "Grande", "Mediana", "Pequeña", "Pizzeta"];

// [Jumbo, Grande, Mediana, Pequeña, Pizzeta], Porcion siempre $17.000 salvo
// que se indique lo contrario (Pollo/Trifasica/Semipaisa cobran más caro).
const SABORES_PIZZA = [
  { categoria: "Pizzas Mixta", precios: [112000, 76000, 56000, 45000, 34000], porcion: 17000 },
  { categoria: "Pizzas Pollo", precios: [117000, 78000, 58000, 47000, 36000], porcion: 17000 },
  { categoria: "Pizzas Margarita", precios: [106000, 73000, 54000, 43000, 32000], porcion: 17000 },
  { categoria: "Pizzas Tropical", precios: [112000, 76000, 58000, 47000, 36000], porcion: 17000 },
  { categoria: "Pizzas Trifasica", precios: [117000, 84000, 65000, 54000, 43000], porcion: 17000 },
  { categoria: "Pizzas Jamon y queso", precios: [112000, 76000, 56000, 45000, 34000], porcion: 17000 },
  { categoria: "Pizzas Semipaisa", precios: [117000, 84000, 65000, 54000, 43000], porcion: 17000 },
  { categoria: "Pizzas Napolitana", precios: [112000, 76000, 56000, 45000, 34000], porcion: 17000 },
  { categoria: "Pizzas Legumbre", precios: [112000, 76000, 56000, 45000, 34000], porcion: 17000 },
];

function nombreSaborDeCategoria(categoria) {
  // "Pizzas Jamon y queso" -> "Jamon y queso"
  return categoria.replace(/^Pizzas /, "");
}

function construirProductosPizza() {
  const productos = [];
  for (const { categoria, precios, porcion } of SABORES_PIZZA) {
    const sabor = nombreSaborDeCategoria(categoria);
    TAMANOS_PIZZA.forEach((tamano, i) => {
      productos.push({ nombre: `${tamano} ${sabor}`, precio_venta: precios[i], categoria });
    });
    productos.push({ nombre: `Porcion ${sabor}`, precio_venta: porcion, categoria });
  }
  return productos;
}

const PRODUCTOS = [
  ...construirProductosPizza(),

  // Arepizza (champiñones, pollo, salami y tocineta) — categoría ya existía vacía.
  { nombre: "4 Porciones Arepizza", precio_venta: 43000, categoria: "Pizzas Arepizza" },
  { nombre: "6 Porciones Arepizza", precio_venta: 54000, categoria: "Pizzas Arepizza" },
  { nombre: "8 Porciones Arepizza", precio_venta: 65000, categoria: "Pizzas Arepizza" },
  { nombre: "10 Porciones Arepizza", precio_venta: 84000, categoria: "Pizzas Arepizza" },
  { nombre: "14 Porciones Arepizza", precio_venta: 117000, categoria: "Pizzas Arepizza" },

  // Hamburguesas
  { nombre: "Hamburguesa Sencilla", precio_venta: 23000, categoria: "Hamburguesas" },
  { nombre: "Mega-Hamburguesa", precio_venta: 30000, categoria: "Hamburguesas" },
  { nombre: "Mini-Hamburguesa Sencilla", precio_venta: 17000, categoria: "Hamburguesas" },
  { nombre: "Hamburguesa Rigo's", precio_venta: 25000, categoria: "Hamburguesas" },
  { nombre: "Mini-Hamburguesa Rigo's", precio_venta: 20000, categoria: "Hamburguesas" },

  // Perros
  { nombre: "Perro Sencillo", precio_venta: 15000, categoria: "Perros" },
  { nombre: "Mini-Perro Sencillo", precio_venta: 12000, categoria: "Perros" },
  { nombre: "Chori-Perro", precio_venta: 18000, categoria: "Perros" },
  { nombre: "Perra-Rigo's", precio_venta: 17000, categoria: "Perros" },
  { nombre: "Mini-Perro Rigo's", precio_venta: 14000, categoria: "Perros" },
  { nombre: "Perro Rigo's", precio_venta: 17000, categoria: "Perros" },

  // Salchipapa
  { nombre: "Mini-Salchipapa Sencilla", precio_venta: 17000, categoria: "Salchipapa" },
  { nombre: "Salchipapa Sencilla", precio_venta: 22000, categoria: "Salchipapa" },
  { nombre: "Salchipapa Mega Especial", precio_venta: 33000, categoria: "Salchipapa" },
  { nombre: "Mini-Salchipapa Especial", precio_venta: 19000, categoria: "Salchipapa" },
  { nombre: "Salchipapa Especial", precio_venta: 26000, categoria: "Salchipapa" },

  // Picada
  { nombre: "Picada Mini", precio_venta: 45000, categoria: "Picada" },
  { nombre: "Picada Pequeña", precio_venta: 62000, categoria: "Picada" },
  { nombre: "Picada a la BBQ", precio_venta: 30000, categoria: "Picada" },
  { nombre: "Patacon con Todo", precio_venta: 54000, categoria: "Picada" },
  { nombre: "Picada Mediana", precio_venta: 84000, categoria: "Picada" },
  { nombre: "Picada Grande", precio_venta: 106000, categoria: "Picada" },

  // Comida rápida (chuzo, sandwich, gratinado, pollo a la plancha)
  { nombre: "Chuzo de Pollo", precio_venta: 20000, categoria: "Comida rapida" },
  { nombre: "Sandwich Mini", precio_venta: 17000, categoria: "Comida rapida" },
  { nombre: "Sandwich Grande", precio_venta: 23000, categoria: "Comida rapida" },
  { nombre: "Gratinado de Pollo", precio_venta: 25000, categoria: "Comida rapida" },
  { nombre: "Pollo a la Plancha", precio_venta: 30000, categoria: "Comida rapida" },

  // Bordes — categoría nueva, no existía en Aiven todavía.
  { nombre: "Borde Bocadillo Jumbo", precio_venta: 14000, categoria: "Bordes" },
  { nombre: "Borde Bocadillo Grande", precio_venta: 12000, categoria: "Bordes" },
  { nombre: "Borde Bocadillo Mediana", precio_venta: 11000, categoria: "Bordes" },
  { nombre: "Borde Bocadillo Pequeña", precio_venta: 9000, categoria: "Bordes" },
  { nombre: "Borde Bocadillo Pizzeta", precio_venta: 8000, categoria: "Bordes" },
  { nombre: "Borde de Queso Jumbo", precio_venta: 14000, categoria: "Bordes" },
  { nombre: "Borde de Queso Grande", precio_venta: 12000, categoria: "Bordes" },
  { nombre: "Borde de Queso Mediana", precio_venta: 11000, categoria: "Bordes" },
  { nombre: "Borde de Queso Pequeña", precio_venta: 9000, categoria: "Bordes" },
  { nombre: "Borde de Queso Pizzeta", precio_venta: 8000, categoria: "Bordes" },

  // Jugos cítricos — solo vienen en agua, sin variante en leche.
  { nombre: "Jugo de Mandarina", precio_venta: 13000, categoria: "Jugos citricos" },
  { nombre: "Jugo de Limón", precio_venta: 9000, categoria: "Jugos citricos" },
  { nombre: "Jugo de Acerezado", precio_venta: 12000, categoria: "Jugos citricos" },
  { nombre: "Limonada de Coco", precio_venta: 14000, categoria: "Jugos citricos" },
  { nombre: "Limonada de Yerbabuena", precio_venta: 14000, categoria: "Jugos citricos" },
  { nombre: "Jugo de Tamarindo", precio_venta: 9000, categoria: "Jugos citricos" },
  { nombre: "Jugo de Maracuyá", precio_venta: 9000, categoria: "Jugos citricos" },

  // Jugos naturales — cada uno en dos versiones (agua/leche), precio distinto.
  { nombre: "Jugo de Mango en Agua", precio_venta: 9000, categoria: "Jugos Naturales" },
  { nombre: "Jugo de Mango en Leche", precio_venta: 12000, categoria: "Jugos Naturales" },
  { nombre: "Jugo de Fresa en Agua", precio_venta: 9000, categoria: "Jugos Naturales" },
  { nombre: "Jugo de Fresa en Leche", precio_venta: 12000, categoria: "Jugos Naturales" },
  { nombre: "Jugo de Mora en Agua", precio_venta: 9000, categoria: "Jugos Naturales" },
  { nombre: "Jugo de Mora en Leche", precio_venta: 12000, categoria: "Jugos Naturales" },
  { nombre: "Milo en Agua", precio_venta: 12000, categoria: "Jugos Naturales" },
  { nombre: "Milo en Leche", precio_venta: 14000, categoria: "Jugos Naturales" },
  { nombre: "Jugo de Borojó en Agua", precio_venta: 9000, categoria: "Jugos Naturales" },
  { nombre: "Jugo de Borojó en Leche", precio_venta: 12000, categoria: "Jugos Naturales" },
  { nombre: "Jugo de Guanábana en Agua", precio_venta: 9000, categoria: "Jugos Naturales" },
  { nombre: "Jugo de Guanábana en Leche", precio_venta: 12000, categoria: "Jugos Naturales" },
  { nombre: "Jugo de Zapote en Agua", precio_venta: 12000, categoria: "Jugos Naturales" },
  { nombre: "Jugo de Zapote en Leche", precio_venta: 14000, categoria: "Jugos Naturales" },
  { nombre: "Jugo de Níspero en Agua", precio_venta: 9000, categoria: "Jugos Naturales" },
  { nombre: "Jugo de Níspero en Leche", precio_venta: 14000, categoria: "Jugos Naturales" },
  { nombre: "Café en Agua", precio_venta: 8000, categoria: "Jugos Naturales" },
  { nombre: "Café con Leche", precio_venta: 9000, categoria: "Jugos Naturales" },

  // Micheladas
  { nombre: "Michelada Cerveza", precio_venta: 9000, categoria: "Micheladas" },
  { nombre: "Michelada Canada Dry", precio_venta: 9000, categoria: "Micheladas" },
  { nombre: "Michelada Soda", precio_venta: 8000, categoria: "Micheladas" },
  { nombre: "Michelada Quatro", precio_venta: 9000, categoria: "Micheladas" },
];

async function obtenerOCrearCategoria(nombre, cacheCategorias) {
  if (cacheCategorias.has(nombre)) return cacheCategorias.get(nombre);

  const [rows] = await pool.execute("SELECT id_categoria FROM categoria_producto WHERE nombre = ?", [nombre]);
  if (rows[0]) {
    cacheCategorias.set(nombre, rows[0].id_categoria);
    return rows[0].id_categoria;
  }

  const id_categoria = crypto.randomUUID();
  await pool.execute("INSERT INTO categoria_producto (id_categoria, nombre) VALUES (?, ?)", [id_categoria, nombre]);
  console.log(`  + categoría nueva creada: "${nombre}"`);
  cacheCategorias.set(nombre, id_categoria);
  return id_categoria;
}

async function main() {
  const cacheCategorias = new Map();
  let creados = 0;
  let saltados = 0;

  for (const p of PRODUCTOS) {
    const [existentes] = await pool.execute("SELECT id_producto FROM producto WHERE nombre = ?", [p.nombre]);
    if (existentes[0]) {
      console.log(`  = ya existía, saltado: "${p.nombre}"`);
      saltados++;
      continue;
    }

    const id_categoria = await obtenerOCrearCategoria(p.categoria, cacheCategorias);
    await pool.execute(
      "INSERT INTO producto (id_producto, nombre, precio_venta, activo, id_categoria) VALUES (?, ?, ?, TRUE, ?)",
      [crypto.randomUUID(), p.nombre, p.precio_venta, id_categoria]
    );
    console.log(`  + creado: "${p.nombre}" ($${p.precio_venta.toLocaleString("es-CO")}) en "${p.categoria}"`);
    creados++;
  }

  console.log(`\nListo. Creados: ${creados}. Ya existían (saltados): ${saltados}. Total en el archivo: ${PRODUCTOS.length}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error importando el catálogo:", err);
  process.exit(1);
});

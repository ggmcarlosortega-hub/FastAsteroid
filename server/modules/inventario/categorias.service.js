const crypto = require("crypto");
const { pool } = require("../../db/pool");
const { ServiceError } = require("../../lib/service-error");
const { emitCambio } = require("../../lib/realtime");

function hydrate(row) {
  return {
    id_categoria: row.id_categoria,
    nombre: row.nombre,
    id_categoria_padre: row.id_categoria_padre,
    categoria_padre:
      row.id_categoria_padre != null ? { id_categoria: row.id_categoria_padre, nombre: row.nombre_padre } : null,
    fecha_creacion: row.fecha_creacion,
  };
}

// Subcategorías (ej. "Pizzas Rigos" bajo "Pizzas"): un solo nivel de
// profundidad — a propósito, no un árbol arbitrario. listCategorias() trae la
// jerarquía completa de una sola consulta (LEFT JOIN a sí misma) para que la
// vista pueda agrupar sin pedir cada padre aparte.
async function listCategorias() {
  const [rows] = await pool.execute(
    `SELECT c.id_categoria, c.nombre, c.id_categoria_padre, c.fecha_creacion, p.nombre AS nombre_padre
     FROM categoria_producto c
     LEFT JOIN categoria_producto p ON p.id_categoria = c.id_categoria_padre
     ORDER BY COALESCE(p.nombre, c.nombre) ASC, (c.id_categoria_padre IS NULL) DESC, c.nombre ASC`
  );
  return rows.map(hydrate);
}

// Valida que id_categoria_padre (si viene) sea una categoría raíz existente
// (sin padre propio) y, en edición, que la categoría que se está guardando no
// tenga ya hijos — ambas cosas mantienen la jerarquía en exactamente dos
// niveles, nunca un árbol más profundo.
async function validarPadre(id_categoria_padre, idPropio = null) {
  if (id_categoria_padre == null) return null;
  if (id_categoria_padre === idPropio) {
    throw new ServiceError("Una categoría no puede ser su propia categoría padre", 400);
  }

  const [padreRows] = await pool.execute(
    "SELECT id_categoria, id_categoria_padre FROM categoria_producto WHERE id_categoria = ?",
    [id_categoria_padre]
  );
  if (!padreRows[0]) {
    throw new ServiceError("La categoría padre indicada no existe", 400);
  }
  if (padreRows[0].id_categoria_padre != null) {
    throw new ServiceError("La categoría padre no puede ser a su vez una subcategoría", 400);
  }

  if (idPropio) {
    const [hijosRows] = await pool.execute(
      "SELECT COUNT(*) AS n FROM categoria_producto WHERE id_categoria_padre = ?",
      [idPropio]
    );
    if (hijosRows[0].n > 0) {
      throw new ServiceError("Esta categoría ya tiene subcategorías propias y no puede pasar a ser una subcategoría", 400);
    }
  }

  return id_categoria_padre;
}

async function createCategoria({ nombre, id_categoria_padre }) {
  nombre = nombre?.trim();
  if (!nombre) {
    throw new ServiceError("nombre es obligatorio", 400);
  }
  const padre = await validarPadre(id_categoria_padre || null);

  const id_categoria = crypto.randomUUID();
  try {
    await pool.execute(
      "INSERT INTO categoria_producto (id_categoria, nombre, id_categoria_padre) VALUES (?, ?, ?)",
      [id_categoria, nombre, padre]
    );
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ServiceError("Ya existe una categoría con ese nombre", 409);
    }
    throw err;
  }

  emitCambio("categorias:changed");
  const [rows] = await pool.execute(
    `SELECT c.id_categoria, c.nombre, c.id_categoria_padre, c.fecha_creacion, p.nombre AS nombre_padre
     FROM categoria_producto c LEFT JOIN categoria_producto p ON p.id_categoria = c.id_categoria_padre
     WHERE c.id_categoria = ?`,
    [id_categoria]
  );
  return hydrate(rows[0]);
}

async function updateCategoria(id, { nombre, id_categoria_padre }) {
  nombre = nombre?.trim();
  if (!nombre) {
    throw new ServiceError("nombre es obligatorio", 400);
  }
  const padre = await validarPadre(id_categoria_padre || null, id);

  try {
    const [result] = await pool.execute(
      "UPDATE categoria_producto SET nombre = ?, id_categoria_padre = ? WHERE id_categoria = ?",
      [nombre, padre, id]
    );
    if (result.affectedRows === 0) {
      throw new ServiceError("Categoría no encontrada", 404);
    }
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ServiceError("Ya existe una categoría con ese nombre", 409);
    }
    throw err;
  }

  emitCambio("categorias:changed");
  const [rows] = await pool.execute(
    `SELECT c.id_categoria, c.nombre, c.id_categoria_padre, c.fecha_creacion, p.nombre AS nombre_padre
     FROM categoria_producto c LEFT JOIN categoria_producto p ON p.id_categoria = c.id_categoria_padre
     WHERE c.id_categoria = ?`,
    [id]
  );
  return hydrate(rows[0]);
}

async function deleteCategoria(id) {
  // ON DELETE SET NULL en producto.id_categoria — a diferencia de proveedor, borrar
  // una categoría nunca se bloquea: los productos que la tenían quedan sin categoría.
  // Igual, ON DELETE SET NULL en categoria_producto_padre_fkey: si esta categoría
  // tenía subcategorías, quedan sin padre (vuelven a ser categorías raíz), no se
  // borran en cascada.
  const [result] = await pool.execute("DELETE FROM categoria_producto WHERE id_categoria = ?", [id]);
  if (result.affectedRows === 0) {
    throw new ServiceError("Categoría no encontrada", 404);
  }
  emitCambio("categorias:changed");
  // Los productos que tenían esta categoría quedaron con id_categoria = NULL.
  emitCambio("productos:changed");
}

module.exports = { listCategorias, createCategoria, updateCategoria, deleteCategoria };

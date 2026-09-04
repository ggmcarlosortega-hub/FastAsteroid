const crypto = require("crypto");
const { pool } = require("../../db/pool");
const { ServiceError } = require("../../lib/service-error");
const { emitCambio } = require("../../lib/realtime");

function hydrate(row) {
  return {
    id_categoria: row.id_categoria,
    nombre: row.nombre,
    fecha_creacion: row.fecha_creacion,
  };
}

async function listCategorias() {
  const [rows] = await pool.execute(
    "SELECT id_categoria, nombre, fecha_creacion FROM categoria_producto ORDER BY nombre ASC"
  );
  return rows.map(hydrate);
}

async function createCategoria({ nombre }) {
  nombre = nombre?.trim();
  if (!nombre) {
    throw new ServiceError("nombre es obligatorio", 400);
  }

  const id_categoria = crypto.randomUUID();
  try {
    await pool.execute("INSERT INTO categoria_producto (id_categoria, nombre) VALUES (?, ?)", [
      id_categoria,
      nombre,
    ]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ServiceError("Ya existe una categoría con ese nombre", 409);
    }
    throw err;
  }

  const [rows] = await pool.execute(
    "SELECT id_categoria, nombre, fecha_creacion FROM categoria_producto WHERE id_categoria = ?",
    [id_categoria]
  );
  emitCambio("categorias:changed");
  return hydrate(rows[0]);
}

async function updateCategoria(id, { nombre }) {
  nombre = nombre?.trim();
  if (!nombre) {
    throw new ServiceError("nombre es obligatorio", 400);
  }

  try {
    const [result] = await pool.execute(
      "UPDATE categoria_producto SET nombre = ? WHERE id_categoria = ?",
      [nombre, id]
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

  const [rows] = await pool.execute(
    "SELECT id_categoria, nombre, fecha_creacion FROM categoria_producto WHERE id_categoria = ?",
    [id]
  );
  emitCambio("categorias:changed");
  return hydrate(rows[0]);
}

async function deleteCategoria(id) {
  // ON DELETE SET NULL en producto.id_categoria — a diferencia de proveedor, borrar
  // una categoría nunca se bloquea: los productos que la tenían quedan sin categoría.
  const [result] = await pool.execute("DELETE FROM categoria_producto WHERE id_categoria = ?", [id]);
  if (result.affectedRows === 0) {
    throw new ServiceError("Categoría no encontrada", 404);
  }
  emitCambio("categorias:changed");
  // Los productos que tenían esta categoría quedaron con id_categoria = NULL.
  emitCambio("productos:changed");
}

module.exports = { listCategorias, createCategoria, updateCategoria, deleteCategoria };

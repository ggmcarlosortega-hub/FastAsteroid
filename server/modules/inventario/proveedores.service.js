const crypto = require("crypto");
const { pool } = require("../../db/pool");
const { ServiceError } = require("../../lib/service-error");
const { emitCambio } = require("../../lib/realtime");

function hydrate(row) {
  return {
    id_proveedor: row.id_proveedor,
    nombre: row.nombre,
    telefono: row.telefono,
    fecha_creacion: row.fecha_creacion,
  };
}

async function listProveedores() {
  const [rows] = await pool.execute(
    "SELECT id_proveedor, nombre, telefono, fecha_creacion FROM proveedor ORDER BY nombre ASC"
  );
  return rows.map(hydrate);
}

async function createProveedor({ nombre, telefono }) {
  nombre = nombre?.trim();
  telefono = telefono?.trim() || null;

  if (!nombre) {
    throw new ServiceError("nombre es obligatorio", 400);
  }

  const id_proveedor = crypto.randomUUID();
  await pool.execute("INSERT INTO proveedor (id_proveedor, nombre, telefono) VALUES (?, ?, ?)", [
    id_proveedor,
    nombre,
    telefono,
  ]);

  const [rows] = await pool.execute(
    "SELECT id_proveedor, nombre, telefono, fecha_creacion FROM proveedor WHERE id_proveedor = ?",
    [id_proveedor]
  );
  emitCambio("proveedores:changed");
  return hydrate(rows[0]);
}

async function updateProveedor(id, { nombre, telefono }) {
  nombre = nombre?.trim();
  telefono = telefono?.trim() || null;

  if (!nombre) {
    throw new ServiceError("nombre es obligatorio", 400);
  }

  const [result] = await pool.execute("UPDATE proveedor SET nombre = ?, telefono = ? WHERE id_proveedor = ?", [
    nombre,
    telefono,
    id,
  ]);
  if (result.affectedRows === 0) {
    throw new ServiceError("Proveedor no encontrado", 404);
  }

  const [rows] = await pool.execute(
    "SELECT id_proveedor, nombre, telefono, fecha_creacion FROM proveedor WHERE id_proveedor = ?",
    [id]
  );
  emitCambio("proveedores:changed");
  return hydrate(rows[0]);
}

async function deleteProveedor(id) {
  try {
    const [result] = await pool.execute("DELETE FROM proveedor WHERE id_proveedor = ?", [id]);
    if (result.affectedRows === 0) {
      throw new Error("Proveedor no encontrado");
    }
  } catch {
    throw new ServiceError(
      "No se pudo eliminar (verifica que el proveedor exista y no tenga compras asociadas)",
      409
    );
  }
  emitCambio("proveedores:changed");
}

module.exports = { listProveedores, createProveedor, updateProveedor, deleteProveedor };

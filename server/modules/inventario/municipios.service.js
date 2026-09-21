const crypto = require("crypto");
const { pool } = require("../../db/pool");
const { ServiceError } = require("../../lib/service-error");
const { emitCambio } = require("../../lib/realtime");

function hydrate(row) {
  return {
    id_municipio: row.id_municipio,
    nombre: row.nombre,
    recargo_domicilio: Number(row.recargo_domicilio),
  };
}

async function listMunicipios() {
  const [rows] = await pool.execute(
    "SELECT id_municipio, nombre, recargo_domicilio FROM municipio ORDER BY nombre ASC"
  );
  return rows.map(hydrate);
}

function validar({ nombre, recargo_domicilio }) {
  nombre = nombre?.trim();
  const recargo = Number(recargo_domicilio);
  if (!nombre) {
    throw new ServiceError("nombre es obligatorio", 400);
  }
  if (!Number.isFinite(recargo) || recargo < 0) {
    throw new ServiceError("recargo_domicilio debe ser un número mayor o igual a 0", 400);
  }
  return { nombre, recargo };
}

async function createMunicipio(data) {
  const { nombre, recargo } = validar(data);

  const id_municipio = crypto.randomUUID();
  try {
    await pool.execute("INSERT INTO municipio (id_municipio, nombre, recargo_domicilio) VALUES (?, ?, ?)", [
      id_municipio,
      nombre,
      recargo,
    ]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ServiceError("Ya existe un municipio con ese nombre", 409);
    }
    throw err;
  }

  const [rows] = await pool.execute(
    "SELECT id_municipio, nombre, recargo_domicilio FROM municipio WHERE id_municipio = ?",
    [id_municipio]
  );
  emitCambio("municipios:changed");
  return hydrate(rows[0]);
}

async function updateMunicipio(id, data) {
  const { nombre, recargo } = validar(data);

  try {
    const [result] = await pool.execute(
      "UPDATE municipio SET nombre = ?, recargo_domicilio = ? WHERE id_municipio = ?",
      [nombre, recargo, id]
    );
    if (result.affectedRows === 0) {
      throw new ServiceError("Municipio no encontrado", 404);
    }
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ServiceError("Ya existe un municipio con ese nombre", 409);
    }
    throw err;
  }

  const [rows] = await pool.execute(
    "SELECT id_municipio, nombre, recargo_domicilio FROM municipio WHERE id_municipio = ?",
    [id]
  );
  emitCambio("municipios:changed");
  return hydrate(rows[0]);
}

async function deleteMunicipio(id) {
  // ON DELETE SET NULL en ubicacion.id_municipio — borrar un municipio nunca se
  // bloquea: las direcciones que lo tenían quedan sin municipio (sin recargo).
  const [result] = await pool.execute("DELETE FROM municipio WHERE id_municipio = ?", [id]);
  if (result.affectedRows === 0) {
    throw new ServiceError("Municipio no encontrado", 404);
  }
  emitCambio("municipios:changed");
  emitCambio("clientes:changed");
}

module.exports = { listMunicipios, createMunicipio, updateMunicipio, deleteMunicipio };

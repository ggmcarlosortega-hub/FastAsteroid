const crypto = require("crypto");
const { pool } = require("../../db/pool");
const { ServiceError } = require("../../lib/service-error");
const { emitCambio } = require("../../lib/realtime");

function hydrate(row) {
  return {
    id_vehiculo: row.id_vehiculo,
    nombre: row.nombre,
    placa: row.placa,
    activo: !!row.activo,
  };
}

// Lista completa (activos e inactivos) — la pantalla de Vehículos necesita ver
// también los dados de baja, a diferencia del selector de "registrar
// mantenimiento" (soloActivos) que solo debe ofrecer vehículos en uso.
async function listVehiculos({ soloActivos = false } = {}) {
  const where = soloActivos ? "WHERE activo = TRUE" : "";
  const [rows] = await pool.execute(
    `SELECT id_vehiculo, nombre, placa, activo FROM vehiculo ${where} ORDER BY nombre ASC`
  );
  return rows.map(hydrate);
}

function validar({ nombre, placa }) {
  nombre = nombre?.trim();
  placa = placa?.trim() || null;
  if (!nombre) {
    throw new ServiceError("nombre es obligatorio", 400);
  }
  return { nombre, placa };
}

async function createVehiculo(data) {
  const { nombre, placa } = validar(data);

  const id_vehiculo = crypto.randomUUID();
  try {
    await pool.execute("INSERT INTO vehiculo (id_vehiculo, nombre, placa) VALUES (?, ?, ?)", [
      id_vehiculo,
      nombre,
      placa,
    ]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ServiceError("Ya existe un vehículo con esa placa", 409);
    }
    throw err;
  }

  const [rows] = await pool.execute("SELECT id_vehiculo, nombre, placa, activo FROM vehiculo WHERE id_vehiculo = ?", [
    id_vehiculo,
  ]);
  emitCambio("vehiculos:changed");
  return hydrate(rows[0]);
}

async function updateVehiculo(id, data) {
  const { nombre, placa } = validar(data);
  const activo = data.activo !== false;

  try {
    const [result] = await pool.execute(
      "UPDATE vehiculo SET nombre = ?, placa = ?, activo = ? WHERE id_vehiculo = ?",
      [nombre, placa, activo, id]
    );
    if (result.affectedRows === 0) {
      throw new ServiceError("Vehículo no encontrado", 404);
    }
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ServiceError("Ya existe un vehículo con esa placa", 409);
    }
    throw err;
  }

  const [rows] = await pool.execute("SELECT id_vehiculo, nombre, placa, activo FROM vehiculo WHERE id_vehiculo = ?", [
    id,
  ]);
  emitCambio("vehiculos:changed");
  return hydrate(rows[0]);
}

module.exports = { listVehiculos, createVehiculo, updateVehiculo };

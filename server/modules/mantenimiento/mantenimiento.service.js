const crypto = require("crypto");
const { pool } = require("../../db/pool");
const { ServiceError } = require("../../lib/service-error");
const { emitCambio } = require("../../lib/realtime");

const TIPOS_VALIDOS = ["Tanqueo", "Taller", "Compra_Adicional"];
// Fase 3: cada cuántos km desde el último Taller se avisa que puede tocar una
// revisión (cambio de aceite, etc.) — umbral genérico, confirmado con el negocio.
const KM_ALERTA_TALLER = 2000;

function hydrate(row) {
  return {
    id_registro: row.id_registro,
    fecha_hora: row.fecha_hora,
    kilometraje_actual: row.kilometraje_actual,
    tipo: row.tipo,
    galones_ingresados: row.galones_ingresados != null ? Number(row.galones_ingresados) : null,
    costo_total: row.costo_total != null ? Number(row.costo_total) : null,
    descripcion_compras_y_taller: row.descripcion_compras_y_taller,
  };
}

// Historial completo, con el rendimiento (km/galón) calculado entre cada par de
// tanqueos consecutivos (CU-19): kilómetros recorridos desde el tanqueo anterior,
// dividido por los galones cargados en este. Se omite el cálculo para el primer
// tanqueo (no hay anterior) y para pares donde el kilometraje no avanzó (dato mal
// ingresado) — nunca se muestra un rendimiento negativo o infinito.
async function listRegistros() {
  const [rows] = await pool.execute("SELECT * FROM registro_mantenimiento ORDER BY fecha_hora ASC");
  const registros = rows.map(hydrate);

  let tanqueoAnterior = null;
  for (const registro of registros) {
    if (registro.tipo !== "Tanqueo") continue;
    if (tanqueoAnterior) {
      const kmRecorridos = registro.kilometraje_actual - tanqueoAnterior.kilometraje_actual;
      if (kmRecorridos > 0 && registro.galones_ingresados > 0) {
        registro.rendimiento_km_galon = kmRecorridos / registro.galones_ingresados;
      }
    }
    tanqueoAnterior = registro;
  }

  return registros.reverse();
}

async function createRegistro({
  tipo,
  kilometraje_actual,
  galones_ingresados,
  costo_total,
  descripcion_compras_y_taller,
}) {
  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw new ServiceError("tipo inválido", 400);
  }

  const km = Number(kilometraje_actual);
  if (!Number.isFinite(km) || km < 0) {
    throw new ServiceError("kilometraje_actual debe ser un número válido", 400);
  }

  // El kilometraje de la moto no puede retroceder (CU-18, excepción A1).
  const [ultimoRows] = await pool.execute(
    "SELECT kilometraje_actual FROM registro_mantenimiento ORDER BY fecha_hora DESC LIMIT 1"
  );
  if (ultimoRows[0] && km < ultimoRows[0].kilometraje_actual) {
    throw new ServiceError(
      `El kilometraje no puede ser menor al último registrado (${ultimoRows[0].kilometraje_actual})`,
      400
    );
  }

  const costo = Number(costo_total);
  if (!Number.isFinite(costo) || costo <= 0) {
    throw new ServiceError("costo_total debe ser mayor a 0", 400);
  }

  let galones = null;
  if (tipo === "Tanqueo") {
    galones = Number(galones_ingresados);
    if (!Number.isFinite(galones) || galones <= 0) {
      throw new ServiceError("galones_ingresados debe ser mayor a 0", 400);
    }
  }

  const descripcion = descripcion_compras_y_taller?.trim() || null;
  if (tipo !== "Tanqueo" && !descripcion) {
    throw new ServiceError("La descripción es obligatoria para Taller o Compra Adicional", 400);
  }

  const id_registro = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO registro_mantenimiento
       (id_registro, kilometraje_actual, tipo, galones_ingresados, costo_total, descripcion_compras_y_taller)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id_registro, km, tipo, galones, costo, descripcion]
  );

  const [rows] = await pool.execute("SELECT * FROM registro_mantenimiento WHERE id_registro = ?", [
    id_registro,
  ]);
  emitCambio("mantenimiento:changed");
  return hydrate(rows[0]);
}

// Fase 3: compara el kilometraje del último registro (de cualquier tipo — un
// Tanqueo también refleja el kilometraje actual de la moto) contra el del último
// Taller. Si nunca hubo un Taller registrado, no hay contra qué comparar.
async function getAlertaPreventiva() {
  const [actualRows] = await pool.execute(
    "SELECT kilometraje_actual FROM registro_mantenimiento ORDER BY fecha_hora DESC LIMIT 1"
  );
  const [tallerRows] = await pool.execute(
    "SELECT kilometraje_actual FROM registro_mantenimiento WHERE tipo = 'Taller' ORDER BY fecha_hora DESC LIMIT 1"
  );

  const km_actual = actualRows[0]?.kilometraje_actual ?? null;
  const km_ultimo_taller = tallerRows[0]?.kilometraje_actual ?? null;

  if (km_actual == null || km_ultimo_taller == null) {
    return {
      debeAlertar: false,
      km_actual,
      km_ultimo_taller,
      km_desde_taller: null,
      km_restantes: null,
      umbral_km: KM_ALERTA_TALLER,
    };
  }

  const km_desde_taller = km_actual - km_ultimo_taller;
  return {
    debeAlertar: km_desde_taller >= KM_ALERTA_TALLER,
    km_actual,
    km_ultimo_taller,
    km_desde_taller,
    km_restantes: Math.max(KM_ALERTA_TALLER - km_desde_taller, 0),
    umbral_km: KM_ALERTA_TALLER,
  };
}

module.exports = { listRegistros, createRegistro, getAlertaPreventiva };

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
    id_vehiculo: row.id_vehiculo,
    fecha_hora: row.fecha_hora,
    kilometraje_actual: row.kilometraje_actual,
    tipo: row.tipo,
    galones_ingresados: row.galones_ingresados != null ? Number(row.galones_ingresados) : null,
    costo_total: row.costo_total != null ? Number(row.costo_total) : null,
    descripcion_compras_y_taller: row.descripcion_compras_y_taller,
  };
}

// Calcula, IN PLACE, el rendimiento (km/galón) entre cada par de tanqueos
// consecutivos de una secuencia que ya pertenece a UN SOLO vehículo (CU-19):
// kilómetros recorridos desde el tanqueo anterior, dividido por los galones
// cargados en este. Se omite para el primer tanqueo de la secuencia (no hay
// anterior) y para pares donde el kilometraje no avanzó (dato mal ingresado).
// `registros` debe venir ordenado por fecha_hora ASC.
function calcularRendimientos(registros) {
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
}

// Historial de UN vehículo. Antes el rendimiento se calculaba sobre TODOS los
// registros sin distinguir vehículo — con más de uno activo, eso mezclaba
// kilometrajes de motos distintas y daba rendimientos sin sentido.
async function listRegistros(id_vehiculo) {
  if (!id_vehiculo) {
    throw new ServiceError("id_vehiculo es obligatorio", 400);
  }
  const [rows] = await pool.execute(
    "SELECT * FROM registro_mantenimiento WHERE id_vehiculo = ? ORDER BY fecha_hora ASC",
    [id_vehiculo]
  );
  const registros = rows.map(hydrate);
  calcularRendimientos(registros);
  return registros.reverse();
}

// Registros de TODOS los vehículos (activos e inactivos, para no perder gasto
// histórico de una moto ya dada de baja), usado solo para los agregados
// financieros mensuales del dashboard (gasto total de combustible/taller,
// rendimiento promedio). El rendimiento de cada registro se calcula dentro de
// la secuencia de SU PROPIO vehículo antes de juntarlos — nunca se mezclan
// kilometrajes entre vehículos distintos, aunque el resultado final sí los
// liste juntos.
async function listTodosLosRegistros() {
  const [vehiculos] = await pool.execute("SELECT id_vehiculo FROM vehiculo");
  const porVehiculo = await Promise.all(
    vehiculos.map(async ({ id_vehiculo }) => {
      const [rows] = await pool.execute(
        "SELECT * FROM registro_mantenimiento WHERE id_vehiculo = ? ORDER BY fecha_hora ASC",
        [id_vehiculo]
      );
      const registros = rows.map(hydrate);
      calcularRendimientos(registros);
      return registros;
    })
  );
  return porVehiculo.flat();
}

async function createRegistro({
  id_vehiculo,
  tipo,
  kilometraje_actual,
  galones_ingresados,
  costo_total,
  descripcion_compras_y_taller,
}) {
  if (!id_vehiculo) {
    throw new ServiceError("id_vehiculo es obligatorio", 400);
  }
  const [vehiculoRows] = await pool.execute("SELECT id_vehiculo FROM vehiculo WHERE id_vehiculo = ?", [
    id_vehiculo,
  ]);
  if (!vehiculoRows[0]) {
    throw new ServiceError("El vehículo indicado no existe", 400);
  }

  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw new ServiceError("tipo inválido", 400);
  }

  const km = Number(kilometraje_actual);
  if (!Number.isFinite(km) || km < 0) {
    throw new ServiceError("kilometraje_actual debe ser un número válido", 400);
  }

  // El kilometraje de ESTE vehículo no puede retroceder (CU-18, excepción A1)
  // — comparado solo contra su propio último registro, no el de otro vehículo.
  const [ultimoRows] = await pool.execute(
    "SELECT kilometraje_actual FROM registro_mantenimiento WHERE id_vehiculo = ? ORDER BY fecha_hora DESC LIMIT 1",
    [id_vehiculo]
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
       (id_registro, id_vehiculo, kilometraje_actual, tipo, galones_ingresados, costo_total, descripcion_compras_y_taller)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id_registro, id_vehiculo, km, tipo, galones, costo, descripcion]
  );

  const [rows] = await pool.execute("SELECT * FROM registro_mantenimiento WHERE id_registro = ?", [
    id_registro,
  ]);
  emitCambio("mantenimiento:changed");
  return hydrate(rows[0]);
}

// Fase 3: compara el kilometraje del último registro de ESTE vehículo (de
// cualquier tipo — un Tanqueo también refleja el kilometraje actual) contra
// el de su último Taller. Si nunca hubo un Taller registrado para él, no hay
// contra qué comparar.
async function getAlertaPreventiva(id_vehiculo) {
  if (!id_vehiculo) {
    throw new ServiceError("id_vehiculo es obligatorio", 400);
  }
  const [actualRows] = await pool.execute(
    "SELECT kilometraje_actual FROM registro_mantenimiento WHERE id_vehiculo = ? ORDER BY fecha_hora DESC LIMIT 1",
    [id_vehiculo]
  );
  const [tallerRows] = await pool.execute(
    "SELECT kilometraje_actual FROM registro_mantenimiento WHERE id_vehiculo = ? AND tipo = 'Taller' ORDER BY fecha_hora DESC LIMIT 1",
    [id_vehiculo]
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

// Usado por el dashboard del Admin: antes revisaba un solo vehículo implícito,
// ahora recorre todos los vehículos ACTIVOS y devuelve solo los que de verdad
// deben alertar, cada uno con su nombre para poder mostrar cuál es.
async function getAlertasPreventivas() {
  const [vehiculos] = await pool.execute("SELECT id_vehiculo, nombre FROM vehiculo WHERE activo = TRUE");
  const alertas = [];
  for (const vehiculo of vehiculos) {
    const alerta = await getAlertaPreventiva(vehiculo.id_vehiculo);
    if (alerta.debeAlertar) {
      alertas.push({ id_vehiculo: vehiculo.id_vehiculo, nombre: vehiculo.nombre, ...alerta });
    }
  }
  return alertas;
}

module.exports = {
  listRegistros,
  listTodosLosRegistros,
  createRegistro,
  getAlertaPreventiva,
  getAlertasPreventivas,
};

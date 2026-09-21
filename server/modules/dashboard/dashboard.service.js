const { pool } = require("../../db/pool");
const { ServiceError } = require("../../lib/service-error");
const domiciliosService = require("../domicilios/domicilios.service");
const mantenimientoService = require("../mantenimiento/mantenimiento.service");

// Agregador delgado: no repite ninguna consulta SQL de domicilios ni de
// mantenimiento — reusa listHistorial() y listRegistros(), que ya existen y ya
// hacen el trabajo pesado (incluido el cálculo de rendimiento km/galón, que
// listRegistros() calcula sobre TODA la historia para que un tanqueo a caballo
// entre dos meses se compare bien contra el anterior, aunque caiga en el mes previo).
async function getResumenMensual(mes) {
  if (!/^\d{4}-\d{2}$/.test(mes)) {
    throw new ServiceError("mes inválido (formato esperado: YYYY-MM)", 400);
  }
  const [anio, mesNum] = mes.split("-").map(Number);
  const inicio = new Date(anio, mesNum - 1, 1, 0, 0, 0, 0);
  const fin = new Date(anio, mesNum, 0, 23, 59, 59, 999); // último instante del mes

  const historial = await domiciliosService.listHistorial({
    desde: inicio.toISOString(),
    hasta: fin.toISOString(),
  });
  const entregados = historial.filter((d) => d.estado === "Entregado");
  const cancelados = historial.filter((d) => d.estado === "Cancelado");

  const domicilios_entregados = entregados.length;
  const km_recorridos = entregados.reduce((suma, d) => suma + (d.distancia_km ?? 0), 0);
  const ganancias = entregados.reduce((suma, d) => suma + d.precio, 0);
  const perdidas = cancelados.reduce((suma, d) => suma + d.precio, 0);

  // Cliente más frecuente = el que más domicilios ENTREGADOS tuvo en el mes (no
  // cuenta cancelados — la pregunta es a quién de verdad se le entregó más).
  const conteoPorCliente = new Map();
  for (const d of entregados) {
    const actual = conteoPorCliente.get(d.telefono_cliente) ?? {
      telefono: d.telefono_cliente,
      nombre: d.cliente.nombre,
      cantidad: 0,
    };
    actual.cantidad += 1;
    conteoPorCliente.set(d.telefono_cliente, actual);
  }
  const cliente_mas_frecuente =
    [...conteoPorCliente.values()].sort((a, b) => b.cantidad - a.cantidad)[0] ?? null;

  const registros = await mantenimientoService.listRegistros();
  const registrosDelMes = registros.filter((r) => {
    const t = new Date(r.fecha_hora).getTime();
    return t >= inicio.getTime() && t <= fin.getTime();
  });
  const tanqueosDelMes = registrosDelMes.filter((r) => r.tipo === "Tanqueo");
  const tanqueos = tanqueosDelMes.length;
  const gasto_combustible = tanqueosDelMes.reduce((suma, r) => suma + r.costo_total, 0);
  const gasto_taller_compras = registrosDelMes
    .filter((r) => r.tipo !== "Tanqueo")
    .reduce((suma, r) => suma + r.costo_total, 0);

  const rendimientos = tanqueosDelMes
    .map((r) => r.rendimiento_km_galon)
    .filter((v) => v != null);
  const rendimiento_promedio_km_galon =
    rendimientos.length > 0 ? rendimientos.reduce((suma, v) => suma + v, 0) / rendimientos.length : null;

  return {
    mes,
    domicilios_entregados,
    km_recorridos,
    cliente_mas_frecuente,
    ganancias,
    perdidas,
    tanqueos,
    gasto_combustible,
    gasto_taller_compras,
    rendimiento_promedio_km_galon,
  };
}

const NOMBRES_MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Comparativa de los últimos N meses (incluyendo el actual), de más antiguo a
// más reciente — reusa getResumenMensual() mes a mes, sin repetir SQL, para
// alimentar la gráfica de barras agrupadas del dashboard.
async function getSerieMensual(mesesAtras = 6) {
  const ahora = new Date();
  const serie = [];
  for (let i = mesesAtras - 1; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    const resumen = await getResumenMensual(mes);
    serie.push({
      mes,
      nombreMes: NOMBRES_MES[fecha.getMonth()],
      ganancias: resumen.ganancias,
      perdidas: resumen.perdidas,
    });
  }
  return serie;
}

// Top de productos por cantidad vendida en domicilios Entregados del mes —
// mismo patrón de JOIN que queryComprasVentas() en inventario.service.js,
// pero acotado a un rango de fechas y ordenado/limitado para la gráfica.
async function getTopProductosMes(mes, limite = 5) {
  if (!/^\d{4}-\d{2}$/.test(mes)) {
    throw new ServiceError("mes inválido (formato esperado: YYYY-MM)", 400);
  }
  const [anio, mesNum] = mes.split("-").map(Number);
  const inicio = new Date(anio, mesNum - 1, 1, 0, 0, 0, 0);
  const fin = new Date(anio, mesNum, 0, 23, 59, 59, 999);

  // LIMIT no se pasa como placeholder de prepared statement (soporte
  // inconsistente entre versiones de mysql2) — `limite` es interno, nunca
  // viene del usuario, así que se castea a entero y se inserta directo.
  const limiteSeguro = Math.max(1, Math.trunc(Number(limite)) || 5);
  const [rows] = await pool.execute(
    `SELECT p.nombre, SUM(dp.cantidad) AS cantidad
     FROM domicilio_producto dp
     JOIN domicilio d ON d.id_domicilio = dp.id_domicilio
     JOIN producto p ON p.id_producto = dp.id_producto
     WHERE d.estado = 'Entregado' AND d.fecha_hora_entrega BETWEEN ? AND ?
     GROUP BY dp.id_producto, p.nombre
     ORDER BY cantidad DESC
     LIMIT ${limiteSeguro}`,
    [inicio, fin]
  );
  return rows.map((r) => ({ nombre: r.nombre, cantidad: Number(r.cantidad) }));
}

// Rentabilidad de UN domicilio puntual: cobrado (precio) menos el costo de
// gasolina/mantenimiento prorrateado por los km que recorrió, usando el costo
// por km del mes en que se entregó (mismos gastos ya agregados por
// getResumenMensual — sin SQL nueva). Solo tiene sentido para domicilios ya
// entregados (con distancia_km conocida); para cualquier otro estado devuelve null.
async function getRentabilidadDomicilio(id) {
  const domicilio = await domiciliosService.getDomicilio(id, { rol: "Admin", telefono: null });
  if (domicilio.estado !== "Entregado" || domicilio.distancia_km == null) {
    return null;
  }

  const fecha = new Date(domicilio.fecha_hora_entrega);
  const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
  const resumen = await getResumenMensual(mes);

  const costo_por_km_del_mes =
    resumen.km_recorridos > 0
      ? (resumen.gasto_combustible + resumen.gasto_taller_compras) / resumen.km_recorridos
      : 0;
  const costo_prorrateado = domicilio.distancia_km * costo_por_km_del_mes;

  return {
    cobrado: domicilio.precio,
    costo_prorrateado,
    rentabilidad: domicilio.precio - costo_prorrateado,
    costo_por_km_del_mes,
  };
}

module.exports = { getResumenMensual, getSerieMensual, getTopProductosMes, getRentabilidadDomicilio };

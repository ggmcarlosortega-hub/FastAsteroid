const { pool } = require("../../db/pool");
const { ServiceError } = require("../../lib/service-error");

// Balance de un rango de fechas: ingresos (domicilios entregados) menos egresos
// (compras de inventario y gastos de mantenimiento), agrupado por día. Solo lee
// tablas que ya existen; no guarda nada nuevo.
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function diaLocal(fecha) {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function rangoDeDias(desde, hasta) {
  const dias = [];
  const cursor = new Date(`${desde}T00:00:00`);
  const fin = new Date(`${hasta}T00:00:00`);
  while (cursor <= fin) {
    dias.push(diaLocal(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

async function getBalance({ desde, hasta }) {
  if (!FECHA.test(desde ?? "") || !FECHA.test(hasta ?? "")) {
    throw new ServiceError("desde y hasta deben tener formato YYYY-MM-DD", 400);
  }
  if (desde > hasta) {
    throw new ServiceError("desde no puede ser posterior a hasta", 400);
  }

  const inicio = new Date(`${desde}T00:00:00`);
  const fin = new Date(`${hasta}T23:59:59.999`);

  const [entregas] = await pool.execute(
    `SELECT fecha_hora_entrega, precio, valor_efectivo, valor_transferencia
     FROM domicilio
     WHERE estado = 'Entregado' AND fecha_hora_entrega BETWEEN ? AND ?`,
    [inicio, fin]
  );
  const [compras] = await pool.execute(
    `SELECT fecha_compra, cantidad_comprada, costo_unitario
     FROM lote_compra
     WHERE costo_unitario IS NOT NULL AND fecha_compra BETWEEN ? AND ?`,
    [inicio, fin]
  );
  const [mantenimiento] = await pool.execute(
    `SELECT fecha_hora, costo_total
     FROM registro_mantenimiento
     WHERE fecha_hora BETWEEN ? AND ?`,
    [inicio, fin]
  );

  const porDia = new Map(rangoDeDias(desde, hasta).map((dia) => [dia, { fecha: dia, efectivo: 0, transferencia: 0, ingresos: 0, compras: 0, mantenimiento: 0 }]));
  const dia = (fecha) => porDia.get(diaLocal(fecha));

  for (const e of entregas) {
    const fila = dia(e.fecha_hora_entrega);
    if (!fila) continue;
    fila.efectivo += Number(e.valor_efectivo ?? 0);
    fila.transferencia += Number(e.valor_transferencia ?? 0);
    fila.ingresos += Number(e.precio);
  }
  for (const c of compras) {
    const fila = dia(c.fecha_compra);
    if (fila) fila.compras += Number(c.cantidad_comprada) * Number(c.costo_unitario);
  }
  for (const m of mantenimiento) {
    const fila = dia(m.fecha_hora);
    if (fila) fila.mantenimiento += Number(m.costo_total);
  }

  const dias = [...porDia.values()].map((fila) => ({
    ...fila,
    egresos: fila.compras + fila.mantenimiento,
    saldo: fila.ingresos - (fila.compras + fila.mantenimiento),
  }));

  const suma = (campo) => dias.reduce((total, fila) => total + fila[campo], 0);
  const ingresos = suma("ingresos");
  const egresos = suma("egresos");

  return {
    desde,
    hasta,
    ingresos: {
      total: ingresos,
      efectivo: suma("efectivo"),
      transferencia: suma("transferencia"),
      domicilios: entregas.length,
    },
    egresos: {
      total: egresos,
      compras: suma("compras"),
      mantenimiento: suma("mantenimiento"),
    },
    saldo: ingresos - egresos,
    porDia: dias,
  };
}

module.exports = { getBalance };

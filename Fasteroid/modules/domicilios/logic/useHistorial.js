"use client";

import { useState, useEffect, useCallback } from "react";

function inicioDe(periodo) {
  const ahora = new Date();
  if (periodo === "dia") {
    return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  }
  if (periodo === "semana") {
    const dia = ahora.getDay() === 0 ? 7 : ahora.getDay(); // lunes = inicio de semana
    return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - dia + 1);
  }
  return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
}

export function useHistorial(periodoFijo) {
  const [periodo, setPeriodo] = useState(periodoFijo ?? "mes");
  const [domicilios, setDomicilios] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async (p) => {
    setLoading(true);
    const desde = inicioDe(p).toISOString();
    const res = await fetch(`/api/domicilios?desde=${encodeURIComponent(desde)}`);
    setDomicilios(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar(periodo);
  }, [periodo, cargar]);

  const resumen = domicilios.reduce(
    (acc, d) => {
      acc.total += 1;
      if (d.estado === "Entregado") {
        acc.entregados += 1;
        acc.recaudado += d.valor_recaudado ?? 0;
        if (d.metodo_pago === "Efectivo") acc.efectivo += 1;
        if (d.metodo_pago === "Transferencia") acc.transferencia += 1;
        acc.km += d.distancia_km ?? 0;
      }
      if (d.estado === "Cancelado") acc.cancelados += 1;
      return acc;
    },
    { total: 0, entregados: 0, cancelados: 0, efectivo: 0, transferencia: 0, recaudado: 0, km: 0 }
  );

  return { periodo, setPeriodo, domicilios, loading, resumen };
}

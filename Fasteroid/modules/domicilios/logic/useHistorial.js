"use client";

import { useState, useEffect, useCallback } from "react";
import { useRealtime } from "../../../lib/useRealtime";

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

  useRealtime("domicilios:changed", () => cargar(periodo));

  const resumen = domicilios.reduce(
    (acc, d) => {
      acc.total += 1;
      if (d.estado === "Entregado") {
        acc.entregados += 1;
        acc.recaudado += d.valor_recaudado ?? 0;
        // Montos en pesos (no conteos) — es lo que usa la barra de progreso
        // efectivo/transferencia del día (DesglosePago.js en DomiciliarioHomePage.js).
        acc.efectivoTotal += d.valor_efectivo ?? 0;
        acc.transferenciaTotal += d.valor_transferencia ?? 0;
        acc.km += d.distancia_km ?? 0;
      }
      if (d.estado === "Cancelado") acc.cancelados += 1;
      return acc;
    },
    {
      total: 0,
      entregados: 0,
      cancelados: 0,
      efectivoTotal: 0,
      transferenciaTotal: 0,
      recaudado: 0,
      km: 0,
    }
  );

  return { periodo, setPeriodo, domicilios, loading, resumen };
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRealtime } from "../../../lib/useRealtime";

function mesActual() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
}

export function useDashboardMensual() {
  const [mes, setMes] = useState(mesActual());
  const [resumen, setResumen] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async (m) => {
    setLoading(true);
    const [resResumen, resAlerta] = await Promise.all([
      fetch(`/api/dashboard/resumen?mes=${encodeURIComponent(m)}`),
      fetch("/api/mantenimiento/alerta"),
    ]);
    setResumen(await resResumen.json());
    setAlerta(await resAlerta.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar(mes);
  }, [mes, cargar]);

  // Cualquier domicilio o evento de mantenimiento nuevo puede cambiar los
  // indicadores del mes elegido, o la alerta preventiva (no depende del mes).
  useRealtime(["domicilios:changed", "mantenimiento:changed"], () => cargar(mes));

  return { mes, setMes, resumen, alerta, loading };
}

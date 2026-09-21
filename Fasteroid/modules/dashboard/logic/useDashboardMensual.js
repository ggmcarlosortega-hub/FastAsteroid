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
  const [serie, setSerie] = useState(null);
  const [topProductos, setTopProductos] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async (m) => {
    setLoading(true);
    const [resResumen, resAlerta, resTopProductos] = await Promise.all([
      fetch(`/api/dashboard/resumen?mes=${encodeURIComponent(m)}`),
      fetch("/api/mantenimiento/alerta"),
      fetch(`/api/dashboard/top-productos?mes=${encodeURIComponent(m)}`),
    ]);
    setResumen(await resResumen.json());
    setAlerta(await resAlerta.json());
    setTopProductos(await resTopProductos.json());
    setLoading(false);
  }, []);

  // La serie de los últimos 6 meses no depende del mes elegido en el
  // selector (es la comparativa completa) — se carga una sola vez y se
  // reinvalida con el mismo evento de tiempo real que el resto.
  const cargarSerie = useCallback(async () => {
    const res = await fetch("/api/dashboard/serie?meses=6");
    setSerie(await res.json());
  }, []);

  useEffect(() => {
    cargar(mes);
  }, [mes, cargar]);

  useEffect(() => {
    cargarSerie();
  }, [cargarSerie]);

  // Cualquier domicilio o evento de mantenimiento nuevo puede cambiar los
  // indicadores del mes elegido, o la alerta preventiva (no depende del mes).
  useRealtime(["domicilios:changed", "mantenimiento:changed"], () => {
    cargar(mes);
    cargarSerie();
  });

  return { mes, setMes, resumen, alerta, serie, topProductos, loading };
}

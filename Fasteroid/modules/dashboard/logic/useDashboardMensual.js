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
  const [error, setError] = useState(null);

  // Sin try/catch acá, un fetch fallido (backend reiniciándose, sesión vencida,
  // el cold-start del backend gratuito en producción) dejaba `loading` en true
  // para siempre — la pantalla se quedaba en "Cargando..." sin aviso.
  const cargar = useCallback(async (m) => {
    setLoading(true);
    setError(null);
    try {
      const [resResumen, resAlerta, resTopProductos] = await Promise.all([
        fetch(`/api/dashboard/resumen?mes=${encodeURIComponent(m)}`),
        fetch("/api/mantenimiento/alerta"),
        fetch(`/api/dashboard/top-productos?mes=${encodeURIComponent(m)}`),
      ]);
      setResumen(await resResumen.json());
      setAlerta(await resAlerta.json());
      setTopProductos(await resTopProductos.json());
    } catch {
      setError("No se pudo cargar el dashboard. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  // La serie de los últimos 6 meses no depende del mes elegido en el
  // selector (es la comparativa completa) — se carga una sola vez y se
  // reinvalida con el mismo evento de tiempo real que el resto. Es un
  // complemento del panel: si falla, no debe tumbar el resto del dashboard
  // (BarrasComparativas ya maneja `serie` nulo mostrando "Sin datos").
  const cargarSerie = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/serie?meses=6");
      setSerie(await res.json());
    } catch {
      // silencioso a propósito — ver comentario arriba.
    }
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

  return { mes, setMes, resumen, alerta, serie, topProductos, loading, error, reintentar: () => cargar(mes) };
}

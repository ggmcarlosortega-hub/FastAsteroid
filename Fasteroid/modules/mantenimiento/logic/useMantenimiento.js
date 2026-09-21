"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "../../../lib/swal";
import { useRealtime } from "../../../lib/useRealtime";
import { openRegistroMantenimientoFormModal } from "../components/RegistroMantenimientoFormModal";

export function useMantenimiento() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/mantenimiento");
    setRegistros(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useRealtime("mantenimiento:changed", cargar);

  async function handleNuevoRegistro() {
    const creado = await openRegistroMantenimientoFormModal();
    if (!creado) return;
    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Registro guardado",
      timer: 1200,
      showConfirmButton: false,
    });
    cargar();
  }

  // Gasto total por tipo — la vista le pone ícono/color (mismo criterio que
  // TIPO_INFO) al armar el gráfico de barras.
  const gastoPorTipoMap = new Map();
  for (const r of registros) {
    gastoPorTipoMap.set(r.tipo, (gastoPorTipoMap.get(r.tipo) ?? 0) + (r.costo_total ?? 0));
  }
  const gastoPorTipo = [...gastoPorTipoMap.entries()].map(([tipo, valor]) => ({ tipo, valor }));

  // Rendimiento (km/galón) de cada tanqueo que sí lo tiene calculado (el primer
  // tanqueo nunca tiene, no hay uno anterior con qué compararlo), en orden
  // cronológico — para el gráfico de tendencia.
  const rendimientoPorTanqueo = registros
    .filter((r) => r.tipo === "Tanqueo" && r.rendimiento_km_galon != null)
    .slice()
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
    .map((r) => {
      const fecha = new Date(r.fecha_hora);
      return {
        label: `${String(fecha.getDate()).padStart(2, "0")}/${String(fecha.getMonth() + 1).padStart(2, "0")}`,
        valor: r.rendimiento_km_galon,
      };
    });

  return { registros, loading, handleNuevoRegistro, gastoPorTipo, rendimientoPorTanqueo };
}

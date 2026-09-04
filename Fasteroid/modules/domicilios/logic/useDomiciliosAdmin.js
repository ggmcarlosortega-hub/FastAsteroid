"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "../../../lib/swal";
import { useRealtime } from "../../../lib/useRealtime";
import { openNuevoDomicilioModalAdmin } from "../components/NuevoDomicilioModal";

function inicioDe(periodo) {
  const ahora = new Date();
  if (periodo === "dia") {
    return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  }
  if (periodo === "semana") {
    const dia = ahora.getDay() === 0 ? 7 : ahora.getDay();
    return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - dia + 1);
  }
  return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
}

export function useDomiciliosAdmin() {
  const [activos, setActivos] = useState([]);
  const [asignados, setAsignados] = useState([]);
  const [periodo, setPeriodo] = useState("mes");
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async (p) => {
    setLoading(true);
    const desde = inicioDe(p).toISOString();
    const [activosRes, asignadosRes, historialRes] = await Promise.all([
      fetch("/api/domicilios?vista=activos"),
      fetch("/api/domicilios?vista=asignados"),
      fetch(`/api/domicilios?desde=${encodeURIComponent(desde)}`),
    ]);
    setActivos(await activosRes.json());
    setAsignados(await asignadosRes.json());
    setHistorial(await historialRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar(periodo);
  }, [periodo, cargar]);

  useRealtime("domicilios:changed", () => cargar(periodo));

  async function handleNuevo() {
    const creado = await openNuevoDomicilioModalAdmin();
    if (!creado) return;
    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Domicilio agregado a la lista de espera",
      timer: 1500,
      showConfirmButton: false,
    });
    cargar(periodo);
  }

  const ganancias = historial
    .filter((d) => d.estado === "Entregado")
    .reduce((suma, d) => suma + (d.precio ?? 0), 0);
  const perdidas = historial
    .filter((d) => d.estado === "Cancelado")
    .reduce((suma, d) => suma + (d.precio ?? 0), 0);

  const entregados = historial.filter((d) => d.estado === "Entregado");

  // Desglose efectivo/transferencia de TODO el período, para el
  // <DesglosePago> general junto a GananciasPerdidas.
  const desglosePago = entregados.reduce(
    (acc, d) => {
      acc.efectivo += d.valor_efectivo ?? 0;
      acc.transferencia += d.valor_transferencia ?? 0;
      return acc;
    },
    { efectivo: 0, transferencia: 0 }
  );

  // Lo mismo pero agrupado por domiciliario — sección "Recaudado por
  // domiciliario" debajo del desglose general.
  const desglosePorDomiciliarioMap = new Map();
  for (const d of entregados) {
    const key = d.domiciliario.telefono;
    const actual = desglosePorDomiciliarioMap.get(key) ?? {
      telefono: key,
      nombre: d.domiciliario.nombre,
      efectivo: 0,
      transferencia: 0,
    };
    actual.efectivo += d.valor_efectivo ?? 0;
    actual.transferencia += d.valor_transferencia ?? 0;
    desglosePorDomiciliarioMap.set(key, actual);
  }
  const desglosePorDomiciliario = [...desglosePorDomiciliarioMap.values()].sort((a, b) =>
    a.nombre.localeCompare(b.nombre)
  );

  return {
    activos,
    asignados,
    historial,
    periodo,
    setPeriodo,
    loading,
    handleNuevo,
    ganancias,
    perdidas,
    desglosePago,
    desglosePorDomiciliario,
  };
}

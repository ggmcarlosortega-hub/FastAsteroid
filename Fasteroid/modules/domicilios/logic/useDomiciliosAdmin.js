"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
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
  const [periodo, setPeriodo] = useState("mes");
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async (p) => {
    setLoading(true);
    const desde = inicioDe(p).toISOString();
    const [activosRes, historialRes] = await Promise.all([
      fetch("/api/domicilios?vista=activos"),
      fetch(`/api/domicilios?desde=${encodeURIComponent(desde)}`),
    ]);
    setActivos(await activosRes.json());
    setHistorial(await historialRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar(periodo);
  }, [periodo, cargar]);

  async function handleNuevo() {
    const creado = await openNuevoDomicilioModalAdmin();
    if (!creado) return;
    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `Domicilio asignado a ${creado.domiciliario?.nombre ?? "domiciliario"}`,
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

  return { activos, historial, periodo, setPeriodo, loading, handleNuevo, ganancias, perdidas };
}

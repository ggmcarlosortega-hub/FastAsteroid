"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "../../../lib/swal";
import { useRealtime } from "../../../lib/useRealtime";
import { openDomiciliarioFormModal } from "../components/DomiciliarioFormModal";

export function useDomiciliarios() {
  const [domiciliarios, setDomiciliarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/domiciliarios");
    setDomiciliarios(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Los totales recaudados dependen de domicilios entregados, no solo del
  // activo/inactivo de cada domiciliario.
  useRealtime(["domiciliarios:changed", "domicilios:changed"], cargar);

  // Desactivar solo lo saca del selector de "asignar domicilio" — sigue
  // pudiendo iniciar sesión y entregar lo que ya tenía en curso (ver
  // domicilios.service.js, setActivoDomiciliario).
  async function handleToggleActivo(domiciliario) {
    const activar = !domiciliario.activo;
    const res = await fetch(`/api/domiciliarios/${domiciliario.telefono}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: activar }),
    });
    if (!res.ok) {
      const data = await res.json();
      await Swal.fire({ icon: "error", title: "No se pudo actualizar", text: data.error });
      return;
    }
    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: activar ? "Domiciliario activado" : "Domiciliario desactivado",
      timer: 1200,
      showConfirmButton: false,
    });
    cargar();
  }

  async function handleNuevoDomiciliario() {
    const creado = await openDomiciliarioFormModal();
    if (!creado) return;
    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Domiciliario creado",
      timer: 1200,
      showConfirmButton: false,
    });
    cargar();
  }

  return { domiciliarios, loading, handleToggleActivo, handleNuevoDomiciliario };
}

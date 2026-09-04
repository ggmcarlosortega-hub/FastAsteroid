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

  return { registros, loading, handleNuevoRegistro };
}

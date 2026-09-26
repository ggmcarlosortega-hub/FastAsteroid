"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "../../../lib/swal";
import { useRealtime } from "../../../lib/useRealtime";
import { openUbicacionFormModal } from "../components/UbicacionFormModal";

export function useClienteDetalle(telefono) {
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clientes/${telefono}`);
    if (!res.ok) {
      setCliente(null);
      setLoading(false);
      return;
    }
    setCliente(await res.json());
    setLoading(false);
  }, [telefono]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useRealtime("clientes:changed", cargar);

  async function handleAgregarUbicacion() {
    const creada = await openUbicacionFormModal(telefono);
    if (!creada) return;
    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Ubicación agregada",
      timer: 1200,
      showConfirmButton: false,
    });
    cargar();
  }

  async function handleEditarUbicacion(ubicacion) {
    const actualizada = await openUbicacionFormModal(telefono, ubicacion);
    if (!actualizada) return;
    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Ubicación actualizada",
      timer: 1200,
      showConfirmButton: false,
    });
    cargar();
  }

  async function handleEliminarUbicacion(ubicacion) {
    const result = await Swal.fire({
      icon: "warning",
      title: `¿Eliminar "${ubicacion.alias_direccion}"?`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    const res = await fetch(`/api/ubicaciones/${ubicacion.id_ubicacion}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      await Swal.fire({ icon: "error", title: "No se pudo eliminar", text: data.error });
      return;
    }

    cargar();
  }

  return { cliente, loading, handleAgregarUbicacion, handleEditarUbicacion, handleEliminarUbicacion };
}

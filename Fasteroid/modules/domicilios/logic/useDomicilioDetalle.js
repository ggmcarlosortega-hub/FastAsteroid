"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "../../../lib/swal";
import { useRealtime } from "../../../lib/useRealtime";
import { openEditarDomicilioModal } from "../components/EditarDomicilioModal";

export function useDomicilioDetalle(id, esAdmin = false) {
  const [domicilio, setDomicilio] = useState(null);
  const [rentabilidad, setRentabilidad] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/domicilios/${id}`);
    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setDomicilio(data);
    setNotFound(false);
    setLoading(false);

    // Fase 3: cobrado vs. costo prorrateado — solo tiene sentido para un
    // domicilio ya entregado, y solo el Admin puede verlo (ver domicilios.routes.js).
    if (esAdmin && data.estado === "Entregado") {
      const resRent = await fetch(`/api/domicilios/${id}/rentabilidad`);
      setRentabilidad(resRent.ok ? await resRent.json() : null);
    } else {
      setRentabilidad(null);
    }
  }, [id, esAdmin]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useRealtime(["domicilios:changed", "mantenimiento:changed"], cargar);

  async function handleEditar() {
    const valores = await openEditarDomicilioModal(domicilio);
    if (!valores) return;

    const res = await fetch(`/api/domicilios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valores),
    });
    const data = await res.json();

    if (!res.ok) {
      await Swal.fire({ icon: "error", title: "No se pudo guardar", text: data.error });
      return;
    }

    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Domicilio actualizado",
      timer: 1200,
      showConfirmButton: false,
    });
    cargar();
  }

  return { domicilio, rentabilidad, loading, notFound, handleEditar };
}

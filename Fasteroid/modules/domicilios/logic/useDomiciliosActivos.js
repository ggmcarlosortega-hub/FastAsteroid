"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "../../../lib/swal";
import { useRealtime } from "../../../lib/useRealtime";
import { getCurrentPositionAsync } from "./geolocation";
import { openNuevoDomicilioModal } from "../components/NuevoDomicilioModal";
import { openEscanearComandaModal } from "../components/EscanearComandaModal";
import { openEntregarModal } from "../components/EntregarModal";
import { openNombreLugarModal } from "../components/NombreLugarModal";
import { openRecogerModal } from "../components/RecogerModal";
import { ESPACIOS_VALIDOS } from "../components/EspacioBaulSelector";

const MAX_ACTIVOS = ESPACIOS_VALIDOS.length;

export function useDomiciliosActivos() {
  const [activos, setActivos] = useState([]);
  const [asignados, setAsignados] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [activosRes, asignadosRes] = await Promise.all([
      fetch("/api/domicilios?vista=activos"),
      fetch("/api/domicilios?vista=asignados"),
    ]);
    setActivos(await activosRes.json());
    setAsignados(await asignadosRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useRealtime("domicilios:changed", cargar);

  const espaciosOcupados = activos.map((d) => d.espacio_baul);

  // Punto de partida para calcular distancia_km al entregar (ver
  // marcarEntregado en el backend) — se captura ANTES de abrir cualquier modal
  // que ponga un domicilio en curso (crear, escanear, recoger), igual que ya
  // se hace con la ubicación de entrega en handleEntregar: si el GPS falla, se
  // bloquea con un error claro antes de que el domiciliario llene el formulario.
  async function capturarUbicacionRecogida() {
    const ubicacion = await getCurrentPositionAsync();
    if (!ubicacion) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo capturar tu ubicación",
        text: "Activa el GPS/la ubicación del navegador e intenta de nuevo.",
      });
    }
    return ubicacion;
  }

  async function handleNuevo() {
    if (activos.length >= MAX_ACTIVOS) {
      await Swal.fire({
        icon: "info",
        title: `Ya tienes ${MAX_ACTIVOS} domicilios en curso`,
        text: "Marca alguno como entregado o cancelado antes de crear otro.",
      });
      return;
    }
    const ubicacionRecogida = await capturarUbicacionRecogida();
    if (!ubicacionRecogida) return;

    const creado = await openNuevoDomicilioModal(espaciosOcupados, ubicacionRecogida);
    if (!creado) return;
    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Domicilio iniciado",
      timer: 1200,
      showConfirmButton: false,
    });
    cargar();
  }

  async function handleEscanear() {
    if (activos.length >= MAX_ACTIVOS) {
      await Swal.fire({
        icon: "info",
        title: `Ya tienes ${MAX_ACTIVOS} domicilios en curso`,
        text: "Marca alguno como entregado o cancelado antes de crear otro.",
      });
      return;
    }
    const ubicacionRecogida = await capturarUbicacionRecogida();
    if (!ubicacionRecogida) return;

    const creado = await openEscanearComandaModal(espaciosOcupados, ubicacionRecogida);
    if (!creado) return;
    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Domicilio registrado desde la comanda",
      timer: 1500,
      showConfirmButton: false,
    });
    cargar();
  }

  async function handleEntregar(domicilio) {
    // Se captura al presionar "Entregado" — es la ubicación real donde está el
    // domiciliario al llegar, y reemplaza la ubicación asignada al crear el
    // domicilio (sección 6: el cliente puede no saber bien dónde vive, o el Admin
    // se equivoca por rapidez al asignar). Es obligatoria: sin ella no hay cómo
    // corregir la ubicación, así que se bloquea la entrega si el GPS no responde.
    const ubicacionEntrega = await getCurrentPositionAsync();
    if (!ubicacionEntrega) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo capturar tu ubicación",
        text: "Activa el GPS/la ubicación del navegador e intenta de nuevo.",
      });
      return;
    }

    const valores = await openEntregarModal(domicilio.precio);
    if (!valores) return;

    // distancia_km ya no se manda — el backend la calcula solo con Haversine
    // entre el punto de partida guardado al recoger/crear y esta ubicación de
    // entrega (ver marcarEntregado).
    const payload = {
      ...valores,
      ubicacion_entrega: ubicacionEntrega,
    };

    let res = await fetch(`/api/domicilios/${domicilio.id_domicilio}/entregar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let data = await res.json();

    // La ubicación capturada no coincide con ninguna guardada del cliente — recién
    // acá se le pide el nombre al domiciliario, no de entrada (sección 6).
    if (!res.ok && data.requiereNombreLugar) {
      const nombreLugar = await openNombreLugarModal();
      if (!nombreLugar) return;

      res = await fetch(`/api/domicilios/${domicilio.id_domicilio}/entregar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, nombre_lugar: nombreLugar }),
      });
      data = await res.json();
    }

    if (!res.ok) {
      await Swal.fire({ icon: "error", title: "No se pudo confirmar", text: data.error });
      return;
    }

    let title = "Domicilio entregado";
    if (data.ubicacionNueva) title = "Domicilio entregado — nueva ubicación guardada";
    else if (data.ubicacionActualizada) title = "Domicilio entregado — ubicación corregida";

    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title,
      timer: 1800,
      showConfirmButton: false,
    });
    cargar();
  }

  async function handleRecoger(domicilio) {
    const ubicacionRecogida = await capturarUbicacionRecogida();
    if (!ubicacionRecogida) return;

    const espaciosOcupados = activos.map((d) => d.espacio_baul);
    const valores = await openRecogerModal(espaciosOcupados, ubicacionRecogida);
    if (!valores) return;

    const res = await fetch(`/api/domicilios/${domicilio.id_domicilio}/recoger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valores),
    });
    const data = await res.json();

    if (!res.ok) {
      await Swal.fire({ icon: "error", title: "No se pudo recoger", text: data.error });
      return;
    }

    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Domicilio recogido",
      timer: 1200,
      showConfirmButton: false,
    });
    cargar();
  }

  async function handleCancelar(domicilio) {
    const { value: motivo, isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Cancelar domicilio",
      input: "textarea",
      inputLabel: "Motivo de la cancelación",
      inputPlaceholder: "No encontré al cliente...",
      showCancelButton: true,
      confirmButtonText: "Cancelar domicilio",
      cancelButtonText: "Volver",
      confirmButtonColor: "#dc2626",
      inputValidator: (value) => (!value?.trim() ? "El motivo es obligatorio" : undefined),
    });
    if (!isConfirmed) return;

    const res = await fetch(`/api/domicilios/${domicilio.id_domicilio}/cancelar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo_cancelacion: motivo }),
    });
    const data = await res.json();

    if (!res.ok) {
      await Swal.fire({ icon: "error", title: "No se pudo cancelar", text: data.error });
      return;
    }

    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Domicilio cancelado",
      timer: 1200,
      showConfirmButton: false,
    });
    cargar();
  }

  return {
    activos,
    asignados,
    loading,
    handleNuevo,
    handleEscanear,
    handleEntregar,
    handleCancelar,
    handleRecoger,
  };
}

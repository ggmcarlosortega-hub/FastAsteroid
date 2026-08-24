"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import { haversineKm } from "./haversine";
import { getCurrentPositionAsync } from "./geolocation";
import { openNuevoDomicilioModal } from "../components/NuevoDomicilioModal";
import { openEscanearComandaModal } from "../components/EscanearComandaModal";
import { openEntregarModal } from "../components/EntregarModal";
import { openNombreLugarModal } from "../components/NombreLugarModal";
import { openRecogerModal } from "../components/RecogerModal";

export function useDomiciliosActivos() {
  const [activos, setActivos] = useState([]);
  const [asignados, setAsignados] = useState([]);
  const [distancias, setDistancias] = useState({});
  const [loading, setLoading] = useState(true);
  const activosRef = useRef([]);
  const posicionAnteriorRef = useRef(null);
  const watchIdRef = useRef(null);

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

  useEffect(() => {
    activosRef.current = activos;
    setDistancias((prev) => {
      const next = {};
      for (const d of activos) next[d.id_domicilio] = prev[d.id_domicilio] ?? 0;
      return next;
    });
  }, [activos]);

  // Mientras haya al menos un domicilio en curso, sigue la ubicación en segundo
  // plano y acumula distancia con Haversine entre lecturas (sección 8 del documento).
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    if (activos.length === 0) {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        posicionAnteriorRef.current = null;
      }
      return;
    }

    if (watchIdRef.current != null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const nueva = { latitud: pos.coords.latitude, longitud: pos.coords.longitude };
        const anterior = posicionAnteriorRef.current;
        if (anterior) {
          const delta = haversineKm(anterior, nueva);
          setDistancias((prev) => {
            const next = { ...prev };
            for (const d of activosRef.current) {
              next[d.id_domicilio] = (next[d.id_domicilio] ?? 0) + delta;
            }
            return next;
          });
        }
        posicionAnteriorRef.current = nueva;
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activos.length]);

  const espaciosOcupados = activos.map((d) => d.espacio_baul);

  async function handleNuevo() {
    if (activos.length >= 3) {
      await Swal.fire({
        icon: "info",
        title: "Ya tienes 3 domicilios en curso",
        text: "Marca alguno como entregado o cancelado antes de crear otro.",
      });
      return;
    }
    const creado = await openNuevoDomicilioModal(espaciosOcupados);
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
    if (activos.length >= 3) {
      await Swal.fire({
        icon: "info",
        title: "Ya tienes 3 domicilios en curso",
        text: "Marca alguno como entregado o cancelado antes de crear otro.",
      });
      return;
    }
    const creado = await openEscanearComandaModal(espaciosOcupados);
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

    const valores = await openEntregarModal(distancias[domicilio.id_domicilio], domicilio.precio);
    if (!valores) return;

    const payload = {
      ...valores,
      distancia_km: distancias[domicilio.id_domicilio] ?? null,
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
    const espaciosOcupados = activos.map((d) => d.espacio_baul);
    const valores = await openRecogerModal(espaciosOcupados);
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
    distancias,
    loading,
    handleNuevo,
    handleEscanear,
    handleEntregar,
    handleCancelar,
    handleRecoger,
  };
}

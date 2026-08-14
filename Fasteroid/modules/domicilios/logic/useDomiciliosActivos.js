"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import { haversineKm } from "./haversine";
import { getCurrentPositionAsync } from "./geolocation";
import { openNuevoDomicilioModal } from "../components/NuevoDomicilioModal";
import { openEntregarModal } from "../components/EntregarModal";

export function useDomiciliosActivos() {
  const [activos, setActivos] = useState([]);
  const [distancias, setDistancias] = useState({});
  const [loading, setLoading] = useState(true);
  const activosRef = useRef([]);
  const posicionAnteriorRef = useRef(null);
  const watchIdRef = useRef(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/domicilios?vista=activos");
    const data = await res.json();
    setActivos(data);
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

  async function handleEntregar(domicilio) {
    // Se captura al presionar "Entregado" — es la ubicación real donde está el
    // domiciliario al llegar, no la ubicación por defecto del domicilio (sección 22).
    const ubicacionEntrega = await getCurrentPositionAsync();

    const valores = await openEntregarModal(distancias[domicilio.id_domicilio], domicilio.precio);
    if (!valores) return;

    const res = await fetch(`/api/domicilios/${domicilio.id_domicilio}/entregar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...valores,
        distancia_km: distancias[domicilio.id_domicilio] ?? null,
        ubicacion_entrega: ubicacionEntrega,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      await Swal.fire({ icon: "error", title: "No se pudo confirmar", text: data.error });
      return;
    }

    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: data.ubicacionGuardada ? "Domicilio entregado — nueva ubicación guardada" : "Domicilio entregado",
      timer: 1800,
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

  return { activos, distancias, loading, handleNuevo, handleEntregar, handleCancelar };
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "../../../lib/swal";
import { useRealtime } from "../../../lib/useRealtime";
import { openRegistroMantenimientoFormModal } from "../components/RegistroMantenimientoFormModal";
import { openVehiculoFormModal } from "../components/VehiculoFormModal";

export function useMantenimiento() {
  const [vehiculos, setVehiculos] = useState([]);
  const [vehiculosLoading, setVehiculosLoading] = useState(true);
  const [vehiculosError, setVehiculosError] = useState(null);
  const [idVehiculo, setIdVehiculo] = useState(null);

  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarVehiculos = useCallback(async () => {
    setVehiculosLoading(true);
    setVehiculosError(null);
    try {
      const res = await fetch("/api/vehiculos");
      const data = await res.json();
      setVehiculos(data);
      // Si el vehículo elegido ya no existe (o todavía no se había elegido
      // ninguno), cae al primero activo — así el selector nunca queda vacío
      // mientras haya al menos un vehículo activo.
      setIdVehiculo((actual) => {
        if (actual && data.some((v) => v.id_vehiculo === actual)) return actual;
        return data.find((v) => v.activo)?.id_vehiculo ?? null;
      });
    } catch {
      setVehiculosError("No se pudieron cargar los vehículos. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setVehiculosLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarVehiculos();
  }, [cargarVehiculos]);

  useRealtime("vehiculos:changed", cargarVehiculos);

  const cargar = useCallback(async () => {
    if (!idVehiculo) {
      setRegistros([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mantenimiento?id_vehiculo=${idVehiculo}`);
      setRegistros(await res.json());
    } catch {
      setError("No se pudo cargar el mantenimiento. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [idVehiculo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useRealtime("mantenimiento:changed", cargar);

  async function handleNuevoRegistro() {
    if (!idVehiculo) return;
    const creado = await openRegistroMantenimientoFormModal(idVehiculo);
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

  async function handleNuevoVehiculo() {
    const creado = await openVehiculoFormModal();
    if (!creado) return;
    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Vehículo creado",
      timer: 1200,
      showConfirmButton: false,
    });
    setIdVehiculo(creado.id_vehiculo);
    cargarVehiculos();
  }

  async function handleEditarVehiculo(vehiculo) {
    const editado = await openVehiculoFormModal(vehiculo);
    if (!editado) return;
    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Vehículo actualizado",
      timer: 1200,
      showConfirmButton: false,
    });
    cargarVehiculos();
  }

  // Gasto total por tipo — la vista le pone ícono/color (mismo criterio que
  // TIPO_INFO) al armar el gráfico de barras. Ya viene acotado al vehículo
  // seleccionado porque `registros` solo trae los suyos.
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

  return {
    vehiculos,
    vehiculosLoading,
    vehiculosError,
    reintentarVehiculos: cargarVehiculos,
    idVehiculo,
    setIdVehiculo,
    registros,
    loading,
    error,
    reintentar: cargar,
    handleNuevoRegistro,
    handleNuevoVehiculo,
    handleEditarVehiculo,
    gastoPorTipo,
    rendimientoPorTanqueo,
  };
}

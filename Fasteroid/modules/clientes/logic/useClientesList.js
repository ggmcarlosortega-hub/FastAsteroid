"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "../../../lib/swal";
import { useRealtime } from "../../../lib/useRealtime";
import { openClienteFormModal } from "../components/ClienteFormModal";

export function useClientesList() {
  const [clientes, setClientes] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async (query) => {
    setLoading(true);
    const res = await fetch(`/api/clientes${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json();
    setClientes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => cargar(q), 300);
    return () => clearTimeout(timeout);
  }, [q, cargar]);

  useRealtime("clientes:changed", () => cargar(q));

  async function handleNuevo() {
    const creado = await openClienteFormModal();
    if (!creado) return;
    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Cliente creado",
      timer: 1200,
      showConfirmButton: false,
    });
    cargar(q);
  }

  async function handleEditar(cliente) {
    const actualizado = await openClienteFormModal(cliente);
    if (!actualizado) return;
    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Cliente actualizado",
      timer: 1200,
      showConfirmButton: false,
    });
    cargar(q);
  }

  async function handleEliminar(cliente) {
    const result = await Swal.fire({
      icon: "warning",
      title: `¿Eliminar a ${cliente.nombre}?`,
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    const res = await fetch(`/api/clientes/${cliente.telefono}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      await Swal.fire({ icon: "error", title: "No se pudo eliminar", text: data.error });
      return;
    }

    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Cliente eliminado",
      timer: 1200,
      showConfirmButton: false,
    });
    cargar(q);
  }

  return { clientes, q, setQ, loading, handleNuevo, handleEditar, handleEliminar };
}

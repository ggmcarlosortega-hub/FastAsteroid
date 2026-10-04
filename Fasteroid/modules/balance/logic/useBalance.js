"use client";

import { useCallback, useEffect, useState } from "react";

function mesActual() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const ultimoDia = new Date(anio, ahora.getMonth() + 1, 0).getDate();
  return { desde: `${anio}-${mes}-01`, hasta: `${anio}-${mes}-${String(ultimoDia).padStart(2, "0")}` };
}

export function useBalance() {
  const [rango, setRango] = useState(mesActual);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async (r) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/balance?desde=${r.desde}&hasta=${r.hasta}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo cargar el balance");
        setBalance(null);
        return;
      }
      setBalance(data);
    } catch {
      setError("No se pudo cargar el balance. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar(rango);
  }, [rango, cargar]);

  return {
    rango,
    setRango,
    balance,
    loading,
    error,
    reintentar: () => cargar(rango),
  };
}

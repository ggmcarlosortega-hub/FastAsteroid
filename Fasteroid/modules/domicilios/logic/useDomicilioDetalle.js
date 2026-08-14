"use client";

import { useEffect, useState, useCallback } from "react";

export function useDomicilioDetalle(id) {
  const [domicilio, setDomicilio] = useState(null);
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
    setDomicilio(await res.json());
    setNotFound(false);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { domicilio, loading, notFound };
}

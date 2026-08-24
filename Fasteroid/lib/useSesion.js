"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const RUTA_POR_ROL = { Admin: "/admin", Domiciliario: "/domiciliario" };

// Reemplaza el guard de rol que antes hacía Fasteroid/proxy.js: ahora la única
// fuente de verdad de la sesión es el servidor Express (server/), así que cada
// layout protegido le pregunta por la sesión actual y redirige si no corresponde.
export function useSesion(rolRequerido) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelado) return;

        if (!data) {
          router.replace("/login");
          return;
        }
        if (data.rol !== rolRequerido) {
          router.replace(RUTA_POR_ROL[data.rol] ?? "/login");
          return;
        }
        setSession(data);
        setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [router, rolRequerido]);

  return { session, loading };
}

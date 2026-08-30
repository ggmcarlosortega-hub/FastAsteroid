"use client";

import { useEffect } from "react";
import DomiciliarioHeader from "../../components/DomiciliarioHeader";
import { useSesion } from "../../lib/useSesion";
import socket from "../../lib/socket";

export default function DomiciliarioLayout({ children }) {
  const { session, loading } = useSesion("Domiciliario");

  // Conecta el socket de tiempo real solo mientras hay sesión — evita
  // reintentos inútiles antes de loguearse (ver lib/socket.js).
  useEffect(() => {
    if (!session) return;
    socket?.connect();
    return () => socket?.disconnect();
  }, [session]);

  if (loading || !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <DomiciliarioHeader nombre={session.nombre} />
      <main className="mx-auto max-w-2xl px-6 py-8">{children}</main>
    </div>
  );
}

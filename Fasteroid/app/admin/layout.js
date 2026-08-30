"use client";

import { useEffect } from "react";
import AdminHeader from "../../components/AdminHeader";
import { useSesion } from "../../lib/useSesion";
import socket from "../../lib/socket";

export default function AdminLayout({ children }) {
  const { session, loading } = useSesion("Admin");

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
      <AdminHeader nombre={session.nombre} />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}

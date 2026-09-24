"use client";

import { useRouter } from "next/navigation";
import Swal from "../lib/swal";
import { Rocket, LogOut } from "lucide-react";
import MobileNavDrawer from "./MobileNavDrawer";

// Más simple que AdminHeader.js a propósito: el domiciliario solo tiene una
// pantalla (Mis domicilios), así que no hace falta menú de navegación — el
// drawer de móvil solo colapsa nombre + cerrar sesión, sin `links`, por
// consistencia con Admin y para no romper si el nombre real es largo.
export default function DomiciliarioHeader({ nombre }) {
  const router = useRouter();

  async function handleLogout() {
    const result = await Swal.fire({
      icon: "question",
      title: "¿Cerrar sesión?",
      showCancelButton: true,
      confirmButtonText: "Cerrar sesión",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
        <Rocket size={18} className="text-orange-500" />
        Fasteroid
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="hidden text-zinc-500 md:inline dark:text-zinc-400">{nombre}</span>
        <button
          onClick={handleLogout}
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 md:flex dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          <LogOut size={15} />
          Salir
        </button>
        <MobileNavDrawer nombre={nombre} onLogout={handleLogout} />
      </div>
    </header>
  );
}

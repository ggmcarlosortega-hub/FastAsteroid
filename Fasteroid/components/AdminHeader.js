"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "../lib/swal";
import { Rocket, Users, Bike, LayoutDashboard, LogOut, Boxes, IdCard, Wrench } from "lucide-react";

export default function AdminHeader({ nombre }) {
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
      {/* Logo + menú de navegación del Admin — agregar un link nuevo acá si se
          crea otra sección del panel (mismo patrón: icono + texto). */}
      <div className="flex items-center gap-6">
        <Link href="/admin" className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
          <Rocket size={18} className="text-orange-500" />
          Fasteroid
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/admin" className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-50">
            <LayoutDashboard size={15} />
            Panel
          </Link>
          <Link href="/admin/clientes" className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-50">
            <Users size={15} />
            Clientes
          </Link>
          <Link href="/admin/domicilios" className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-50">
            <Bike size={15} />
            Domicilios
          </Link>
          <Link href="/admin/inventario" className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-50">
            <Boxes size={15} />
            Inventario
          </Link>
          <Link href="/admin/domiciliarios" className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-50">
            <IdCard size={15} />
            Domiciliarios
          </Link>
          <Link href="/admin/mantenimiento" className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-50">
            <Wrench size={15} />
            Mantenimiento
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">{nombre}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          <LogOut size={15} />
          Salir
        </button>
      </div>
    </header>
  );
}

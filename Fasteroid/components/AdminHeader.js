"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "../lib/swal";
import { Rocket, Users, Bike, LayoutDashboard, LogOut, Boxes, IdCard, Wrench } from "lucide-react";
import MobileNavDrawer from "./MobileNavDrawer";

// Mismos links en ambas vistas de la nav (fila horizontal de desktop y el
// drawer de MobileNavDrawer en móvil) — un solo array evita mantenerlos
// sincronizados a mano en dos lugares.
const ADMIN_LINKS = [
  { href: "/admin", icon: LayoutDashboard, titulo: "Panel" },
  { href: "/admin/clientes", icon: Users, titulo: "Clientes" },
  { href: "/admin/domicilios", icon: Bike, titulo: "Domicilios" },
  { href: "/admin/inventario", icon: Boxes, titulo: "Inventario" },
  { href: "/admin/domiciliarios", icon: IdCard, titulo: "Domiciliarios" },
  { href: "/admin/mantenimiento", icon: Wrench, titulo: "Mantenimiento" },
];

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
    <header className="no-print flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Logo + menú de navegación del Admin — agregar un link nuevo acá si se
          crea otra sección del panel (mismo patrón: icono + texto). */}
      <div className="flex items-center gap-6">
        <Link href="/admin" className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
          <Rocket size={18} className="text-orange-500" />
          Fasteroid
        </Link>
        <nav className="hidden items-center gap-4 text-sm text-zinc-500 md:flex dark:text-zinc-400">
          {ADMIN_LINKS.map(({ href, icon: Icon, titulo }) => (
            <Link key={href} href={href} className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-50">
              <Icon size={15} />
              {titulo}
            </Link>
          ))}
        </nav>
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
        <MobileNavDrawer links={ADMIN_LINKS} nombre={nombre} onLogout={handleLogout} />
      </div>
    </header>
  );
}

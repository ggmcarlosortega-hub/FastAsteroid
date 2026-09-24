"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";

// Drawer de navegación para móvil, compartido entre AdminHeader.js y
// DomiciliarioHeader.js — en desktop cada header sigue mostrando su fila
// horizontal normal (`hidden md:flex`), esto es solo lo que aparece en
// pantallas chicas donde esa fila no cabe. `links` es opcional: Domiciliario
// no tiene páginas de navegación hoy, solo colapsa nombre + cerrar sesión.
export default function MobileNavDrawer({ links = [], nombre, onLogout }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  // Cambiar de ruta (tocar un link) cierra el drawer — ajustado durante el
  // render (patrón de React para "resetear estado cuando cambia una prop"),
  // no en un efecto, para no re-renderizar de más.
  const [pathnamePrevio, setPathnamePrevio] = useState(pathname);
  if (pathname !== pathnamePrevio) {
    setPathnamePrevio(pathname);
    setAbierto(false);
  }

  useEffect(() => {
    if (!abierto) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [abierto]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Abrir menú"
        aria-expanded={abierto}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <Menu size={20} />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setAbierto(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[80vw] flex-col bg-white shadow-xl dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{nombre}</span>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar menú"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            {links.length > 0 && (
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                {links.map(({ href, icon: Icon, titulo }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Icon size={17} />
                    {titulo}
                  </Link>
                ))}
              </nav>
            )}

            <div className={`p-3 ${links.length > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : "flex-1"}`}>
              <button
                onClick={() => {
                  setAbierto(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <LogOut size={17} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

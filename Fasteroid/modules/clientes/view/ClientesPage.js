"use client";

import Link from "next/link";
import { Search, UserPlus, Pencil, Trash2, MapPin, Bike, ChevronRight } from "lucide-react";
import { useClientesList } from "../logic/useClientesList";

export default function ClientesPage() {
  const { clientes, q, setQ, loading, handleNuevo, handleEditar, handleEliminar } =
    useClientesList();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Identificados por teléfono, con nombre y ubicaciones asociadas.
          </p>
        </div>
        <button
          onClick={handleNuevo}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <UserPlus size={16} />
          Nuevo cliente
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
        <Search size={16} className="text-zinc-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {loading && (
          <p className="p-6 text-center text-sm text-zinc-400">Cargando...</p>
        )}
        {!loading && clientes.length === 0 && (
          <p className="p-6 text-center text-sm text-zinc-400">
            No hay clientes registrados todavía.
          </p>
        )}
        {clientes.map((cliente) => (
          <div key={cliente.telefono} className="flex items-center justify-between px-5 py-4">
            <Link
              href={`/admin/clientes/${cliente.telefono}`}
              className="flex-1 group"
            >
              <p className="font-medium text-zinc-900 group-hover:text-orange-600 dark:text-zinc-50">
                {cliente.nombre}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <span>{cliente.telefono}</span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {cliente._count.ubicaciones}
                </span>
                <span className="flex items-center gap-1">
                  <Bike size={12} />
                  {cliente._count.domicilios}
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleEditar(cliente)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleEliminar(cliente)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
              <Link
                href={`/admin/clientes/${cliente.telefono}`}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

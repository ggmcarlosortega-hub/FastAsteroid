"use client";

import { Bike, Phone, Power, Plus } from "lucide-react";
import { useDomiciliarios } from "../logic/useDomiciliarios";
import DesglosePago from "../components/DesglosePago";

export default function DomiciliariosPage() {
  const { domiciliarios, loading, handleToggleActivo, handleNuevoDomiciliario } = useDomiciliarios();

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Domiciliarios</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Activa o desactiva domiciliarios y consulta cuánto han recaudado en efectivo y transferencia.
          </p>
        </div>
        <button
          onClick={handleNuevoDomiciliario}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus size={16} />
          Nuevo domiciliario
        </button>
      </div>

      {loading && <p className="mt-6 text-center text-sm text-zinc-400">Cargando...</p>}

      <div className="mt-4 flex flex-col gap-2">
        {!loading && domiciliarios.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
            No hay domiciliarios registrados.
          </p>
        )}
        {domiciliarios.map((d) => (
          // "group" habilita group-hover en el tooltip de abajo — CSS puro, sin
          // librería nueva (mismo mecanismo pedido en el plan aprobado).
          <div
            key={d.telefono}
            className="group relative flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  d.activo
                    ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                }`}
              >
                <Bike size={16} />
              </span>
              <div>
                <p className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-50">
                  {d.nombre}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      d.activo
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {d.activo ? "Activo" : "Inactivo"}
                  </span>
                </p>
                <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <Phone size={11} />
                  {d.telefono}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggleActivo(d)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                d.activo
                  ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              }`}
            >
              <Power size={14} />
              {d.activo ? "Desactivar" : "Activar"}
            </button>

            {/* Tooltip con el desglose histórico — aparece con group-hover, oculto
                por defecto y sin interferir con el layout mientras no se muestra. */}
            <div className="pointer-events-none absolute left-4 top-full z-10 mt-1 w-64 rounded-xl border border-zinc-200 bg-white p-3 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Recaudado histórico (todos los domicilios entregados)
              </p>
              <DesglosePago efectivo={d.total_efectivo} transferencia={d.total_transferencia} compact />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

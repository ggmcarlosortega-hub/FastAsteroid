"use client";

import { Plus, Fuel, Wrench, ShoppingBag, Gauge, TrendingUp } from "lucide-react";
import { useMantenimiento } from "../logic/useMantenimiento";

const TIPO_INFO = {
  Tanqueo: {
    label: "Tanqueo",
    icon: Fuel,
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  Taller: {
    label: "Taller",
    icon: Wrench,
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  Compra_Adicional: {
    label: "Compra adicional",
    icon: ShoppingBag,
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
};

export default function MantenimientoPage() {
  const { registros, loading, handleNuevoRegistro } = useMantenimiento();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Mantenimiento</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Tanqueos, taller y compras adicionales de la moto, con rendimiento (km/galón) entre
            tanqueos consecutivos.
          </p>
        </div>
        <button
          onClick={handleNuevoRegistro}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus size={16} />
          Nuevo registro
        </button>
      </div>

      {loading && <p className="mt-6 text-center text-sm text-zinc-400">Cargando...</p>}

      <div className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {!loading && registros.length === 0 && (
          <p className="p-6 text-center text-sm text-zinc-400">
            No hay registros de mantenimiento todavía.
          </p>
        )}
        {registros.map((r) => {
          const info = TIPO_INFO[r.tipo];
          return (
            <div key={r.id_registro} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${info.badge}`}>
                    <info.icon size={11} />
                    {info.label}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <Gauge size={12} />
                    {r.kilometraje_actual.toLocaleString("es-CO")} km
                  </span>
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {r.tipo === "Tanqueo"
                    ? `${r.galones_ingresados.toLocaleString("es-CO")} galones`
                    : r.descripcion_compras_y_taller}
                  {r.rendimiento_km_galon != null && (
                    <span className="ml-2 inline-flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                      <TrendingUp size={12} />
                      {r.rendimiento_km_galon.toFixed(1)} km/gal
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  ${r.costo_total.toLocaleString("es-CO")}
                </p>
                <p className="text-xs text-zinc-400">
                  {new Date(r.fecha_hora).toLocaleDateString("es-CO")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

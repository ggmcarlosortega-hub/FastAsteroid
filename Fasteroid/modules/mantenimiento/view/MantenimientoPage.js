"use client";

import { Plus, Fuel, Wrench, ShoppingBag, Gauge, TrendingUp, Download, Printer, DollarSign } from "lucide-react";
import { useMantenimiento } from "../logic/useMantenimiento";
import BarrasHorizontales from "../../../components/charts/BarrasHorizontales";
import BarrasSerie from "../../../components/charts/BarrasSerie";
import { descargarCsv } from "../../../lib/exportCsv";

const COLUMNAS_CSV = [
  { key: "tipo", label: "Tipo" },
  { key: "kilometraje_actual", label: "Kilometraje" },
  { key: "galones_ingresados", label: "Galones" },
  { key: "descripcion_compras_y_taller", label: "Descripción" },
  { key: "costo_total", label: "Costo" },
  { key: "fecha_hora", label: "Fecha" },
  { key: "rendimiento_km_galon", label: "Rendimiento (km/gal)" },
];

const TIPO_INFO = {
  Tanqueo: {
    label: "Tanqueo",
    icon: Fuel,
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    color: "bg-amber-500",
  },
  Taller: {
    label: "Taller",
    icon: Wrench,
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    color: "bg-blue-500",
  },
  Compra_Adicional: {
    label: "Compra adicional",
    icon: ShoppingBag,
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    color: "bg-purple-500",
  },
};

export default function MantenimientoPage() {
  const { registros, loading, handleNuevoRegistro, gastoPorTipo, rendimientoPorTanqueo } = useMantenimiento();

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
        <div className="flex items-center gap-2">
          {/* Exportes (Fase 3) — CSV cliente-side sobre los registros ya
              cargados; PDF vía impresión del navegador (.no-print en globals.css). */}
          <div className="no-print flex gap-1">
            <button
              onClick={() => descargarCsv("mantenimiento.csv", COLUMNAS_CSV, registros)}
              title="Exportar CSV"
              className="flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Download size={13} />
              CSV
            </button>
            <button
              onClick={() => window.print()}
              title="Exportar PDF"
              className="flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Printer size={13} />
              PDF
            </button>
          </div>
          <button
            onClick={handleNuevoRegistro}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus size={16} />
            Nuevo registro
          </button>
        </div>
      </div>

      {loading && <p className="mt-6 text-center text-sm text-zinc-400">Cargando...</p>}

      {/* Gráficos de contexto (Fase 3 — PDF con estadísticas): antes esta
          pantalla no tenía ningún gráfico, solo la lista cruda. Al estar en la
          vista normal, "Exportar PDF" (window.print()) los incluye gratis. */}
      {!loading && gastoPorTipo?.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <BarrasHorizontales
            titulo="Gasto por tipo"
            icon={DollarSign}
            items={gastoPorTipo.map(({ tipo, valor }) => ({
              label: TIPO_INFO[tipo]?.label ?? tipo,
              valor,
              color: TIPO_INFO[tipo]?.color ?? "bg-zinc-400",
              icon: TIPO_INFO[tipo]?.icon,
            }))}
            formato={(v) => `$${Math.round(v).toLocaleString("es-CO")}`}
          />
          <BarrasSerie
            titulo="Rendimiento por tanqueo (km/gal)"
            icon={TrendingUp}
            items={rendimientoPorTanqueo}
            color="bg-amber-500"
            formato={(v) => v.toFixed(1)}
          />
        </div>
      )}

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

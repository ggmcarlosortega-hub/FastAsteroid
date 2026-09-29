"use client";

import { useState } from "react";
import {
  Plus,
  Fuel,
  Wrench,
  ShoppingBag,
  Gauge,
  TrendingUp,
  Download,
  Printer,
  DollarSign,
  Car,
  Pencil,
} from "lucide-react";
import { useMantenimiento } from "../logic/useMantenimiento";
import BarrasHorizontales from "../../../components/charts/BarrasHorizontales";
import BarrasSerie from "../../../components/charts/BarrasSerie";
import { descargarCsv } from "../../../lib/exportCsv";
import ErrorReintentar from "../../../components/ErrorReintentar";

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
  const [tab, setTab] = useState("registros");
  const {
    vehiculos,
    vehiculosLoading,
    vehiculosError,
    reintentarVehiculos,
    idVehiculo,
    setIdVehiculo,
    registros,
    loading,
    error,
    reintentar,
    handleNuevoRegistro,
    handleNuevoVehiculo,
    handleEditarVehiculo,
    gastoPorTipo,
    rendimientoPorTanqueo,
  } = useMantenimiento();

  const vehiculoSeleccionado = vehiculos.find((v) => v.id_vehiculo === idVehiculo) ?? null;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Mantenimiento</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Tanqueos, taller y compras adicionales por vehículo, con rendimiento (km/galón) entre
            tanqueos consecutivos del mismo vehículo.
          </p>
        </div>
        {tab === "registros" && (
          <div className="flex flex-wrap items-center gap-2">
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
              disabled={!idVehiculo}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus size={16} />
              Nuevo registro
            </button>
          </div>
        )}
        {tab === "vehiculos" && (
          <button
            onClick={handleNuevoVehiculo}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus size={16} />
            Nuevo vehículo
          </button>
        )}
      </div>

      {/* Pestañas: "Registros" (historial del vehículo elegido en el selector)
          y "Vehículos" (alta/baja de motos — CU nuevo, mismo patrón que
          Categorías en InventarioPage.js). */}
      <div className="no-print mt-4 flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {[
          { id: "registros", label: "Registros" },
          { id: "vehiculos", label: "Vehículos" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "registros" && (
        <div className="no-print mt-4 flex items-center gap-2">
          <Car size={16} className="text-zinc-400" />
          {vehiculosLoading ? (
            <p className="text-sm text-zinc-400">Cargando vehículos...</p>
          ) : vehiculos.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No hay vehículos registrados todavía. Crea uno en la pestaña &ldquo;Vehículos&rdquo;.
            </p>
          ) : (
            <select
              value={idVehiculo ?? ""}
              onChange={(e) => setIdVehiculo(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
            >
              {vehiculos
                .filter((v) => v.activo || v.id_vehiculo === idVehiculo)
                .map((v) => (
                  <option key={v.id_vehiculo} value={v.id_vehiculo}>
                    {v.nombre}
                    {v.placa ? ` (${v.placa})` : ""}
                    {!v.activo ? " — inactivo" : ""}
                  </option>
                ))}
            </select>
          )}
        </div>
      )}

      {tab === "vehiculos" && (
        <div className="mt-4">
          {vehiculosLoading && <p className="text-center text-sm text-zinc-400">Cargando...</p>}
          {!vehiculosLoading && vehiculosError && (
            <ErrorReintentar mensaje={vehiculosError} onReintentar={reintentarVehiculos} />
          )}
          {!vehiculosLoading && !vehiculosError && (
            <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {vehiculos.length === 0 && (
                <p className="p-6 text-center text-sm text-zinc-400">No hay vehículos registrados todavía.</p>
              )}
              {vehiculos.map((v) => (
                <div key={v.id_vehiculo} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-50">
                      {v.nombre}
                      {!v.activo && (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          Inactivo
                        </span>
                      )}
                    </p>
                    {v.placa && <p className="text-xs text-zinc-500 dark:text-zinc-400">{v.placa}</p>}
                  </div>
                  <button
                    onClick={() => handleEditarVehiculo(v)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab !== "registros" ? null : loading ? (
        <p className="mt-6 text-center text-sm text-zinc-400">Cargando...</p>
      ) : (
        error && <ErrorReintentar mensaje={error} onReintentar={reintentar} />
      )}

      {tab === "registros" && (
        <>
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
            {!loading && !vehiculoSeleccionado && (
              <p className="p-6 text-center text-sm text-zinc-400">
                Elige o crea un vehículo para ver su historial de mantenimiento.
              </p>
            )}
            {!loading && vehiculoSeleccionado && registros.length === 0 && (
              <p className="p-6 text-center text-sm text-zinc-400">
                No hay registros de mantenimiento todavía para {vehiculoSeleccionado.nombre}.
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
        </>
      )}
    </div>
  );
}

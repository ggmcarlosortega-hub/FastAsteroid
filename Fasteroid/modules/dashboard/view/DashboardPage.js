"use client";

import Link from "next/link";
import {
  Bike,
  CalendarDays,
  Navigation,
  UserCheck,
  Fuel,
  Wrench,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useDashboardMensual } from "../logic/useDashboardMensual";
import GananciasPerdidas from "../../domicilios/components/GananciasPerdidas";
import BarrasComparativas from "../../../components/charts/BarrasComparativas";
import BarrasHorizontales from "../../../components/charts/BarrasHorizontales";

// Mismo patrón que ResumenTile en DomiciliarioHomePage.js — componente chico de
// presentación, se copia acá porque no vale la pena una capa compartida para esto.
// Color de acento igual al de /login y la landing (#a9787d), no el naranja del
// resto del panel Admin — este panel es la "cara" administrativa del negocio.
function Tile({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <Icon size={16} className="text-[#a9787d]" />
      <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{value}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
    </div>
  );
}

// Mismos tonos de marca que login/landing (#a9787d, #8f6266), variando opacidad
// para diferenciar hasta 5 productos sin salirse de la paleta establecida.
const COLORES_TOP_PRODUCTOS = [
  "bg-[#a9787d]",
  "bg-[#8f6266]",
  "bg-[#a9787d]/70",
  "bg-[#8f6266]/70",
  "bg-[#a9787d]/45",
];

export default function DashboardPage() {
  const { mes, setMes, resumen, alerta, serie, topProductos, loading } = useDashboardMensual();

  return (
    <div>
      {/* Alerta de mantenimiento preventivo (Fase 3) — no depende del mes elegido
          arriba, siempre refleja el estado actual de la moto. */}
      {alerta?.debeAlertar && (
        <Link
          href="/admin/mantenimiento"
          className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
        >
          <AlertTriangle size={18} className="shrink-0" />
          <span>
            La moto lleva <strong>{alerta.km_desde_taller.toLocaleString("es-CO")} km</strong> desde el
            último mantenimiento en taller (umbral: {alerta.umbral_km.toLocaleString("es-CO")} km) —
            puede ser hora de una revisión.
          </span>
        </Link>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Panel Admin</h1>
        <label className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          <CalendarDays size={15} />
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-[#a9787d] focus:ring-1 focus:ring-[#a9787d] dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
      </div>

      {loading && <p className="mt-6 text-center text-sm text-zinc-400">Cargando...</p>}

      {!loading && resumen && (
        <>
          {/* Comparativa de los últimos 6 meses — clic en un mes mueve el
              selector de arriba, así todo lo de abajo pasa a mostrar el
              detalle de ese mes sin duplicar ningún desglose. */}
          <div className="mt-6">
            <BarrasComparativas serie={serie} mesSeleccionado={mes} onSelect={setMes} />
          </div>

          {/* Domicilios: reusa GananciasPerdidas.js tal cual (mismo componente que
              /admin/domicilios) + tiles con el resto de indicadores del mes elegido. */}
          <div className="mt-6">
            <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Domicilios</h2>
            <div className="mt-3">
              <GananciasPerdidas ganancias={resumen.ganancias} perdidas={resumen.perdidas} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Tile icon={Bike} label="Entregados" value={resumen.domicilios_entregados} />
              <Tile icon={Navigation} label="Km recorridos" value={resumen.km_recorridos.toFixed(1)} />
              <Tile
                icon={UserCheck}
                label="Cliente más frecuente"
                value={resumen.cliente_mas_frecuente ? resumen.cliente_mas_frecuente.nombre : "—"}
              />
            </div>
            {topProductos && topProductos.length > 0 && (
              <div className="mt-3">
                <BarrasHorizontales
                  titulo="Productos más vendidos"
                  icon={ShoppingBag}
                  items={topProductos.map((p, i) => ({
                    label: p.nombre,
                    valor: p.cantidad,
                    color: COLORES_TOP_PRODUCTOS[i % COLORES_TOP_PRODUCTOS.length],
                  }))}
                />
              </div>
            )}
          </div>

          {/* Mantenimiento: indicadores del Bloque 3 (registro_mantenimiento),
              agregados al mismo mes elegido — ver aplicativos.md sección 7.1. */}
          <div className="mt-6">
            <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Mantenimiento</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tile icon={Fuel} label="Tanqueos" value={resumen.tanqueos} />
              <Tile
                icon={Wrench}
                label="Gasto combustible"
                value={`$${resumen.gasto_combustible.toLocaleString("es-CO")}`}
              />
              <Tile
                icon={ShoppingBag}
                label="Taller / compras"
                value={`$${resumen.gasto_taller_compras.toLocaleString("es-CO")}`}
              />
              <Tile
                icon={TrendingUp}
                label="Rendimiento prom."
                value={
                  resumen.rendimiento_promedio_km_galon != null
                    ? `${resumen.rendimiento_promedio_km_galon.toFixed(1)} km/gal`
                    : "—"
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

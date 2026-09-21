"use client";

import Link from "next/link";
import {
  Users,
  Bike,
  ArrowRight,
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

const ACCESOS = [
  { href: "/admin/clientes", icon: Users, titulo: "Clientes", descripcion: "Alta, edición y ubicaciones" },
  { href: "/admin/domicilios", icon: Bike, titulo: "Domicilios", descripcion: "En curso, historial y asignación" },
];

// Mismo patrón que ResumenTile en DomiciliarioHomePage.js — componente chico de
// presentación, se copia acá porque no vale la pena una capa compartida para esto.
function Tile({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <Icon size={16} className="text-orange-500" />
      <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{value}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { mes, setMes, resumen, alerta, loading } = useDashboardMensual();

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
            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
      </div>

      {loading && <p className="mt-6 text-center text-sm text-zinc-400">Cargando...</p>}

      {!loading && resumen && (
        <>
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

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {ACCESOS.map(({ href, icon: Icon, titulo, descripcion }) => (
          <Link
            key={href}
            href={href}
            className="flex w-fit items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4 transition-colors hover:border-orange-300 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <Icon size={18} />
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{titulo}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{descripcion}</p>
            </div>
            <ArrowRight size={16} className="ml-4 text-zinc-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Plus, MapPin, Package, Box, Calendar, User, ChevronRight, Inbox } from "lucide-react";
import { useDomiciliosAdmin } from "../logic/useDomiciliosAdmin";
import GananciasPerdidas from "../components/GananciasPerdidas";

const ESTADO_BADGE = {
  En_curso: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Entregado: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminDomiciliosPage() {
  const { activos, asignados, historial, periodo, setPeriodo, loading, handleNuevo, ganancias, perdidas } =
    useDomiciliosAdmin();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Domicilios</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {activos.length} en curso entre todos los domiciliarios
          </p>
        </div>
        <button
          onClick={handleNuevo}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus size={16} />
          Nuevo domicilio
        </button>
      </div>

      {asignados.length > 0 && (
        <div className="mt-6">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Inbox size={15} />
            Asignados — pendientes de recoger
          </h2>
          <div className="mt-2 flex flex-col gap-2">
            {asignados.map((domicilio) => (
              <div
                key={domicilio.id_domicilio}
                className="flex items-start justify-between rounded-xl border border-dashed border-orange-300 bg-orange-50/50 p-4 dark:border-orange-900/50 dark:bg-orange-900/10"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{domicilio.cliente.nombre}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <MapPin size={12} />
                    {domicilio.ubicacion.alias_direccion}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <User size={12} />
                    {domicilio.domiciliario.nombre}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                    <Package size={13} />
                    {domicilio.productos}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {!loading && activos.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
            No hay domicilios en curso.
          </p>
        )}
        {activos.map((domicilio) => (
          <Link
            key={domicilio.id_domicilio}
            href={`/admin/domicilios/${domicilio.id_domicilio}`}
            className="flex items-start justify-between rounded-xl border border-zinc-200 bg-white p-4 hover:border-orange-300 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{domicilio.cliente.nombre}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <MapPin size={12} />
                {domicilio.ubicacion.alias_direccion}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <User size={12} />
                {domicilio.domiciliario.nombre}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                <Package size={13} />
                {domicilio.productos}
              </p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              <Box size={12} />
              Espacio {domicilio.espacio_baul}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Ganancias, pérdidas e historial
          </h2>
          <div className="flex gap-1 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">
            {[
              { id: "dia", label: "Día" },
              { id: "semana", label: "Semana" },
              { id: "mes", label: "Mes" },
            ].map((opcion) => (
              <button
                key={opcion.id}
                onClick={() => setPeriodo(opcion.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  periodo === opcion.id
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {opcion.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <GananciasPerdidas ganancias={ganancias} perdidas={perdidas} />
        </div>

        <div className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {!loading && historial.length === 0 && (
            <p className="p-6 text-center text-sm text-zinc-400">Sin domicilios en este período.</p>
          )}
          {historial.map((domicilio) => (
            <Link
              key={domicilio.id_domicilio}
              href={`/admin/domicilios/${domicilio.id_domicilio}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {domicilio.cliente.nombre}
                </p>
                <p className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    {domicilio.domiciliario.nombre}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(domicilio.fecha_hora_creacion).toLocaleString("es-CO")}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_BADGE[domicilio.estado] ?? ""}`}
                >
                  {domicilio.estado.replace("_", " ")}
                </span>
                <ChevronRight size={16} className="text-zinc-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  Plus,
  MapPin,
  Package,
  Navigation,
  CheckCircle2,
  XCircle,
  Bike,
  Wallet,
  Calendar,
  Box,
  ChevronRight,
  Inbox,
  ScanLine,
  Map,
} from "lucide-react";
import { useDomiciliosActivos } from "../logic/useDomiciliosActivos";
import { useHistorial } from "../logic/useHistorial";
import { googleMapsUrl } from "../logic/googleMapsUrl";

const ESTADO_BADGE = {
  Entregado: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function DomiciliarioHomePage() {
  const {
    activos,
    asignados,
    distancias,
    loading,
    handleNuevo,
    handleEscanear,
    handleEntregar,
    handleCancelar,
    handleRecoger,
  } = useDomiciliosActivos();
  // El domiciliario solo ve estadísticas del día — las métricas completas
  // (semana/mes) quedan reservadas al panel del Administrador.
  const { domicilios, loading: cargandoHistorial, resumen } = useHistorial("dia");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Mis domicilios
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {activos.length}/3 en curso
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleEscanear}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ScanLine size={16} />
            Escanear comanda
          </button>
          <button
            onClick={handleNuevo}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus size={16} />
            Nuevo domicilio
          </button>
        </div>
      </div>

      {asignados.length > 0 && (
        <div className="mt-6">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Inbox size={15} />
            Asignados por el administrador — pendientes de recoger
          </h2>
          <div className="mt-2 flex flex-col gap-2">
            {asignados.map((domicilio) => (
              <div
                key={domicilio.id_domicilio}
                className="flex items-center justify-between rounded-xl border border-dashed border-orange-300 bg-orange-50/50 p-4 dark:border-orange-900/50 dark:bg-orange-900/10"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {domicilio.cliente.nombre}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <MapPin size={12} />
                    {domicilio.ubicacion.alias_direccion}
                  </p>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                    <Package size={14} className="mt-0.5 shrink-0" />
                    {domicilio.productos}
                  </p>
                </div>
                <button
                  onClick={() => handleRecoger(domicilio)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <Box size={15} />
                  Recoger
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {!loading && activos.length === 0 && asignados.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
            No tienes domicilios en curso.
          </p>
        )}
        {activos.map((domicilio) => (
          <div
            key={domicilio.id_domicilio}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <Link href={`/domiciliario/${domicilio.id_domicilio}`} className="group">
                <p className="font-medium text-zinc-900 group-hover:text-orange-600 dark:text-zinc-50">
                  {domicilio.cliente.nombre}
                </p>
                <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <MapPin size={12} />
                  {domicilio.ubicacion.alias_direccion}
                </p>
              </Link>
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                <Box size={12} />
                Espacio {domicilio.espacio_baul}
              </span>
            </div>

            <p className="mt-2 flex items-start gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
              <Package size={14} className="mt-0.5 shrink-0" />
              {domicilio.productos}
            </p>

            <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Navigation size={12} />
                {(distancias[domicilio.id_domicilio] ?? 0).toFixed(2)} km recorridos
              </span>
              <a
                href={googleMapsUrl(domicilio.ubicacion.latitud, domicilio.ubicacion.longitud)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
              >
                <Map size={12} />
                Ver en Maps
              </a>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleEntregar(domicilio)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <CheckCircle2 size={15} />
                Entregado
              </button>
              <button
                onClick={() => handleCancelar(domicilio)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20"
              >
                <XCircle size={15} />
                Cancelar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Historial de hoy</h2>
          <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Día
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResumenTile icon={Bike} label="Entregados" value={resumen.entregados} />
          <ResumenTile icon={XCircle} label="Cancelados" value={resumen.cancelados} />
          <ResumenTile icon={Wallet} label="Recaudado" value={`$${resumen.recaudado.toLocaleString("es-CO")}`} />
          <ResumenTile icon={Navigation} label="Km" value={resumen.km.toFixed(1)} />
        </div>

        <div className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {!cargandoHistorial && domicilios.length === 0 && (
            <p className="p-6 text-center text-sm text-zinc-400">Sin domicilios en este período.</p>
          )}
          {domicilios.map((domicilio) => (
            <Link
              key={domicilio.id_domicilio}
              href={`/domiciliario/${domicilio.id_domicilio}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {domicilio.cliente.nombre}
                </p>
                <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <Calendar size={11} />
                  {new Date(domicilio.fecha_hora_creacion).toLocaleString("es-CO")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_BADGE[domicilio.estado] ?? ""}`}
                >
                  {domicilio.estado}
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

function ResumenTile({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-4 dark:border-zinc-800 dark:bg-zinc-900">
      <Icon size={16} className="text-orange-500" />
      <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{value}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
    </div>
  );
}

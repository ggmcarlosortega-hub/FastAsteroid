"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Plus, Pencil, Trash2, Phone, Calendar } from "lucide-react";
import { useClienteDetalle } from "../logic/useClienteDetalle";
import MapaUbicacion from "../../../components/MapaUbicacion";

export default function ClienteDetallePage() {
  const { telefono } = useParams();
  const router = useRouter();
  const { cliente, loading, handleAgregarUbicacion, handleEditarUbicacion, handleEliminarUbicacion } =
    useClienteDetalle(telefono);

  if (loading) {
    return <p className="text-sm text-zinc-400">Cargando...</p>;
  }

  if (!cliente) {
    return (
      <div>
        <p className="text-sm text-zinc-400">Cliente no encontrado.</p>
        <button
          onClick={() => router.push("/admin/clientes")}
          className="mt-3 flex items-center gap-1.5 text-sm text-orange-600"
        >
          <ArrowLeft size={15} />
          Volver
        </button>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/clientes"
        className="mb-4 flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={15} />
        Clientes
      </Link>

      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {cliente.nombre}
      </h1>
      <div className="mt-1 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Phone size={14} />
          {cliente.telefono}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar size={14} />
          Cliente desde {new Date(cliente.fecha_primer_registro).toLocaleDateString("es-CO")}
        </span>
      </div>

      {/* Sección de ubicaciones guardadas del cliente — esta es la lista de la
          que se elige al crear un domicilio (ver UbicacionStepContent en
          NuevoDomicilioModal.js). */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <MapPin size={16} />
          Ubicaciones ({cliente.ubicaciones.length})
        </h2>
        <button
          onClick={handleAgregarUbicacion}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus size={14} />
          Agregar
        </button>
      </div>

      <div className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {cliente.ubicaciones.length === 0 && (
          <p className="p-6 text-center text-sm text-zinc-400">
            Este cliente todavía no tiene ubicaciones guardadas.
          </p>
        )}
        {cliente.ubicaciones.map((ubicacion) => (
          <div key={ubicacion.id_ubicacion} className="flex flex-col gap-2 px-5 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {ubicacion.alias_direccion}
                {ubicacion.municipio && (
                  <span className="ml-1.5 font-normal text-zinc-400">
                    ({ubicacion.municipio.nombre}, +${ubicacion.municipio.recargo_domicilio.toLocaleString("es-CO")})
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEditarUbicacion(ubicacion)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleEliminarUbicacion(ubicacion)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <MapaUbicacion latitud={ubicacion.latitud} longitud={ubicacion.longitud} height={140} />
          </div>
        ))}
      </div>
    </div>
  );
}

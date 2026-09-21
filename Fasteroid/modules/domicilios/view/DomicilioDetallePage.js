"use client";

import { useParams, useRouter, usePathname } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Package,
  Box,
  Calendar,
  Wallet,
  Navigation,
  Bike,
  AlertCircle,
  Pencil,
  Map,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useDomicilioDetalle } from "../logic/useDomicilioDetalle";
import { googleMapsUrl } from "../logic/googleMapsUrl";
import MapaUbicacion from "../../../components/MapaUbicacion";

const ESTADO_BADGE = {
  Asignado: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  En_curso: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Entregado: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// Una fila "ícono + etiqueta + valor" reutilizada para cada dato del domicilio
// de más abajo (teléfono, ubicación, productos, precio, etc.)
function Dato({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-zinc-400" />
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-sm text-zinc-900 dark:text-zinc-50">{children}</p>
      </div>
    </div>
  );
}

export default function DomicilioDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const esAdmin = pathname.startsWith("/admin");
  const { domicilio, rentabilidad, loading, notFound, handleEditar } = useDomicilioDetalle(id, esAdmin);

  if (loading) {
    return <p className="text-sm text-zinc-400">Cargando...</p>;
  }

  if (notFound || !domicilio) {
    return (
      <div>
        <p className="text-sm text-zinc-400">Domicilio no encontrado.</p>
        <button
          onClick={() => router.back()}
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
      <button
        onClick={() => router.back()}
        className="mb-4 flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={15} />
        Volver
      </button>

      {/* Título (nombre del cliente) + badge de estado + botón Editar (solo
          visible para el Admin, ver esAdmin arriba). */}
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {domicilio.cliente.nombre}
        </h1>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${ESTADO_BADGE[domicilio.estado]}`}>
            {domicilio.estado.replace("_", " ")}
          </span>
          {esAdmin && (
            <button
              onClick={handleEditar}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Pencil size={13} />
              Editar
            </button>
          )}
        </div>
      </div>

      {domicilio.foto_productos_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={domicilio.foto_productos_url}
          alt="Foto del pedido"
          className="mt-4 h-48 w-48 rounded-xl object-cover"
        />
      )}

      {/* Grilla con todos los datos del domicilio (2 columnas en pantallas
          anchas) — cada fila es un componente Dato de arriba; las últimas 4
          filas son condicionales y solo aparecen según el estado (entregado,
          cancelado, etc.). */}
      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2">
        <div className="flex items-center justify-between">
          <Dato icon={Phone} label="Teléfono del cliente">
            {domicilio.cliente.telefono}
          </Dato>
          <a
            href={`tel:${domicilio.cliente.telefono}`}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Phone size={13} />
            Llamar
          </a>
        </div>
        <div className="flex items-center justify-between">
          <Dato icon={MapPin} label="Ubicación de entrega">
            {domicilio.ubicacion.alias_direccion}
            {domicilio.ubicacion.municipio && ` (${domicilio.ubicacion.municipio.nombre})`}
          </Dato>
          <a
            href={googleMapsUrl(domicilio.ubicacion.latitud, domicilio.ubicacion.longitud)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Map size={13} />
            Maps
          </a>
        </div>
        <div className="sm:col-span-2">
          <MapaUbicacion latitud={domicilio.ubicacion.latitud} longitud={domicilio.ubicacion.longitud} height={200} />
        </div>
        <Dato icon={Package} label="Productos">
          {domicilio.productos}
        </Dato>
        <Dato icon={Wallet} label="Precio (valor del pedido)">
          ${domicilio.precio.toLocaleString("es-CO")}
        </Dato>
        <Dato icon={Box} label="Espacio del baúl">
          {domicilio.espacio_baul != null ? `Espacio ${domicilio.espacio_baul}` : "Sin recoger todavía"}
        </Dato>
        <Dato icon={User} label="Domiciliario">
          {domicilio.domiciliario?.nombre ?? "Sin asignar — en lista de espera"}
        </Dato>
        <Dato icon={Calendar} label="Creado">
          {new Date(domicilio.fecha_hora_creacion).toLocaleString("es-CO")}
        </Dato>

        {domicilio.fecha_hora_entrega && (
          <Dato icon={Calendar} label={domicilio.estado === "Cancelado" ? "Cancelado" : "Entregado"}>
            {new Date(domicilio.fecha_hora_entrega).toLocaleString("es-CO")}
          </Dato>
        )}
        {domicilio.distancia_km != null && (
          <Dato icon={Navigation} label="Distancia recorrida">
            {domicilio.distancia_km.toFixed(2)} km
          </Dato>
        )}
        {domicilio.metodo_pago && (
          <Dato icon={Wallet} label="Método de pago">
            {domicilio.metodo_pago}
          </Dato>
        )}
        {domicilio.valor_recaudado != null && (
          <Dato icon={Bike} label="Valor cobrado">
            ${domicilio.valor_recaudado.toLocaleString("es-CO")}
          </Dato>
        )}
        {domicilio.motivo_cancelacion && (
          <div className="sm:col-span-2">
            <Dato icon={AlertCircle} label="Motivo de cancelación">
              {domicilio.motivo_cancelacion}
            </Dato>
          </div>
        )}
      </div>

      {/* Rentabilidad (Fase 3) — cobrado vs. costo de gasolina/mantenimiento
          prorrateado por los km de este domicilio, usando el costo por km del mes
          en que se entregó (ver dashboard.service.js). Solo Admin, solo entregados. */}
      {rentabilidad && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {rentabilidad.rentabilidad >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            Rentabilidad de este domicilio
          </p>
          <p
            className={`mt-1 text-3xl font-semibold ${
              rentabilidad.rentabilidad >= 0
                ? "text-green-700 dark:text-green-500"
                : "text-red-700 dark:text-red-500"
            }`}
          >
            {rentabilidad.rentabilidad >= 0 ? "+" : "−"}$
            {Math.round(Math.abs(rentabilidad.rentabilidad)).toLocaleString("es-CO")}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600 dark:text-zinc-300">
            <span>
              Cobrado:{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                ${rentabilidad.cobrado.toLocaleString("es-CO")}
              </span>
            </span>
            <span>
              Costo prorrateado (gasolina/mantenimiento):{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                ${Math.round(rentabilidad.costo_prorrateado).toLocaleString("es-CO")}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

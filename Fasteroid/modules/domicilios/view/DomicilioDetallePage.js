"use client";

import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import { useDomicilioDetalle } from "../logic/useDomicilioDetalle";

const ESTADO_BADGE = {
  En_curso: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Entregado: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

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
  const { domicilio, loading, notFound } = useDomicilioDetalle(id);

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

      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {domicilio.cliente.nombre}
        </h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${ESTADO_BADGE[domicilio.estado]}`}>
          {domicilio.estado.replace("_", " ")}
        </span>
      </div>

      {domicilio.foto_productos_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={domicilio.foto_productos_url}
          alt="Foto del pedido"
          className="mt-4 h-48 w-48 rounded-xl object-cover"
        />
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2">
        <Dato icon={Phone} label="Teléfono del cliente">
          {domicilio.cliente.telefono}
        </Dato>
        <Dato icon={MapPin} label="Ubicación de entrega">
          {domicilio.ubicacion.alias_direccion} ({domicilio.ubicacion.latitud}, {domicilio.ubicacion.longitud})
        </Dato>
        <Dato icon={Package} label="Productos">
          {domicilio.productos}
        </Dato>
        <Dato icon={Wallet} label="Precio (valor del pedido)">
          ${domicilio.precio.toLocaleString("es-CO")}
        </Dato>
        <Dato icon={Box} label="Espacio del baúl">
          Espacio {domicilio.espacio_baul}
        </Dato>
        <Dato icon={User} label="Domiciliario">
          {domicilio.domiciliario.nombre}
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
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { MapPin, MapPinned, Save } from "lucide-react";
import MySwal from "../../../lib/swal";
import MapaUbicacion from "../../../components/MapaUbicacion";

// Se abre desde el detalle de un cliente (botón "Agregar" en Ubicaciones). El
// punto se marca tocando el mapa — nadie tiene que saber qué es una latitud o
// una longitud (a diferencia del flujo de escaneo de comanda, acá tampoco hay
// captura de GPS automática, por eso hace falta elegirlo a mano en el mapa).
//
// Modo edición (ubicacion != null): NO se puede volver a tocar el mapa — solo
// se corrige alias/municipio. Esto tapa el hueco real de que una ubicación ya
// guardada (creada antes de que existiera "municipio", o sin elegir uno)
// se quedaba sin poder corregirse — antes solo existía crear o borrar.
function UbicacionFormContent({ telefonoCliente, ubicacion, onSaved }) {
  const isEdit = Boolean(ubicacion);
  const [serverError, setServerError] = useState(null);
  const [punto, setPunto] = useState(null);
  const [puntoError, setPuntoError] = useState(null);
  const [municipios, setMunicipios] = useState([]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      alias_direccion: ubicacion?.alias_direccion ?? "",
      id_municipio: ubicacion?.municipio?.id_municipio ?? "",
    },
  });

  // Municipio opcional: una dirección local (Carepa) simplemente no elige
  // ninguno y queda sin recargo (ver municipios.service.js).
  useEffect(() => {
    fetch("/api/municipios")
      .then((res) => res.json())
      .then(setMunicipios);
  }, []);

  async function onSubmit(values) {
    if (isEdit) {
      setServerError(null);
      const res = await fetch(`/api/ubicaciones/${ubicacion.id_ubicacion}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias_direccion: values.alias_direccion,
          id_municipio: values.id_municipio || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "No se pudo actualizar la ubicación");
        return;
      }
      onSaved(data);
      return;
    }

    if (!punto) {
      setPuntoError("Toca el mapa para marcar la ubicación");
      return;
    }
    setServerError(null);
    const res = await fetch(`/api/clientes/${telefonoCliente}/ubicaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alias_direccion: values.alias_direccion,
        latitud: punto.latitud,
        longitud: punto.longitud,
        id_municipio: values.id_municipio || null,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setServerError(data.error ?? "No se pudo guardar la ubicación");
      return;
    }

    onSaved(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <MapPin size={14} />
          Alias / dirección
        </label>
        <input
          placeholder="Casa, Trabajo, Cra 10 # 5-20..."
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("alias_direccion", { required: "Obligatorio" })}
        />
        {errors.alias_direccion && (
          <p className="mt-1 text-xs text-red-500">{errors.alias_direccion.message}</p>
        )}
      </div>

      {isEdit ? (
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <MapPin size={14} />
            Ubicación en el mapa (no editable acá — borra y crea una nueva si quedó mal marcada)
          </label>
          <MapaUbicacion latitud={ubicacion.latitud} longitud={ubicacion.longitud} height={140} />
        </div>
      ) : (
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <MapPin size={14} />
            Toca el mapa para marcar la ubicación
          </label>
          <MapaUbicacion
            onChange={(nuevoPunto) => {
              setPunto(nuevoPunto);
              setPuntoError(null);
            }}
          />
          {puntoError && <p className="mt-1 text-xs text-red-500">{puntoError}</p>}
        </div>
      )}

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <MapPinned size={14} />
          Municipio (opcional — solo si tiene recargo de domicilio)
        </label>
        <select
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("id_municipio")}
        >
          <option value="">Sin municipio (sin recargo)</option>
          {municipios.map((m) => (
            <option key={m.id_municipio} value={m.id_municipio}>
              {m.nombre} (+${m.recargo_domicilio.toLocaleString("es-CO")})
            </option>
          ))}
        </select>
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => MySwal.close()}
          className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Save size={15} />
          Guardar
        </button>
      </div>
    </form>
  );
}

export function openUbicacionFormModal(telefonoCliente, ubicacion = null) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: ubicacion ? "Editar ubicación" : "Nueva ubicación",
      html: (
        <UbicacionFormContent
          telefonoCliente={telefonoCliente}
          ubicacion={ubicacion}
          onSaved={(data) => {
            resolved = true;
            resolve(data);
            MySwal.close();
          }}
        />
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: 420,
      didClose: () => {
        if (!resolved) resolve(null);
      },
    });
  });
}

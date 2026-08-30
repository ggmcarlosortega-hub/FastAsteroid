"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { MapPin, Navigation, Save } from "lucide-react";
import MySwal from "../../../lib/swal";

// Se abre desde el detalle de un cliente (botón "Agregar" en Ubicaciones). Pide
// coordenadas a mano — a diferencia del flujo de escaneo de comanda, acá no
// hay captura de GPS automática, se escriben directamente.
function UbicacionFormContent({ telefonoCliente, onSaved }) {
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { alias_direccion: "", latitud: "", longitud: "" } });

  async function onSubmit(values) {
    setServerError(null);
    const res = await fetch(`/api/clientes/${telefonoCliente}/ubicaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alias_direccion: values.alias_direccion,
        latitud: Number(values.latitud),
        longitud: Number(values.longitud),
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

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Navigation size={14} />
            Latitud
          </label>
          <input
            type="number"
            step="any"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
            {...register("latitud", { required: "Obligatorio" })}
          />
          {errors.latitud && (
            <p className="mt-1 text-xs text-red-500">{errors.latitud.message}</p>
          )}
        </div>
        <div className="flex-1">
          <label className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Longitud
          </label>
          <input
            type="number"
            step="any"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
            {...register("longitud", { required: "Obligatorio" })}
          />
          {errors.longitud && (
            <p className="mt-1 text-xs text-red-500">{errors.longitud.message}</p>
          )}
        </div>
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

export function openUbicacionFormModal(telefonoCliente) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Nueva ubicación",
      html: (
        <UbicacionFormContent
          telefonoCliente={telefonoCliente}
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

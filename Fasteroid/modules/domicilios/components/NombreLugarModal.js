"use client";

import { useForm } from "react-hook-form";
import { MapPin, Save } from "lucide-react";
import MySwal from "../../../lib/swal";

// Se abre solo cuando, al entregar, el GPS real no coincide con ninguna
// dirección guardada del cliente — pide un nombre para esa ubicación nueva
// antes de reemplazar/crear el registro (ver handleEntregar).
function NombreLugarFormContent({ onSaved }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { nombre_lugar: "" } });

  function onSubmit(values) {
    onSaved(values.nombre_lugar);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        La ubicación donde estás no coincide con ninguna dirección guardada de este cliente. Dale un
        nombre para guardarla.
      </p>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <MapPin size={14} />
          Nombre del lugar
        </label>
        <input
          type="text"
          autoFocus
          placeholder="Casa, oficina, portería..."
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("nombre_lugar", { required: "Obligatorio" })}
        />
        {errors.nombre_lugar && <p className="mt-1 text-xs text-red-500">{errors.nombre_lugar.message}</p>}
      </div>

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
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          <Save size={15} />
          Guardar y entregar
        </button>
      </div>
    </form>
  );
}

export function openNombreLugarModal() {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Nueva ubicación",
      html: (
        <NombreLugarFormContent
          onSaved={(nombreLugar) => {
            resolved = true;
            resolve(nombreLugar);
            MySwal.close();
          }}
        />
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: 380,
      didClose: () => {
        if (!resolved) resolve(null);
      },
    });
  });
}

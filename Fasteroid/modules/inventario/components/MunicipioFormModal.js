"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { MapPinned, DollarSign, Save } from "lucide-react";
import MySwal from "../../../lib/swal";

// Crear/editar un municipio con su recargo de domicilio — mismo patrón que
// CategoriaFormModal.js. No hace falta un municipio para el propio negocio
// (Carepa): una ubicación sin municipio elegido es "sin recargo" (ver
// UbicacionFormModal.js y NuevoDomicilioModal.js).
function MunicipioFormContent({ municipio, onSaved }) {
  const isEdit = Boolean(municipio);
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nombre: municipio?.nombre ?? "",
      recargo_domicilio: municipio?.recargo_domicilio ?? "",
    },
  });

  async function onSubmit(values) {
    setServerError(null);
    const url = isEdit ? `/api/municipios/${municipio.id_municipio}` : "/api/municipios";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, recargo_domicilio: Number(values.recargo_domicilio) }),
    });
    const data = await res.json();

    if (!res.ok) {
      setServerError(data.error ?? "No se pudo guardar el municipio");
      return;
    }

    onSaved(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <MapPinned size={14} />
          Nombre del municipio
        </label>
        <input
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("nombre", { required: "El nombre es obligatorio" })}
        />
        {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <DollarSign size={14} />
          Recargo de domicilio
        </label>
        <input
          type="number"
          min="0"
          step="any"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("recargo_domicilio", {
            required: "Obligatorio",
            min: { value: 0, message: "No puede ser negativo" },
          })}
        />
        {errors.recargo_domicilio && (
          <p className="mt-1 text-xs text-red-500">{errors.recargo_domicilio.message}</p>
        )}
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

export function openMunicipioFormModal(municipio = null) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: municipio ? "Editar municipio" : "Nuevo municipio",
      html: (
        <MunicipioFormContent
          municipio={municipio}
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

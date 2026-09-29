"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Car, Hash, Save } from "lucide-react";
import MySwal from "../../../lib/swal";

// Crear/editar un vehículo — mismo patrón lista + modal que CategoriaFormModal.js.
// No hay borrado real (ver vehiculos.service.js: la FK de registro_mantenimiento
// es ON DELETE RESTRICT), solo el checkbox "Activo" para darlo de baja sin
// perder su historial de mantenimiento.
function VehiculoFormContent({ vehiculo, onSaved }) {
  const isEdit = Boolean(vehiculo);
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nombre: vehiculo?.nombre ?? "",
      placa: vehiculo?.placa ?? "",
      activo: vehiculo?.activo ?? true,
    },
  });

  async function onSubmit(values) {
    setServerError(null);
    const url = isEdit ? `/api/vehiculos/${vehiculo.id_vehiculo}` : "/api/vehiculos";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: values.nombre,
        placa: values.placa?.trim() || null,
        ...(isEdit ? { activo: values.activo } : {}),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setServerError(data.error ?? "No se pudo guardar el vehículo");
      return;
    }

    onSaved(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Car size={14} />
          Nombre
        </label>
        <input
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          placeholder="Moto 1"
          {...register("nombre", { required: "El nombre es obligatorio" })}
        />
        {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Hash size={14} />
          Placa (opcional)
        </label>
        <input
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("placa")}
        />
      </div>

      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" {...register("activo")} className="h-4 w-4 rounded" />
          Activo (disponible para registrar mantenimiento)
        </label>
      )}

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

export function openVehiculoFormModal(vehiculo = null) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: vehiculo ? "Editar vehículo" : "Nuevo vehículo",
      html: (
        <VehiculoFormContent
          vehiculo={vehiculo}
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

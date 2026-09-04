"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Wrench, Gauge, Fuel, Banknote, FileText, Save } from "lucide-react";
import MySwal from "../../../lib/swal";

// Registrar un evento de mantenimiento — CU-18 de aplicativos.md. Solo pide
// galones (Tanqueo) o descripción (Taller/Compra_Adicional) según el tipo elegido,
// igual que EntregarModal.js condiciona sus campos según el método de pago.
function RegistroMantenimientoFormContent({ onSaved }) {
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      tipo: "Tanqueo",
      kilometraje_actual: "",
      galones_ingresados: "",
      costo_total: "",
      descripcion_compras_y_taller: "",
    },
  });
  const esTanqueo = watch("tipo") === "Tanqueo";

  async function onSubmit(values) {
    setServerError(null);
    const res = await fetch("/api/mantenimiento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: values.tipo,
        kilometraje_actual: Number(values.kilometraje_actual),
        costo_total: Number(values.costo_total),
        galones_ingresados: esTanqueo ? Number(values.galones_ingresados) : null,
        descripcion_compras_y_taller: esTanqueo ? null : values.descripcion_compras_y_taller,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setServerError(data.error ?? "No se pudo registrar el evento");
      return;
    }

    onSaved(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Wrench size={14} />
          Tipo de evento
        </label>
        <select
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("tipo", { required: true })}
        >
          <option value="Tanqueo">Tanqueo</option>
          <option value="Taller">Taller</option>
          <option value="Compra_Adicional">Compra adicional</option>
        </select>
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Gauge size={14} />
          Kilometraje actual
        </label>
        <input
          type="number"
          min="0"
          step="1"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("kilometraje_actual", {
            required: "Obligatorio",
            min: { value: 0, message: "No puede ser negativo" },
          })}
        />
        {errors.kilometraje_actual && (
          <p className="mt-1 text-xs text-red-500">{errors.kilometraje_actual.message}</p>
        )}
      </div>

      {esTanqueo ? (
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Fuel size={14} />
            Galones cargados
          </label>
          <input
            type="number"
            min="0.1"
            step="any"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
            {...register("galones_ingresados", {
              required: esTanqueo ? "Obligatorio" : false,
              min: { value: 0.1, message: "Debe ser mayor a 0" },
            })}
          />
          {errors.galones_ingresados && (
            <p className="mt-1 text-xs text-red-500">{errors.galones_ingresados.message}</p>
          )}
        </div>
      ) : (
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <FileText size={14} />
            Descripción
          </label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
            {...register("descripcion_compras_y_taller", {
              required: !esTanqueo ? "Obligatorio" : false,
            })}
          />
          {errors.descripcion_compras_y_taller && (
            <p className="mt-1 text-xs text-red-500">{errors.descripcion_compras_y_taller.message}</p>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Banknote size={14} />
          Costo total
        </label>
        <input
          type="number"
          min="1"
          step="any"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("costo_total", {
            required: "Obligatorio",
            min: { value: 1, message: "Debe ser mayor a 0" },
          })}
        />
        {errors.costo_total && <p className="mt-1 text-xs text-red-500">{errors.costo_total.message}</p>}
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
          Registrar
        </button>
      </div>
    </form>
  );
}

export function openRegistroMantenimientoFormModal() {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Nuevo registro de mantenimiento",
      html: (
        <RegistroMantenimientoFormContent
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

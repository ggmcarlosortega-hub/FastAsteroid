"use client";

import { useForm } from "react-hook-form";
import { Wallet, Banknote, Save } from "lucide-react";
import MySwal from "../../../lib/swal";

// Modal que se abre al presionar "Entregado" en un domicilio en curso — pide el
// método de pago y el valor cobrado. La captura de la ubicación GPS real de la
// entrega (para calcular la distancia recorrida en el backend) pasa ANTES de
// abrir este modal (ver handleEntregar en useDomiciliosActivos.js), no acá.
function EntregarFormContent({ precioSugerido, onSaved }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      metodo_pago: "Efectivo",
      valor_recaudado: precioSugerido ?? "",
      valor_efectivo: "",
      valor_transferencia: "",
    },
  });
  // "Ambos" cambia el campo único "Valor cobrado" por dos campos — uno por
  // cada método — en vez de mandar un valor_recaudado aparte que podría no
  // cuadrar con la suma (el backend arma el total sumando los dos).
  const esAmbos = watch("metodo_pago") === "Ambos";

  function onSubmit(values) {
    if (esAmbos) {
      onSaved({
        metodo_pago: values.metodo_pago,
        valor_efectivo: Number(values.valor_efectivo),
        valor_transferencia: Number(values.valor_transferencia),
      });
      return;
    }
    onSaved({ metodo_pago: values.metodo_pago, valor_recaudado: Number(values.valor_recaudado) });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Wallet size={14} />
          Método de pago
        </label>
        <select
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("metodo_pago", { required: true })}
        >
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Ambos">Ambos (efectivo y transferencia)</option>
        </select>
      </div>

      {esAmbos ? (
        <>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <Banknote size={14} />
              Cuánto en efectivo
            </label>
            <input
              type="number"
              min="1"
              step="any"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
              {...register("valor_efectivo", {
                required: "Obligatorio",
                min: { value: 1, message: "Debe ser mayor a 0" },
              })}
            />
            {errors.valor_efectivo && (
              <p className="mt-1 text-xs text-red-500">{errors.valor_efectivo.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <Banknote size={14} />
              Cuánto por transferencia
            </label>
            <input
              type="number"
              min="1"
              step="any"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
              {...register("valor_transferencia", {
                required: "Obligatorio",
                min: { value: 1, message: "Debe ser mayor a 0" },
              })}
            />
            {errors.valor_transferencia && (
              <p className="mt-1 text-xs text-red-500">{errors.valor_transferencia.message}</p>
            )}
          </div>
        </>
      ) : (
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Banknote size={14} />
            Valor cobrado
          </label>
          <input
            type="number"
            min="1"
            step="any"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
            {...register("valor_recaudado", {
              required: "Obligatorio",
              min: { value: 1, message: "Debe ser mayor a 0" },
            })}
          />
          {errors.valor_recaudado && (
            <p className="mt-1 text-xs text-red-500">{errors.valor_recaudado.message}</p>
          )}
        </div>
      )}

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
          Confirmar entrega
        </button>
      </div>
    </form>
  );
}

export function openEntregarModal(precioSugerido) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Marcar como entregado",
      html: (
        <EntregarFormContent
          precioSugerido={precioSugerido}
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

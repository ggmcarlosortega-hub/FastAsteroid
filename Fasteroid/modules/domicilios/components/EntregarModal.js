"use client";

import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Wallet, Banknote, Save } from "lucide-react";

const MySwal = withReactContent(Swal);

function EntregarFormContent({ distanciaKm, precioSugerido, onSaved }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { metodo_pago: "Efectivo", valor_recaudado: precioSugerido ?? "" },
  });

  function onSubmit(values) {
    onSaved({ ...values, valor_recaudado: Number(values.valor_recaudado) });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      {distanciaKm != null && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Distancia recorrida estimada: <strong>{distanciaKm.toFixed(2)} km</strong>
        </p>
      )}

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
        </select>
      </div>

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
          {...register("valor_recaudado", { required: "Obligatorio", min: { value: 1, message: "Debe ser mayor a 0" } })}
        />
        {errors.valor_recaudado && (
          <p className="mt-1 text-xs text-red-500">{errors.valor_recaudado.message}</p>
        )}
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
          Confirmar entrega
        </button>
      </div>
    </form>
  );
}

export function openEntregarModal(distanciaKm, precioSugerido) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Marcar como entregado",
      html: (
        <EntregarFormContent
          distanciaKm={distanciaKm}
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

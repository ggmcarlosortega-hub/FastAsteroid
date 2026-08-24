"use client";

import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Package, Banknote, Save } from "lucide-react";

const MySwal = withReactContent(Swal);

function EditarFormContent({ domicilio, onSaved }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { productos: domicilio.productos, precio: domicilio.precio },
  });

  function onSubmit(values) {
    onSaved({ productos: values.productos, precio: Number(values.precio) });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Package size={14} />
          Productos
        </label>
        <textarea
          rows={2}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("productos", { required: "Obligatorio" })}
        />
        {errors.productos && <p className="mt-1 text-xs text-red-500">{errors.productos.message}</p>}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Banknote size={14} />
          Precio (valor del pedido)
        </label>
        <input
          type="number"
          min="1"
          step="any"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("precio", { required: "Obligatorio", min: { value: 1, message: "Debe ser mayor a 0" } })}
        />
        {errors.precio && <p className="mt-1 text-xs text-red-500">{errors.precio.message}</p>}
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
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Save size={15} />
          Guardar cambios
        </button>
      </div>
    </form>
  );
}

export function openEditarDomicilioModal(domicilio) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Corregir domicilio",
      html: (
        <EditarFormContent
          domicilio={domicilio}
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

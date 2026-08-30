"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Package, Banknote, Tag, Save } from "lucide-react";
import MySwal from "../../../lib/swal";

// Crear/editar un producto del catálogo. El checkbox "Activo" solo aparece al
// editar (uno recién creado siempre empieza activo) — desmarcarlo lo saca de
// la lista para elegir productos al crear un domicilio, sin borrarlo.
function ProductoFormContent({ producto, categorias, onSaved }) {
  const isEdit = Boolean(producto);
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nombre: producto?.nombre ?? "",
      precio_venta: producto?.precio_venta ?? "",
      activo: producto?.activo ?? true,
      id_categoria: producto?.categoria?.id_categoria ?? "",
    },
  });

  async function onSubmit(values) {
    setServerError(null);
    const url = isEdit ? `/api/productos/${producto.id_producto}` : "/api/productos";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: values.nombre,
        precio_venta: Number(values.precio_venta),
        activo: values.activo,
        id_categoria: values.id_categoria || null,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setServerError(data.error ?? "No se pudo guardar el producto");
      return;
    }

    onSaved(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Package size={14} />
          Nombre
        </label>
        <input
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("nombre", { required: "El nombre es obligatorio" })}
        />
        {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Banknote size={14} />
          Precio de venta
        </label>
        <input
          type="number"
          min="1"
          step="any"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("precio_venta", {
            required: "Obligatorio",
            min: { value: 1, message: "Debe ser mayor a 0" },
          })}
        />
        {errors.precio_venta && (
          <p className="mt-1 text-xs text-red-500">{errors.precio_venta.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Tag size={14} />
          Categoría (opcional)
        </label>
        <select
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("id_categoria")}
        >
          <option value="">Sin categoría</option>
          {categorias?.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" {...register("activo")} className="h-4 w-4 rounded" />
          Activo (visible al crear domicilios)
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

export function openProductoFormModal(producto = null, categorias = []) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: producto ? "Editar producto" : "Nuevo producto",
      html: (
        <ProductoFormContent
          producto={producto}
          categorias={categorias}
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

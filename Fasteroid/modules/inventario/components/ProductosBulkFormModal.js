"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Package, Plus, Trash2, Save } from "lucide-react";
import MySwal from "../../../lib/swal";

// Alta masiva de productos — filas repetibles (nombre, precio, categoría
// opcional), un solo envío a POST /api/productos/bulk. Igual patrón visual que
// el resto de formularios del módulo, pero con useFieldArray de react-hook-form
// para las filas en vez de un único registro.
function ProductosBulkFormContent({ categorias, onSaved }) {
  const [serverError, setServerError] = useState(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { lineas: [{ nombre: "", precio_venta: "", id_categoria: "" }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "lineas" });

  async function onSubmit(values) {
    setServerError(null);
    const res = await fetch("/api/productos/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineas: values.lineas.map((l) => ({
          nombre: l.nombre,
          precio_venta: Number(l.precio_venta),
          id_categoria: l.id_categoria || null,
        })),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setServerError(data.error ?? "No se pudo guardar el catálogo");
      return;
    }

    onSaved(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto pr-1">
        {fields.map((field, i) => (
          <div
            key={field.id}
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
          >
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <Package size={12} />
                Producto {i + 1}
              </p>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  title="Quitar fila"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <input
              placeholder="Nombre"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
              {...register(`lineas.${i}.nombre`, { required: "Obligatorio" })}
            />
            {errors.lineas?.[i]?.nombre && (
              <p className="text-xs text-red-500">{errors.lineas[i].nombre.message}</p>
            )}
            <input
              type="number"
              min="1"
              step="any"
              placeholder="Precio de venta"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
              {...register(`lineas.${i}.precio_venta`, {
                required: "Obligatorio",
                min: { value: 1, message: "Debe ser mayor a 0" },
              })}
            />
            {errors.lineas?.[i]?.precio_venta && (
              <p className="text-xs text-red-500">{errors.lineas[i].precio_venta.message}</p>
            )}
            <select
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
              {...register(`lineas.${i}.id_categoria`)}
            >
              <option value="">Sin categoría</option>
              {categorias?.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => append({ nombre: "", precio_venta: "", id_categoria: "" })}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 py-2 text-sm text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <Plus size={14} />
        Agregar otro producto
      </button>

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
          Guardar todos
        </button>
      </div>
    </form>
  );
}

export function openProductosBulkFormModal(categorias = []) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Agregar varios productos",
      html: (
        <ProductosBulkFormContent
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
      width: 460,
      didClose: () => {
        if (!resolved) resolve(null);
      },
    });
  });
}

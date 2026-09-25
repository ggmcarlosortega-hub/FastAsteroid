"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Package, Truck, Hash, Boxes, CalendarClock, Save, DollarSign } from "lucide-react";
import MySwal from "../../../lib/swal";

// Registrar una compra/lote: producto + proveedor + cantidad son obligatorios;
// número de lote y fecha de caducidad son opcionales (no todos los productos
// traen esos datos). `productos`/`proveedores` llegan ya cargados desde
// useInventarioAdmin.js — este modal no hace su propio fetch.
function LoteFormContent({ productos, proveedores, onSaved }) {
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      id_producto: "",
      id_proveedor: "",
      numero_lote: "",
      cantidad_comprada: "",
      precio_lote: "",
      fecha_caducidad: "",
    },
  });

  // El costo por unidad no se pide directo — se pide lo que de verdad trae la
  // factura (el total pagado por el lote) y se divide acá, en vivo, para que
  // el usuario vea el resultado antes de guardar.
  const cantidadObservada = Number(watch("cantidad_comprada"));
  const precioLoteObservado = Number(watch("precio_lote"));
  const costoUnitarioCalculado =
    Number.isFinite(cantidadObservada) && cantidadObservada > 0 &&
    Number.isFinite(precioLoteObservado) && precioLoteObservado > 0
      ? precioLoteObservado / cantidadObservada
      : null;

  async function onSubmit(values) {
    setServerError(null);
    const cantidad_comprada = Number(values.cantidad_comprada);
    const costo_unitario = Number(values.precio_lote) / cantidad_comprada;
    const res = await fetch("/api/lotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_producto: values.id_producto,
        id_proveedor: values.id_proveedor,
        numero_lote: values.numero_lote,
        cantidad_comprada,
        costo_unitario,
        fecha_caducidad: values.fecha_caducidad || null,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setServerError(data.error ?? "No se pudo registrar la compra");
      return;
    }

    onSaved(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Package size={14} />
          Producto
        </label>
        <select
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("id_producto", { required: "Obligatorio" })}
        >
          <option value="">Selecciona un producto</option>
          {productos.map((p) => (
            <option key={p.id_producto} value={p.id_producto}>
              {p.nombre}
            </option>
          ))}
        </select>
        {errors.id_producto && (
          <p className="mt-1 text-xs text-red-500">{errors.id_producto.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Truck size={14} />
          Proveedor
        </label>
        <select
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("id_proveedor", { required: "Obligatorio" })}
        >
          <option value="">Selecciona un proveedor</option>
          {proveedores.map((p) => (
            <option key={p.id_proveedor} value={p.id_proveedor}>
              {p.nombre}
            </option>
          ))}
        </select>
        {errors.id_proveedor && (
          <p className="mt-1 text-xs text-red-500">{errors.id_proveedor.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Hash size={14} />
          Número de lote (opcional)
        </label>
        <input
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("numero_lote")}
        />
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Boxes size={14} />
          Cantidad comprada
        </label>
        <input
          type="number"
          min="1"
          step="1"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("cantidad_comprada", {
            required: "Obligatorio",
            min: { value: 1, message: "Debe ser mayor a 0" },
          })}
        />
        {errors.cantidad_comprada && (
          <p className="mt-1 text-xs text-red-500">{errors.cantidad_comprada.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <DollarSign size={14} />
          Precio del lote (lo que pagaste en total por esta compra)
        </label>
        <input
          type="number"
          min="1"
          step="any"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("precio_lote", {
            required: "Obligatorio",
            min: { value: 0.01, message: "Debe ser mayor a 0" },
          })}
        />
        {errors.precio_lote && <p className="mt-1 text-xs text-red-500">{errors.precio_lote.message}</p>}
        {costoUnitarioCalculado != null && (
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Costo por unidad: <span className="font-medium text-zinc-700 dark:text-zinc-300">
              ${costoUnitarioCalculado.toLocaleString("es-CO", { maximumFractionDigits: 2 })}
            </span>
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <CalendarClock size={14} />
          Fecha de caducidad (opcional)
        </label>
        <input
          type="date"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("fecha_caducidad")}
        />
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
          Registrar compra
        </button>
      </div>
    </form>
  );
}

export function openLoteFormModal(productos, proveedores) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Registrar compra",
      html: (
        <LoteFormContent
          productos={productos}
          proveedores={proveedores}
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

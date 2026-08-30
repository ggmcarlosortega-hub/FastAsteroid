"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Package } from "lucide-react";

// Mismo patrón que EspacioBaulSelector.js: componente presentacional controlado,
// sin react-hook-form (el formulario padre lo maneja con useState + validación
// manual, igual que ya hace con la foto en NuevoDomicilioModal.js).
//
// value: [{ id_producto, cantidad, nombre, precio_venta }]
export default function SeleccionProductosPicker({ value, onChange, error }) {
  const [productos, setProductos] = useState(null);

  useEffect(() => {
    fetch("/api/productos?activos=1")
      .then((res) => res.json())
      .then(setProductos);
  }, []);

  function cantidadDe(id_producto) {
    return value.find((l) => l.id_producto === id_producto)?.cantidad ?? 0;
  }

  function cambiarCantidad(producto, delta) {
    const actual = cantidadDe(producto.id_producto);
    const nueva = Math.max(0, actual + delta);

    if (nueva === 0) {
      onChange(value.filter((l) => l.id_producto !== producto.id_producto));
      return;
    }
    if (actual === 0) {
      onChange([
        ...value,
        { id_producto: producto.id_producto, cantidad: nueva, nombre: producto.nombre, precio_venta: producto.precio_venta },
      ]);
      return;
    }
    onChange(
      value.map((l) => (l.id_producto === producto.id_producto ? { ...l, cantidad: nueva } : l))
    );
  }

  // Agrupar por categoría para que el picker sea más fácil de recorrer con un
  // catálogo grande — "Sin categoría" (id_categoria null) siempre va al final.
  const grupos = [];
  if (productos) {
    const porId = new Map();
    for (const producto of productos) {
      const clave = producto.categoria?.id_categoria ?? null;
      if (!porId.has(clave)) {
        porId.set(clave, { nombre: producto.categoria?.nombre ?? "Sin categoría", productos: [] });
      }
      porId.get(clave).productos.push(producto);
    }
    const sinCategoria = porId.get(null);
    porId.delete(null);
    grupos.push(...porId.values());
    if (sinCategoria) grupos.push(sinCategoria);
  }

  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <Package size={14} />
        Productos
      </label>

      {productos === null && <p className="text-sm text-zinc-400">Cargando catálogo...</p>}
      {productos?.length === 0 && (
        <p className="text-sm text-zinc-400">
          No hay productos activos en el catálogo — pídele al Admin que agregue alguno en Inventario.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {grupos.map((grupo) => (
          <div
            key={grupo.nombre}
            className="rounded-xl border border-zinc-300 dark:border-zinc-700"
          >
            <p className="border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
              {grupo.nombre}
            </p>
            <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
              {grupo.productos.map((producto) => {
                const cantidad = cantidadDe(producto.id_producto);
                return (
                  <div key={producto.id_producto} className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{producto.nombre}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        ${producto.precio_venta.toLocaleString("es-CO")}
                      </p>
                    </div>
                    {/* Stepper -/cantidad/+ por producto — tocar "+" en un producto en
                        0 lo agrega a `value`; llegar a 0 con "-" lo quita. */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={cantidad === 0}
                        onClick={() => cambiarCantidad(producto, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 disabled:opacity-30 active:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:active:bg-zinc-700"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(producto, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-300 text-orange-600 active:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:active:bg-orange-900/20"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

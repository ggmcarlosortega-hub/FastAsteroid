"use client";

import { Package, Truck, ShoppingCart, Boxes, Tag, Plus, Pencil, Trash2, Layers, Camera, Wallet, MapPinned } from "lucide-react";
import { useInventarioAdmin } from "../logic/useInventarioAdmin";

const TABS = [
  { id: "productos", label: "Productos", icon: Package },
  { id: "categorias", label: "Categorías", icon: Tag },
  { id: "proveedores", label: "Proveedores", icon: Truck },
  { id: "municipios", label: "Municipios", icon: MapPinned },
  { id: "compras", label: "Compras", icon: ShoppingCart },
  { id: "inventario", label: "Inventario", icon: Boxes },
];

export default function InventarioPage() {
  const {
    tab,
    setTab,
    productos,
    proveedores,
    categorias,
    municipios,
    lotes,
    inventario,
    gastoSemanal,
    loading,
    handleNuevoProducto,
    handleEditarProducto,
    handleNuevosProductosMasivo,
    handleNuevoProveedor,
    handleEditarProveedor,
    handleEliminarProveedor,
    handleNuevaCategoria,
    handleEditarCategoria,
    handleEliminarCategoria,
    handleNuevoMunicipio,
    handleEditarMunicipio,
    handleEliminarMunicipio,
    handleNuevoLote,
    handleEscanearCompra,
  } = useInventarioAdmin();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Inventario</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Catálogo de productos, proveedores, compras e inventario calculado.
      </p>

      {/* Selector de pestaña — cambia `tab` en el hook, y cada bloque de abajo
          se muestra solo cuando tab === su propio id (ver TABS arriba). */}
      <div className="mt-6 flex gap-1 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="mt-6 text-center text-sm text-zinc-400">Cargando...</p>}

      {/* Pestaña "Productos": catálogo — es de acá de donde sale la lista que
          usa SeleccionProductosPicker.js al crear un domicilio. Un producto
          "Inactivo" (activo=false) no se elimina, solo se oculta de esa lista
          para no romper domicilios/compras ya registrados con él. */}
      {!loading && tab === "productos" && (
        <div className="mt-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={handleNuevosProductosMasivo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Layers size={16} />
              Agregar varios
            </button>
            <button
              onClick={handleNuevoProducto}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus size={16} />
              Nuevo producto
            </button>
          </div>
          <div className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {productos.length === 0 && (
              <p className="p-6 text-center text-sm text-zinc-400">No hay productos registrados todavía.</p>
            )}
            {productos.map((p) => (
              <div key={p.id_producto} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-50">
                    {p.nombre}
                    {!p.activo && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        Inactivo
                      </span>
                    )}
                    {p.categoria && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        {p.categoria.nombre}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    ${p.precio_venta.toLocaleString("es-CO")}
                    {" · "}
                    {p.margen != null ? (
                      <span className={p.margen >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                        Margen ${Math.round(p.margen).toLocaleString("es-CO")} ({((p.margen / p.precio_venta) * 100).toFixed(0)}%)
                      </span>
                    ) : (
                      <span className="text-zinc-400">Sin costo registrado</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleEditarProducto(p)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestaña "Categorías": catálogo aparte, mismo patrón lista + modal que
          Proveedores. Borrar una no borra los productos que la tenían — solo
          los deja sin categoría (ver categorias.service.js). */}
      {!loading && tab === "categorias" && (
        <div className="mt-4">
          <div className="flex justify-end">
            <button
              onClick={handleNuevaCategoria}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus size={16} />
              Nueva categoría
            </button>
          </div>
          <div className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {categorias.length === 0 && (
              <p className="p-6 text-center text-sm text-zinc-400">No hay categorías registradas todavía.</p>
            )}
            {categorias.map((c) => (
              <div key={c.id_categoria} className="flex items-center justify-between px-5 py-3">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{c.nombre}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditarCategoria(c)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleEliminarCategoria(c)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestaña "Proveedores": a diferencia de productos, sí se pueden borrar
          del todo (mientras no tengan compras registradas). */}
      {!loading && tab === "proveedores" && (
        <div className="mt-4">
          <div className="flex justify-end">
            <button
              onClick={handleNuevoProveedor}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus size={16} />
              Nuevo proveedor
            </button>
          </div>
          <div className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {proveedores.length === 0 && (
              <p className="p-6 text-center text-sm text-zinc-400">No hay proveedores registrados todavía.</p>
            )}
            {proveedores.map((p) => (
              <div key={p.id_proveedor} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{p.nombre}</p>
                  {p.telefono && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{p.telefono}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditarProveedor(p)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleEliminarProveedor(p)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestaña "Municipios": recargo de domicilio por municipio — se elige al
          crear/editar una ubicación (opcional, ver UbicacionFormModal.js y
          NuevoDomicilioModal.js) para sumarlo al precio sugerido del pedido. */}
      {!loading && tab === "municipios" && (
        <div className="mt-4">
          <div className="flex justify-end">
            <button
              onClick={handleNuevoMunicipio}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus size={16} />
              Nuevo municipio
            </button>
          </div>
          <div className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {municipios.length === 0 && (
              <p className="p-6 text-center text-sm text-zinc-400">
                No hay municipios registrados todavía — una ubicación sin municipio no tiene recargo.
              </p>
            )}
            {municipios.map((m) => (
              <div key={m.id_municipio} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{m.nombre}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Recargo: ${m.recargo_domicilio.toLocaleString("es-CO")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditarMunicipio(m)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleEliminarMunicipio(m)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestaña "Compras": historial de lotes recibidos de proveedores — cada
          uno suma a la columna "Comprado" de la pestaña Inventario. */}
      {!loading && tab === "compras" && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
              <Wallet size={14} className="text-orange-500" />
              Gasto en compras (últimos 7 días):{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                ${gastoSemanal.toLocaleString("es-CO")}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEscanearCompra}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Camera size={16} />
                Escanear factura
              </button>
              <button
                onClick={handleNuevoLote}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Plus size={16} />
                Registrar compra
              </button>
            </div>
          </div>
          <div className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {lotes.length === 0 && (
              <p className="p-6 text-center text-sm text-zinc-400">No hay compras registradas todavía.</p>
            )}
            {lotes.map((l) => (
              <div key={l.id_lote} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {l.producto.nombre}
                    <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      {l.cantidad_comprada} unidades
                      {l.costo_unitario != null && ` · $${l.costo_unitario.toLocaleString("es-CO")} c/u`}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {l.proveedor.nombre}
                    {l.numero_lote && ` · Lote ${l.numero_lote}`}
                    {l.fecha_caducidad &&
                      ` · Vence ${new Date(l.fecha_caducidad).toLocaleDateString("es-CO")}`}
                  </p>
                </div>
                <span className="text-xs text-zinc-400">
                  {new Date(l.fecha_compra).toLocaleDateString("es-CO")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestaña "Inventario": tabla de solo lectura, calculada en el backend
          como comprado - vendido por producto (ver inventario.service.js) —
          "vendido" solo cuenta domicilios que no están Cancelados. En rojo
          cuando el inventario llega a 0 o menos, para que salte a la vista. */}
      {!loading && tab === "inventario" && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="px-5 py-3 font-medium">Producto</th>
                <th className="px-5 py-3 font-medium">Comprado</th>
                <th className="px-5 py-3 font-medium">Vendido</th>
                <th className="px-5 py-3 font-medium">Inventario actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {inventario.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-sm text-zinc-400">
                    No hay productos registrados todavía.
                  </td>
                </tr>
              )}
              {inventario.map((i) => (
                <tr key={i.id_producto}>
                  <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-50">{i.nombre}</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">{i.comprado}</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">{i.vendido}</td>
                  <td
                    className={`px-5 py-3 font-semibold ${
                      i.inventario <= 0 ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-50"
                    }`}
                  >
                    {i.inventario}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

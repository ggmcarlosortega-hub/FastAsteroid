"use client";

import { Fragment, useState } from "react";
import { Package, Truck, ShoppingCart, Boxes, Tag, Plus, Pencil, Trash2, Layers, Camera, Wallet, MapPinned } from "lucide-react";
import { useInventarioAdmin } from "../logic/useInventarioAdmin";
import { agruparPorCategoria } from "../logic/agruparPorCategoria";
import ErrorReintentar from "../../../components/ErrorReintentar";

const TABS = [
  { id: "productos", label: "Productos", icon: Package },
  { id: "categorias", label: "Categorías", icon: Tag },
  { id: "proveedores", label: "Proveedores", icon: Truck },
  { id: "municipios", label: "Municipios", icon: MapPinned },
  { id: "compras", label: "Compras", icon: ShoppingCart },
  { id: "inventario", label: "Inventario", icon: Boxes },
];

const FILTROS_ACTIVO = [
  { id: "todos", label: "Todos" },
  { id: "activos", label: "Activos" },
  { id: "inactivos", label: "Inactivos" },
];

// Una fila de la tabla de Inventario — extraída porque ahora se repite tanto
// para los productos directos de un grupo como para los de cada subcategoría.
function FilaInventario({ item }) {
  return (
    <tr>
      <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-50">{item.nombre}</td>
      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">{item.comprado}</td>
      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">{item.vendido}</td>
      <td
        className={`px-5 py-3 font-semibold ${
          item.inventario <= 0 ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {item.inventario}
      </td>
    </tr>
  );
}

// Extraído para no duplicar el markup entre los productos "directos" de un
// grupo y los de cada subcategoría (ver pestaña "Productos" más abajo).
function ListaProductos({ productos, onEditar }) {
  return (
    <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
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
            onClick={() => onEditar(p)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Editar"
          >
            <Pencil size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

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
    error,
    reintentar,
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

  // Solo afecta qué se muestra en la pestaña Productos — no depende del
  // backend, `productos` ya trae todos con o sin filtro (ver comentario de
  // la pestaña Productos más abajo).
  const [filtroActivo, setFiltroActivo] = useState("todos");
  const productosFiltrados = productos.filter((p) => {
    if (filtroActivo === "activos") return p.activo;
    if (filtroActivo === "inactivos") return !p.activo;
    return true;
  });

  // Lista indentada para la pestaña Categorías: cada categoría raíz seguida
  // de sus subcategorías (si tiene), ambas en orden alfabético.
  const categoriasOrdenadas = [];
  for (const raiz of categorias.filter((c) => c.id_categoria_padre == null).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))) {
    categoriasOrdenadas.push({ ...raiz, esSubcategoria: false });
    for (const hija of categorias
      .filter((c) => c.id_categoria_padre === raiz.id_categoria)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))) {
      categoriasOrdenadas.push({ ...hija, esSubcategoria: true });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Inventario</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Catálogo de productos, proveedores, compras e inventario calculado.
      </p>

      {/* Selector de pestaña — cambia `tab` en el hook, y cada bloque de abajo
          se muestra solo cuando tab === su propio id (ver TABS arriba).
          `flex-1` solo/o a partir de `md`: con las 6 pestañas, en pantallas
          chicas ese ancho parejo no cabe (los botones no se encogen por
          debajo de su contenido) — ahí se deja overflow-x-auto y cada botón
          con su ancho natural, así la fila scrollea en vez de desbordar toda
          la página. */}
      <div className="mt-6 flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium md:flex-1 ${
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
      {!loading && error && <ErrorReintentar mensaje={error} onReintentar={reintentar} />}

      {/* Pestaña "Productos": catálogo — es de acá de donde sale la lista que
          usa SeleccionProductosPicker.js al crear un domicilio. Un producto
          "Inactivo" (activo=false) no se elimina, solo se oculta de esa lista
          para no romper domicilios/compras ya registrados con él. */}
      {!loading && tab === "productos" && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Filtro Todos/Activos/Inactivos — no cambia qué se pide al backend,
                solo qué parte de `productos` (que ya trae todos) se muestra. Un
                producto inactivo sigue existiendo para no romper historial, así
                que encontrarlo entre los activos para reactivarlo (checkbox
                "Activo" dentro de Editar) era incómodo sin esto. */}
            <div className="flex gap-1 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">
              {FILTROS_ACTIVO.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltroActivo(f.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    filtroActivo === f.id
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
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
          </div>

          {productosFiltrados.length === 0 && (
            <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
              {productos.length === 0
                ? "No hay productos registrados todavía."
                : "Ningún producto coincide con este filtro."}
            </div>
          )}

          {/* Agrupado por categoría (agruparPorCategoria.js) — mismo helper que
              usa la pestaña Inventario, para que ambas se vean consistentes.
              Cuando el grupo tiene subcategorías (ej. "Pizzas" con "Rigos",
              "Hawaiana"...), cada una se lista aparte dentro del mismo grupo. */}
          {agruparPorCategoria(productosFiltrados).map((grupo) => (
            <div key={grupo.id_categoria ?? "sin-categoria"} className="mt-4 first:mt-3">
              <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">{grupo.nombre}</h3>
              {grupo.items.length > 0 && (
                <ListaProductos productos={grupo.items} onEditar={handleEditarProducto} />
              )}
              {grupo.subcategorias.map((sub) => (
                <div key={sub.id_categoria} className="mt-3">
                  <h4 className="mb-1.5 pl-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">{sub.nombre}</h4>
                  <ListaProductos productos={sub.items} onEditar={handleEditarProducto} />
                </div>
              ))}
            </div>
          ))}
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
            {categoriasOrdenadas.map((c) => (
              <div
                key={c.id_categoria}
                className={`flex items-center justify-between px-5 py-3 ${c.esSubcategoria ? "pl-10" : ""}`}
              >
                <p
                  className={
                    c.esSubcategoria
                      ? "text-sm text-zinc-600 dark:text-zinc-400"
                      : "font-medium text-zinc-900 dark:text-zinc-50"
                  }
                >
                  {c.nombre}
                </p>
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
              {/* Mismo helper de agrupación que la pestaña Productos — una fila
                  de encabezado por categoría en vez de un <h3>, ya que acá
                  estamos dentro de una tabla. Con subcategorías (ej. "Pizzas"),
                  cada una gana su propia sub-fila de encabezado, más angosta. */}
              {agruparPorCategoria(inventario).map((grupo) => (
                <Fragment key={grupo.id_categoria ?? "sin-categoria"}>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                    <td colSpan={4} className="px-5 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {grupo.nombre}
                    </td>
                  </tr>
                  {grupo.items.map((i) => (
                    <FilaInventario key={i.id_producto} item={i} />
                  ))}
                  {grupo.subcategorias.map((sub) => (
                    <Fragment key={sub.id_categoria}>
                      <tr>
                        <td colSpan={4} className="px-5 py-1.5 pl-8 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                          {sub.nombre}
                        </td>
                      </tr>
                      {sub.items.map((i) => (
                        <FilaInventario key={i.id_producto} item={i} />
                      ))}
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

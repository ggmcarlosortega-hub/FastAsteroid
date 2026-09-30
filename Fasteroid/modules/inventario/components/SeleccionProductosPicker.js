"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Package, Search, ChevronRight, ChevronDown } from "lucide-react";

// Mismo patrón que EspacioBaulSelector.js: componente presentacional controlado,
// sin react-hook-form (el formulario padre lo maneja con useState + validación
// manual, igual que ya hace con la foto en NuevoDomicilioModal.js).
//
// value: [{ id_producto, cantidad, nombre, precio_venta }]
export default function SeleccionProductosPicker({ value, onChange, error }) {
  const [productos, setProductos] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  // Categorías que el usuario expandió/colapsó a mano — se combina con "ya tiene
  // productos elegidos" y "hay una búsqueda con match" para decidir qué se ve
  // abierto en cada render (ver estaExpandida más abajo).
  const [tocadas, setTocadas] = useState(new Map());

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
    const disponible = Math.max(0, producto.disponible ?? Infinity);
    const nueva = Math.min(disponible, Math.max(0, actual + delta));

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

  const query = busqueda.trim().toLowerCase();

  // Agrupar por categoría para que el picker sea más fácil de recorrer con un
  // catálogo grande — "Sin categoría" (id_categoria null) siempre va al final.
  // Dos niveles cuando la categoría del producto tiene padre (ej. "Pizzas
  // Rigos" bajo "Pizzas"): el producto cae en el acordeón de "Pizzas", pero
  // dentro de su propia subcategoría en vez de directo en `productos`.
  const gruposCompletos = [];
  if (productos) {
    const porId = new Map();
    for (const producto of productos) {
      const categoria = producto.categoria;
      const padre = categoria?.categoria_padre ?? null;
      const clave = padre ? padre.id_categoria : categoria?.id_categoria ?? null;
      if (!porId.has(clave)) {
        porId.set(clave, {
          clave,
          nombre: padre ? padre.nombre : categoria?.nombre ?? "Sin categoría",
          productos: [],
          subcategoriasMap: new Map(),
        });
      }
      const grupo = porId.get(clave);
      if (padre) {
        if (!grupo.subcategoriasMap.has(categoria.id_categoria)) {
          grupo.subcategoriasMap.set(categoria.id_categoria, {
            clave: categoria.id_categoria,
            nombre: categoria.nombre,
            productos: [],
          });
        }
        grupo.subcategoriasMap.get(categoria.id_categoria).productos.push(producto);
      } else {
        grupo.productos.push(producto);
      }
    }
    const sinCategoria = porId.get(null);
    porId.delete(null);
    for (const grupo of porId.values()) {
      gruposCompletos.push({ ...grupo, subcategorias: [...grupo.subcategoriasMap.values()] });
    }
    if (sinCategoria) gruposCompletos.push({ ...sinCategoria, subcategorias: [] });
  }

  // Con búsqueda activa: solo quedan categorías (o subcategorías) con al menos un
  // match (por nombre de producto o de la propia categoría), y dentro de ellas
  // solo los productos que matchean. Sin búsqueda, se muestra el catálogo
  // completo agrupado.
  function filtrarProductos(nombreCategoria, listaProductos) {
    const categoriaMatchea = nombreCategoria.toLowerCase().includes(query);
    return categoriaMatchea ? listaProductos : listaProductos.filter((p) => p.nombre.toLowerCase().includes(query));
  }

  const grupos = query
    ? gruposCompletos
        .map((grupo) => {
          const categoriaMatchea = grupo.nombre.toLowerCase().includes(query);
          const subcategorias = grupo.subcategorias
            .map((sub) => ({ ...sub, productos: categoriaMatchea ? sub.productos : filtrarProductos(sub.nombre, sub.productos) }))
            .filter((sub) => sub.productos.length > 0);
          return {
            ...grupo,
            productos: filtrarProductos(grupo.nombre, grupo.productos),
            subcategorias,
          };
        })
        .filter((grupo) => grupo.productos.length > 0 || grupo.subcategorias.length > 0)
    : gruposCompletos;

  function todosLosProductosDe(grupo) {
    return [...grupo.productos, ...grupo.subcategorias.flatMap((sub) => sub.productos)];
  }

  function estaExpandida(grupo) {
    if (tocadas.has(grupo.clave)) return tocadas.get(grupo.clave);
    if (query) return true;
    if (todosLosProductosDe(grupo).some((p) => cantidadDe(p.id_producto) > 0)) return true;
    return false;
  }

  function alternarCategoria(grupo) {
    setTocadas((prev) => new Map(prev).set(grupo.clave, !estaExpandida(grupo)));
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

      {productos && productos.length > 0 && (
        <div className="relative mb-3">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto o categoría..."
            className="w-full rounded-lg border border-zinc-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
      )}

      {query && grupos.length === 0 && (
        <p className="text-sm text-zinc-400">No se encontraron productos para &quot;{busqueda}&quot;.</p>
      )}

      <div className="flex flex-col gap-3">
        {grupos.map((grupo) => {
          const abierta = estaExpandida(grupo);
          const elegidosEnGrupo = todosLosProductosDe(grupo).filter((p) => cantidadDe(p.id_producto) > 0).length;
          return (
            <div
              key={grupo.nombre}
              className="overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700"
            >
              <button
                type="button"
                onClick={() => alternarCategoria(grupo)}
                className="flex w-full items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-left dark:border-zinc-800 dark:bg-zinc-800/50"
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {abierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {grupo.nombre}
                </span>
                {elegidosEnGrupo > 0 && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    {elegidosEnGrupo} elegido{elegidosEnGrupo > 1 ? "s" : ""}
                  </span>
                )}
              </button>
              {abierta && (
                <div className="flex flex-col">
                  {grupo.productos.length > 0 && (
                    <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                      {grupo.productos.map((producto) => (
                        <FilaProductoPicker
                          key={producto.id_producto}
                          producto={producto}
                          cantidad={cantidadDe(producto.id_producto)}
                          onCambiar={cambiarCantidad}
                        />
                      ))}
                    </div>
                  )}
                  {/* Subcategorías (ej. "Rigos", "Hawaiana" dentro de "Pizzas"): cada
                      una gana su propia subcabecera dentro del mismo acordeón, en vez
                      de un acordeón anidado — más simple de recorrer con el dedo. */}
                  {grupo.subcategorias.map((sub) => (
                    <div key={sub.clave}>
                      <p className="border-t border-zinc-200 bg-zinc-50/60 px-3 py-1.5 text-[11px] font-medium text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/30 dark:text-zinc-500">
                        {sub.nombre}
                      </p>
                      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                        {sub.productos.map((producto) => (
                          <FilaProductoPicker
                            key={producto.id_producto}
                            producto={producto}
                            cantidad={cantidadDe(producto.id_producto)}
                            onCambiar={cambiarCantidad}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Extraído porque ahora se repite tanto para los productos directos de un
// grupo como para los de cada subcategoría.
function FilaProductoPicker({ producto, cantidad, onCambiar }) {
  const disponible = Math.max(0, producto.disponible ?? 0);
  const agotado = disponible === 0;
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 ${agotado ? "opacity-50" : ""}`}>
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{producto.nombre}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          ${producto.precio_venta.toLocaleString("es-CO")}
          {" · "}
          {agotado ? <span className="font-medium text-red-500">Agotado</span> : `Quedan ${disponible}`}
        </p>
      </div>
      {/* Stepper -/cantidad/+ por producto — tocar "+" en un producto en 0 lo
          agrega a `value`; llegar a 0 con "-" lo quita. "+" no deja pasar de
          lo disponible (ver cambiarCantidad). */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={cantidad === 0}
          onClick={() => onCambiar(producto, -1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 disabled:opacity-30 active:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:active:bg-zinc-700"
        >
          <Minus size={14} />
        </button>
        <span className="w-5 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">{cantidad}</span>
        <button
          type="button"
          disabled={cantidad >= disponible}
          onClick={() => onCambiar(producto, 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-300 text-orange-600 disabled:opacity-30 active:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:active:bg-orange-900/20"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

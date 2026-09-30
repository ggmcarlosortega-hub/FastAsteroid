// Agrupa cualquier lista de items con forma
// `{ categoria: {id_categoria, nombre, categoria_padre} | null }` — productos.js
// y inventario.js del backend devuelven el mismo shape para categoria a
// propósito, así este helper sirve para ambas pestañas sin casos especiales.
//
// Dos niveles cuando la categoría del item tiene padre (ej. "Pizzas Rigos"
// bajo "Pizzas"): el item cae en el grupo de nivel superior ("Pizzas"), pero
// dentro de una subcategoría propia ("Rigos") en vez de directo en `items`.
// Una categoría sin padre sigue agrupando igual que siempre — `subcategorias`
// queda vacío y todo cae directo en `items`, así los consumidores que no les
// interesan las subcategorías (todavía) no tienen que cambiar nada.
// Orden alfabético por nombre de grupo, "Sin categoría" al final.
export function agruparPorCategoria(items) {
  const grupos = new Map();

  for (const item of items) {
    const categoria = item.categoria;
    const padre = categoria?.categoria_padre ?? null;
    const claveGrupo = padre ? padre.id_categoria : categoria?.id_categoria ?? "__sin_categoria";

    if (!grupos.has(claveGrupo)) {
      grupos.set(claveGrupo, {
        id_categoria: padre ? padre.id_categoria : categoria?.id_categoria ?? null,
        nombre: padre ? padre.nombre : categoria?.nombre ?? "Sin categoría",
        items: [],
        subcategoriasMap: new Map(),
      });
    }
    const grupo = grupos.get(claveGrupo);

    if (padre) {
      if (!grupo.subcategoriasMap.has(categoria.id_categoria)) {
        grupo.subcategoriasMap.set(categoria.id_categoria, {
          id_categoria: categoria.id_categoria,
          nombre: categoria.nombre,
          items: [],
        });
      }
      grupo.subcategoriasMap.get(categoria.id_categoria).items.push(item);
    } else {
      grupo.items.push(item);
    }
  }

  return [...grupos.values()]
    .map((grupo) => ({
      id_categoria: grupo.id_categoria,
      nombre: grupo.nombre,
      items: grupo.items,
      subcategorias: [...grupo.subcategoriasMap.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    }))
    .sort((a, b) => {
      if (a.id_categoria === null) return 1;
      if (b.id_categoria === null) return -1;
      return a.nombre.localeCompare(b.nombre, "es");
    });
}

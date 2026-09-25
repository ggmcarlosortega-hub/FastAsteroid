// Agrupa cualquier lista de items con forma `{ categoria: {id_categoria, nombre} | null }`
// — productos.js y inventario.js del backend devuelven el mismo shape para
// categoria a propósito, así este helper sirve para ambas pestañas sin casos
// especiales. Orden alfabético por nombre de categoría, "Sin categoría" al final.
export function agruparPorCategoria(items) {
  const grupos = new Map();
  for (const item of items) {
    const clave = item.categoria?.id_categoria ?? "__sin_categoria";
    if (!grupos.has(clave)) {
      grupos.set(clave, {
        id_categoria: item.categoria?.id_categoria ?? null,
        nombre: item.categoria?.nombre ?? "Sin categoría",
        items: [],
      });
    }
    grupos.get(clave).items.push(item);
  }

  return [...grupos.values()].sort((a, b) => {
    if (a.id_categoria === null) return 1;
    if (b.id_categoria === null) return -1;
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

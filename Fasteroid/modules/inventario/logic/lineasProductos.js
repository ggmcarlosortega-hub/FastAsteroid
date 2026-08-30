// Suma cantidad × precio_venta de las líneas elegidas — usado para sugerir el
// precio del pedido al elegir productos (sigue siendo editable después).
export function sumaLineas(lineas) {
  return lineas.reduce((total, l) => total + l.cantidad * l.precio_venta, 0);
}

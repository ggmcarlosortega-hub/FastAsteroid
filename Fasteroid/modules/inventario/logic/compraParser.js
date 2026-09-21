// Detecta posibles líneas de producto en el texto crudo (OCR) de una factura de
// compra: cualquier línea que termina en un monto ("... $12.345" o "...
// 12,345"), la misma heurística que ya usa comandaParser.js para el bloque de
// productos de una comanda de domicilio. A diferencia de la comanda (una sola
// impresora, un formato fijo que sí se pudo afinar a mano buscando
// "DESCRIPCION"/"CLIENTE:"), una factura de compra puede venir de cualquier
// proveedor con cualquier formato — no hay un encabezado fijo que buscar, así
// que esto es deliberadamente más simple y menos preciso.
//
// Por eso esto es SIEMPRE mejor esfuerzo: puede colar líneas que no son
// productos (un NIT, una fecha) y puede no reconocer líneas reales con mal
// OCR. Quien use esto (EscanearCompraModal.js) debe mostrar cada línea como un
// borrador editable — el Admin elige el producto real, corrige cantidad/costo,
// y borra las que no sirven — nunca se guarda nada sin esa revisión.

function limpiarMonto(crudo) {
  if (!crudo) return null;
  const numero = crudo.replace(/[^\d]/g, "");
  return numero ? Number(numero) : null;
}

function limpiarDescripcion(crudo) {
  return crudo
    .replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// "<descripción> ... $12.345" o "<descripción> ... 12,345" al final de la línea.
const LINEA_CON_MONTO = /^(.*?)\s+\$?\s*([\d][\d.,]*)\s*$/;

export function parseCompraText(textoOCR) {
  const texto = textoOCR ?? "";
  const lineas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const lineasCandidatas = [];
  for (const linea of lineas) {
    const match = linea.match(LINEA_CON_MONTO);
    if (!match) continue;
    const descripcion = limpiarDescripcion(match[1]);
    const montoDetectado = limpiarMonto(match[2]);
    // Una línea sin texto antes del monto (solo un número — una fecha, un NIT)
    // no sirve como candidato de producto.
    if (!descripcion || montoDetectado == null) continue;
    lineasCandidatas.push({ texto: descripcion, montoDetectado });
  }

  return { lineasCandidatas };
}

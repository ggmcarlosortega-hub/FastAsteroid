// Extrae los campos de una comanda de domicilio (formato "Soft Restaurant"/impresora
// térmica: CLIENTE:<código>-<referencia de entrega>, TEL.:<telefono>, tabla de
// productos, TOTAL:<valor>) a partir del texto crudo que devuelve el OCR.
//
// Ajustado contra el texto CRUDO real que devuelve Tesseract sobre una comanda
// real de RIGOS DAY PIZZA (no una transcripción ideal) — dos hallazgos cambiaron
// el diseño original: (1) la línea "CLIENTE:" no trae un teléfono ni el nombre del
// cliente — el número es un código interno de la caja, y el texto después del
// guion es la REFERENCIA de entrega ("RESERVA CASA 21"), no un nombre; esta
// comanda tampoco tiene una etiqueta "REF:" separada. (2) el teléfono del cliente
// (etiqueta "TEL.:") es fácil de romper con una regex estricta: el OCR a veces lee
// la puntuación después de "TEL" como coma en vez de punto.
//
// El OCR sobre una foto real (mesa metálica de fondo, reflejos, ángulo) NO es
// confiable al 100% — la confianza de Tesseract ronda 40-70% según la foto y los
// dígitos del teléfono son lo que más falla. Por eso cada campo es "mejor
// esfuerzo": si no se encuentra, se devuelve vacío en vez de inventar algo, y
// quien use este parser SIEMPRE debe mostrar un paso de revisión antes de
// guardar nada (nunca confiar el teléfono a ciegas).

function limpiarTelefono(crudo) {
  if (!crudo) return "";
  const digitos = crudo.replace(/\D/g, "");
  // Los celulares colombianos son 10 dígitos y empiezan en 3; si el OCR devolvió
  // más o menos dígitos igual se entrega tal cual para que el domiciliario corrija.
  return digitos.slice(0, 10);
}

function limpiarTexto(crudo) {
  if (!crudo) return "";
  return crudo
    .replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function limpiarPrecio(crudo) {
  if (!crudo) return "";
  const numero = crudo.replace(/[^\d]/g, "");
  return numero ? Number(numero) : "";
}

export function parseComandaText(textoOCR) {
  const texto = textoOCR ?? "";

  // "CLIENTE:002288-RESERVA CASA 21" (a veces el OCR separa el label con espacio,
  // cambia ":" por otro símbolo, o lee mal el código — se tolera con [:\s]*). El
  // número antes del guion es un código interno de la caja, no un teléfono; el
  // texto después del guion es la referencia de entrega (puede traer números,
  // como "CASA 21", así que la clase de caracteres los incluye).
  const matchCliente = texto.match(
    /CLIENTE[:\s]*([\d\sSOolI]+)[-–]\s*([A-Za-zÁÉÍÓÚÑáéíóúñ0-9 ]+)/i
  );

  // "TEL.:3105179890", "TEL, :3105179890" o "TEL:3105179890" aparece DOS veces en
  // la comanda: primero el teléfono del negocio (encabezado) y después el del
  // cliente (junto a CLIENTE). Se toma la ÚLTIMA aparición — la del negocio
  // siempre va primero. La puntuación entre "TEL" y los dígitos varía mucho según
  // lo que reconozca el OCR (punto, coma, dos puntos, o nada), así que se tolera
  // cualquier combinación corta de signos en vez de solo un punto opcional.
  const matchesTel = [...texto.matchAll(/TEL[.,:\s]{0,4}([\d\sSOolI]{7,12})/gi)];
  const matchTel = matchesTel[matchesTel.length - 1];

  // "REF:BARRIO OCAMA CAREPA" — algunas comandas sí traen esta etiqueta separada.
  // Si no aparece (como en las de RIGOS DAY PIZZA), la referencia real es el
  // texto después del guion en la línea de CLIENTE.
  const matchRef = texto.match(/REF[:\s]*([^\n\r]+)/i);
  const referencia = matchRef?.[1]?.trim() || limpiarTexto(matchCliente?.[2]);

  // "TOTAL:$66,000" o "SUBTOTAL: $66,000" — en las comandas de este negocio no
  // se cobra IVA (IMPOCONS:$0), así que el subtotal y el total son el mismo
  // valor; se acepta cualquiera de las dos etiquetas como fuente del precio. Se
  // toma el último match por si aparece más de una vez. La "L" final de
  // "TOTAL" es fácil de confundir para el OCR (se ha visto leída como "!" o
  // "1"), así que se tolera cualquiera de esas variantes o que falte del todo.
  const matchesTotal = [...texto.matchAll(/\b(?:SUB\s?)?TOTA[L1I!]?[:\s]*\$?\s*([\d.,]+)/gi)];
  const matchTotal = matchesTotal[matchesTotal.length - 1];

  // Bloque de productos: entre el encabezado CANT/DESCRIPCION y el primer
  // separador de cierre (TOTAL/SUBTOTAL/SON/CAMBIO). Mejor esfuerzo — cada línea no
  // vacía que no sea el encabezado ni una línea de separadores se toma como
  // "producto". Tope de 6 líneas por si ningún separador de cierre aparece
  // reconocible. Como salvaguarda extra, si el separador de cierre tampoco se
  // reconoció bien, se descartan las líneas que no terminan en un valor ($XXX) —
  // un producto real siempre trae su importe, el pie de página (fecha, "son
  // tantos pesos", etc.) no.
  let productos = "";
  const inicioProductos = texto.search(/DESCRIPCI[OÓ]N/i);
  if (inicioProductos !== -1) {
    const finProductos = texto
      .slice(inicioProductos)
      .search(/\b(TOTAL|SUBTOTAL|SUBTOT|SON|CAMBIO|IMPOCONS|ESTABLECI)/i);
    const bloque = texto.slice(
      inicioProductos,
      finProductos !== -1 ? inicioProductos + finProductos : undefined
    );
    const lineas = bloque
      .split("\n")
      .slice(1, 7)
      .map((l) => l.trim())
      .filter((l) => l && !/^[=\-_]+$/.test(l) && !/DESCRIPCI[OÓ]N/i.test(l));
    const conImporte = lineas.filter((l) => /\$\s*[\d][\d.,]*\s*$/.test(l));
    productos = (conImporte.length ? conImporte : lineas).join(", ");
  }

  const telefono = limpiarTelefono(matchTel?.[1]);
  const precio = limpiarPrecio(matchTotal?.[1]);

  return { telefono, nombre: "", referencia, productos, precio };
}

// Extrae los campos de una comanda de domicilio (formato "Soft Restaurant"/impresora
// térmica: CLIENTE:<telefono>-<nombre>, REF:<referencia>, TEL.:<telefono>, tabla de
// productos, TOTAL:<valor>) a partir del texto crudo que devuelve el OCR.
//
// El OCR sobre una foto real (mesa metálica de fondo, ángulo, brillo) NO es
// confiable al 100% — en pruebas contra una comanda real, la confianza de
// Tesseract ronda 40-60% y los dígitos del teléfono son lo que más falla. Por eso
// cada campo es "mejor esfuerzo": si no se encuentra, se devuelve vacío en vez de
// inventar algo, y quien use este parser SIEMPRE debe mostrar un paso de revisión
// antes de guardar nada (nunca confiar el teléfono a ciegas).

function limpiarTelefono(crudo) {
  if (!crudo) return "";
  const digitos = crudo.replace(/\D/g, "");
  // Los celulares colombianos son 10 dígitos y empiezan en 3; si el OCR devolvió
  // más o menos dígitos igual se entrega tal cual para que el domiciliario corrija.
  return digitos.slice(0, 10);
}

function limpiarNombre(crudo) {
  if (!crudo) return "";
  return crudo
    .replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, " ")
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

  // "CLIENTE:3106835932-FRANCISCA" (a veces el OCR separa el label con espacio,
  // o cambia ":" por otro símbolo — se tolera con [:\s]*).
  const matchCliente = texto.match(/CLIENTE[:\s]*([\d\sSOolI]+)[-–]\s*([A-Za-zÁÉÍÓÚÑáéíóúñ ]+)/i);

  // "TEL.:3106835932" o "TEL:3106835932" aparece DOS veces en la comanda: primero
  // el teléfono del negocio (encabezado) y después el del cliente (junto a
  // CLIENTE/REF). Se toma la ÚLTIMA aparición — la del negocio siempre va primero.
  const matchesTel = [...texto.matchAll(/TEL\.?[:\s]*([\d\sSOolI]{7,12})/gi)];
  const matchTel = matchesTel[matchesTel.length - 1];

  // "REF:BARRIO OCAMA CAREPA" o "0 REF:..." — se corta en el salto de línea. Si el
  // OCR no reconoció la etiqueta "REF" (pasa seguido, es una palabra corta), se cae
  // a la línea entre CLIENTE y TEL, que estructuralmente siempre es la referencia.
  const matchRef = texto.match(/REF[:\s]*([^\n\r]+)/i);
  let referencia = matchRef?.[1]?.trim() ?? "";
  if (!referencia && matchCliente && matchTel) {
    const entreClienteYTel = texto.slice(
      texto.indexOf(matchCliente[0]) + matchCliente[0].length,
      texto.indexOf(matchTel[0])
    );
    referencia = entreClienteYTel
      .split("\n")
      .map((l) =>
        l
          .replace(/^[0O]\s*/, "")
          .replace(/^[A-Za-z]{2,5}[:.]\s*/, "") // posible etiqueta "REF:" mal leída
          .trim()
      )
      .find((l) => l.length > 3) ?? "";
  }

  // "TOTAL:25,500" o "TOTAL: $25.500" — se toma el último TOTAL si aparece más de
  // una vez (a veces SUBTOTAL también matchea variantes del label).
  const matchesTotal = [...texto.matchAll(/\bTOTAL[:\s]*\$?\s*([\d.,]+)/gi)];
  const matchTotal = matchesTotal[matchesTotal.length - 1];

  // Bloque de productos: entre el encabezado CANT/DESCRIPCION y el primer
  // separador de cierre (TOTAL/SUBTOTAL/SON/CAMBIO). Mejor esfuerzo — cada línea no
  // vacía que no sea el encabezado ni una línea de separadores se toma como
  // "producto". Tope de 6 líneas por si ningún separador de cierre aparece
  // reconocible (evita arrastrar el pie de página completo como si fuera producto).
  let productos = "";
  const inicioProductos = texto.search(/DESCRIPCI[OÓ]N/i);
  if (inicioProductos !== -1) {
    const finProductos = texto
      .slice(inicioProductos)
      .search(/\b(TOTAL|SUBTOTAL|SON|CAMBIO|IMPOCONS|ESTABLECI)/i);
    const bloque = texto.slice(
      inicioProductos,
      finProductos !== -1 ? inicioProductos + finProductos : undefined
    );
    productos = bloque
      .split("\n")
      .slice(1, 7)
      .map((l) => l.trim())
      .filter((l) => l && !/^[=\-_]+$/.test(l) && !/DESCRIPCI[OÓ]N/i.test(l))
      .join(", ");
  }

  const telefono = limpiarTelefono(matchTel?.[1] ?? matchCliente?.[1]);
  const nombre = limpiarNombre(matchCliente?.[2]);
  const precio = limpiarPrecio(matchTotal?.[1]);

  return { telefono, nombre, referencia, productos, precio };
}

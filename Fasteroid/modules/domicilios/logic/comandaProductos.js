import { parseComandaText } from "./comandaParser";

// Lectura de las líneas de productos de una comanda (ticket térmico del POS) y
// emparejamiento con el catálogo. Se mantiene sin dependencias de navegador para
// poder probarlo con texto real de OCR fuera de la app.
//
// Una línea de producto tiene la forma "<cantidad> <descripción> $<importe>", pero
// el OCR no siempre conserva el encabezado "CANT. DESCRIPCION", así que las líneas
// se reconocen por su patrón, no por su posición en el ticket.

const ABREVIATURAS = {
  HAMB: "HAMBURGUESA",
  HAMBUR: "HAMBURGUESA",
  PIZZETA: "PIZZETA",
  PIZ: "PIZZA",
  PEQ: "PEQUEÑA",
  PEQUENA: "PEQUEÑA",
  MED: "MEDIANA",
  GDE: "GRANDE",
  PORC: "PORCION",
};

function sinTildes(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Llave con la que se guarda y se busca un texto leído en el aprendizaje del OCR.
export function clave(texto) {
  return normalizar(texto);
}

function normalizar(texto) {
  return sinTildes(texto)
    .toUpperCase()
    .replace(/[^A-Z0-9Ñ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Expande abreviaturas comunes de la caja ("HAMB SENCILLA" -> "HAMBURGUESA SENCILLA").
function expandirAbreviaturas(normalizado) {
  return normalizado
    .split(" ")
    .map((palabra) => ABREVIATURAS[palabra] ?? palabra)
    .join(" ");
}

// Distancia de Levenshtein, suficiente para palabras cortas de un menú.
function distancia(a, b) {
  const filas = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) filas[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      filas[i][j] = Math.min(filas[i - 1][j] + 1, filas[i][j - 1] + 1, filas[i - 1][j - 1] + costo);
    }
  }
  return filas[a.length][b.length];
}

// Similitud de una palabra de la descripción contra una palabra del producto, de 0 a 1.
// Tolera errores típicos del OCR ("HANATANA" ~ "HAWAIANA") sin aceptar cualquier cosa:
// palabras cortas tienen que coincidir casi exactas.
function similitudPalabra(a, b) {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen < 4) return 0;
  const d = distancia(a, b);
  return d <= Math.floor(maxLen / 4) ? 1 - d / maxLen : 0;
}

// Una línea de producto: [cantidad opcional] descripción [$]importe. El OCR suele
// perder la cantidad inicial, pegar basura al inicio ("L HANATANA PEQUEÑA $45,000")
// o dejar el "$" pegado; por eso la cantidad es opcional (default 1, que es lo
// normal en estas comandas) y el importe es lo único obligatorio al final.
const REGEX_LINEA =
  /^[^\dA-Za-zÁÉÍÓÚÑáéíóúñ]*(?:(\d{1,2})\s+)?([A-Za-zÁÉÍÓÚÑáéíóúñ][^$]*?)\s+\$?\s*([\d][\d.,]{2,})\s*$/;
const REGEX_PIE =
  /\b(TOTA\w*|SUBTOT\w*|SON|CAMBIO\w*|IMPOC\w*|ESTABLECI\w*|REPARTIDOR|CLIENTE|REF|TEL\w*|FACTURA|ORDEN|DOMICILIO|NIT|CP|DIRECCI\w*|PIZZERIA|RESTAURANT\w*|MUCHAS|GRACIAS|CANT|DESCRIPCI\w*|IMPORTE)\b/i;
function importeNumerico(crudo) {
  return Number(crudo.replace(/[^\d]/g, ""));
}

export function leerLineasComanda(textoOCR) {
  const lineas = [];
  for (const crudo of (textoOCR ?? "").split("\n")) {
    const linea = crudo.trim();
    if (!linea || REGEX_PIE.test(linea)) continue;
    const m = linea.match(REGEX_LINEA);
    if (!m) continue;
    const descripcion = m[2].replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .']/g, " ").replace(/\s+/g, " ").trim();
    const importe = importeNumerico(m[3]);
    if (!descripcion || importe < 1000) continue;
    if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]{3,}/.test(descripcion)) continue;
    lineas.push({ cantidad: m[1] ? Number(m[1]) : 1, descripcion, importe });
  }
  return { lineas };
}

// Qué fracción del nombre del municipio aparece (con tolerancia al OCR) en la
// descripción de la línea. Solo cuenta 1 si TODAS sus palabras aparecen, así que
// "CAREPA URBANA" coincide con "carepa" pero una línea de producto no coincide con
// un municipio por una sola palabra suelta.
function puntajeMunicipio(descripcion, nombreMunicipio) {
  const palabrasDesc = expandirAbreviaturas(normalizar(descripcion)).split(" ").filter((p) => p.length > 1);
  const palabrasMun = normalizar(nombreMunicipio).split(" ").filter((p) => p.length > 1);
  if (palabrasDesc.length === 0 || palabrasMun.length === 0) return 0;
  const encontradas = palabrasMun.filter((q) => palabrasDesc.some((p) => similitudPalabra(p, q) > 0));
  return encontradas.length / palabrasMun.length;
}

// Cuando el OCR lee el nombre de la adición pero no su importe, se usa el municipio
// igual; el valor sale del recargo guardado para ese municipio.
// Las líneas de dirección y de referencia también nombran el municipio ("CLL ...
// CAREPA", "0 CAREPA"), así que se descartan antes de buscar la adición.
const REGEX_DIRECCION = /\b(CLL|CRA|CALLE|REF|CLIENTE|DIRECC\w*|TEL\w*)\b|#/i;
const REGEX_REFERENCIA = /^\s*[0O]\s/;

function detectarAdicionPorNombre(textoOCR, municipios) {
  for (const crudo of (textoOCR ?? "").split("\n")) {
    const linea = crudo.trim();
    if (!linea || REGEX_PIE.test(linea) || REGEX_DIRECCION.test(linea) || REGEX_REFERENCIA.test(linea)) continue;
    const coincidencia = detectarAdicion([{ descripcion: linea, importe: 0 }], municipios);
    if (coincidencia) return { municipio: coincidencia.municipio };
  }
  return null;
}

// Adición del domicilio: la línea del ticket cuyo nombre es un municipio de la app
// (CAREPA URBANA, REPOSO, BRIGADA...). Se elige el municipio que mejor coincida; si
// ninguno coincide completo, no hay adición detectada y la línea se trata normal.
export function detectarAdicion(lineas, municipios, aprendidos = new Map()) {
  let mejor = null;
  for (const linea of lineas) {
    const idAprendido = aprendidos.get(clave(linea.descripcion));
    const municipioAprendido = idAprendido && municipios.find((m) => m.id_municipio === idAprendido);
    if (municipioAprendido) return { linea, municipio: municipioAprendido };
    for (const municipio of municipios) {
      const puntaje = puntajeMunicipio(linea.descripcion, municipio.nombre);
      if (puntaje < 1) continue;
      if (!mejor || municipio.nombre.length > mejor.municipio.nombre.length) {
        mejor = { linea, municipio };
      }
    }
  }
  return mejor;
}

// Un celular colombiano tiene 10 dígitos y empieza en 3. El OCR a veces deja el
// número con dígitos de menos; en ese caso se marca para revisar, no se acepta.
export function telefonoValido(telefono) {
  return /^3\d{9}$/.test(telefono ?? "");
}

// Puntaje de un producto para una descripción leída: proporción de palabras de la
// descripción que aparecen (con tolerancia) en el nombre del producto, penalizando
// los productos con nombres mucho más largos (para que "Hawaiana" no gane a
// "Pizzeta Hawaiana" cuando la descripción sí trae "PIZZETA").
export function puntajeProducto(descripcion, nombreProducto) {
  const palabrasDesc = expandirAbreviaturas(normalizar(descripcion)).split(" ").filter((p) => p.length > 1);
  const palabrasProd = expandirAbreviaturas(normalizar(nombreProducto)).split(" ").filter(Boolean);
  if (palabrasDesc.length === 0 || palabrasProd.length === 0) return 0;

  let coincidencias = 0;
  for (const p of palabrasDesc) {
    const mejor = Math.max(...palabrasProd.map((q) => similitudPalabra(p, q)));
    coincidencias += mejor;
  }
  const cobertura = coincidencias / palabrasDesc.length;
  const sobrante = palabrasProd.length - Math.min(coincidencias, palabrasProd.length);
  return cobertura * (1 - 0.1 * sobrante);
}

// Para cada línea leída, el producto del catálogo con mejor puntaje. Solo se acepta
// si el puntaje supera el umbral: por debajo, la línea queda sin producto y el
// domiciliario la elige a mano (nunca se inventa un producto).
export function emparejarConCatalogo(lineas, productos, umbral = 0.8, aprendidos = new Map()) {
  return lineas.map((linea) => {
    let mejor = null;
    let mejorPuntaje = 0;
    const idAprendido = aprendidos.get(clave(linea.descripcion));
    const aprendido = idAprendido && productos.find((p) => p.id_producto === idAprendido);
    if (aprendido) {
      mejor = aprendido;
      mejorPuntaje = 1;
    } else {
      for (const producto of productos) {
        const puntaje = puntajeProducto(linea.descripcion, producto.nombre);
        if (puntaje > mejorPuntaje) {
          mejorPuntaje = puntaje;
          mejor = producto;
        }
      }
    }
    const aceptado = mejor && mejorPuntaje >= umbral;
    return {
      ...linea,
      id_producto: aceptado ? mejor.id_producto : null,
      nombre: aceptado ? mejor.nombre : null,
      precio_venta: aceptado ? mejor.precio_venta : null,
      puntaje: Math.round(mejorPuntaje * 100) / 100,
    };
  });
}

// Análisis completo de una comanda leída por OCR: cabecera (teléfono, referencia,
// total), líneas de producto ya emparejadas con el catálogo y las comprobaciones que
// indican qué debe revisar el domiciliario antes de guardar. Nunca guarda nada por sí
// solo: el resultado solo prellena el formulario de revisión.
// Teléfono del propio restaurante, impreso en el encabezado de cada comanda. Si el
// OCR no alcanza a leer el bloque del cliente, el último "TEL" del ticket es este
// número, y no debe prellenarse como teléfono del cliente.
const TELEFONOS_NEGOCIO = ["3206877467"];

// `aprendizaje`: lista de { tipo, texto_clave, id_referencia } de confirmaciones previas.
export function analizarComanda(textoOCR, productos, municipios = [], aprendizaje = []) {
  const cabecera = parseComandaText(textoOCR);
  if (TELEFONOS_NEGOCIO.includes(cabecera.telefono)) cabecera.telefono = "";
  const aprendidosProducto = new Map(aprendizaje.filter((a) => a.tipo === "producto").map((a) => [a.texto_clave, a.id_referencia]));
  const aprendidosMunicipio = new Map(aprendizaje.filter((a) => a.tipo === "municipio").map((a) => [a.texto_clave, a.id_referencia]));
  const { lineas: todasLasLineas } = leerLineasComanda(textoOCR);
  const conImporte = detectarAdicion(todasLasLineas, municipios, aprendidosMunicipio);
  const adicion = conImporte ?? detectarAdicionPorNombre(textoOCR, municipios);
  const lineas = conImporte ? todasLasLineas.filter((l) => l !== conImporte.linea) : todasLasLineas;
  const emparejadas = emparejarConCatalogo(lineas, productos, 0.8, aprendidosProducto);
  const importeAdicion = conImporte ? conImporte.linea.importe : null;
  const sumaLineas = lineas.reduce((suma, l) => suma + l.importe, 0) + (importeAdicion ?? 0);
  const precio = cabecera.precio === "" ? null : cabecera.precio;
  const totalCuadra =
    precio != null && todasLasLineas.length > 0 && (importeAdicion != null || !adicion)
      ? Math.abs(precio - sumaLineas) < 1
      : null;

  return {
    telefono: cabecera.telefono,
    telefonoValido: telefonoValido(cabecera.telefono),
    referencia: cabecera.referencia,
    precio,
    adicion: adicion
      ? {
          id_municipio: adicion.municipio.id_municipio,
          nombre: adicion.municipio.nombre,
          recargo_municipio: Number(adicion.municipio.recargo_domicilio),
          importe_comanda: importeAdicion,
        }
      : null,
    lineas: emparejadas,
    lineasSinCoincidencia: emparejadas
      .filter((l) => !l.id_producto)
      .map((l) => ({ descripcion: l.descripcion, importe: l.importe })),
    totalCuadra,
    sinProductosEmparejados: emparejadas.length > 0 && emparejadas.every((l) => !l.id_producto),
  };
}

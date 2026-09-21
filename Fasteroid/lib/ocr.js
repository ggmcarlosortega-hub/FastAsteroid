import { rotarImagen } from "../modules/domicilios/logic/imagenUtil";

// Infraestructura de OCR genérica — extraída de EscanearComandaModal.js para que
// el nuevo escaneo de facturas de compra (EscanearCompraModal.js) no tenga que
// duplicar el mismo reintento de rotaciones. Nada acá es específico de comandas
// ni de compras: solo "dame el mejor texto que Tesseract puede sacar de esta foto".

// Escala de grises simple: ayuda a la lectura de OCR sobre una foto real sin
// agregar ninguna dependencia. Se probó CON un umbral duro (blanco/negro puro)
// contra una comanda real fotografiada sobre una mesa metálica con reflejos, y
// empeoraba mucho el resultado (el brillo desigual del metal hacía que el
// umbral borrara texto real); se probó sin umbral —solo gris— y el texto
// reconocible mejoró notablemente. Por eso se dejó solo la conversión a gris.
function preprocesarImagen(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const datos = imageData.data;
      for (let i = 0; i < datos.length; i += 4) {
        const gris = 0.299 * datos[i] + 0.587 * datos[i + 1] + 0.114 * datos[i + 2];
        datos[i] = datos[i + 1] = datos[i + 2] = gris;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Cuando la orientación está muy equivocada, Tesseract no reconoce ningún
// carácter — pero en vez de dar confianza baja, a veces reporta una confianza
// ALTA (~95%) por no encontrar nada que dudar, con el texto vacío. Sin filtrar
// eso, ese resultado "vacío pero seguro" le gana por confianza a la
// orientación correcta (que sí trae texto real, con su ruido normal). Por eso
// la confianza de un intento con muy poco texto reconocido se descarta a 0.
function confianzaValida({ text, confidence }) {
  return text.trim().length > 20 ? confidence : 0;
}

async function intentarLectura(worker, dataUrl) {
  const imagenProcesada = await preprocesarImagen(dataUrl);
  const { data } = await worker.recognize(imagenProcesada);
  return { text: data.text, confidence: confianzaValida(data) };
}

// La foto no siempre se toma en vertical y hacia arriba (de cabeza, en
// horizontal). Se probó usar la confianza del primer intento como señal para
// decidir si vale la pena probar otras rotaciones, pero una foto realmente al
// revés puede igual dar una confianza "razonable" (~35-40%, similar a una foto
// bien orientada con mala luz) mientras el texto es pura basura — la confianza
// sola no distingue de forma confiable "mala foto" de "ángulo equivocado". Por
// eso se prueban SIEMPRE las 4 orientaciones y se usa la de mejor confianza;
// cuesta más tiempo de lectura, pero es la única forma confiable de no depender
// de que quien tome la foto la recuerde derecha.
export async function leerMejorTexto(dataUrl) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("spa");
  try {
    await worker.setParameters({ tessedit_pageseg_mode: "4" });

    let mejor = await intentarLectura(worker, dataUrl);
    for (const grados of [90, 180, 270]) {
      const girada = await rotarImagen(dataUrl, grados);
      const intento = await intentarLectura(worker, girada);
      if (intento.confidence > mejor.confidence) mejor = intento;
    }

    return mejor.text;
  } finally {
    await worker.terminate();
  }
}

// Solo para compras: se comprobó contra una factura real (formato DIAN, tabla
// con encabezados sobre fondo gris) que el modo "4" (una sola columna de texto)
// lee bien la prosa — nombres, direcciones — pero pierde por completo los
// números de las celdas de la tabla; el modo "11" (texto disperso, sin
// suponer columnas) rescata algunos de esos números sueltos que "4" no ve, a
// costa de leer peor el texto corrido. Se buscan las rotaciones con el modo
// "4" (más confiable para detectar la orientación real), y sobre la que gane
// se relee una segunda vez con "11" — el texto de ambos modos se junta. No se
// hace este doble intento para comandas (leerMejorTexto): ahí un solo modo ya
// funciona bien y duplicar la lectura solo la haría más lenta sin necesidad.
export async function leerTextoParaCompra(dataUrl) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("spa");
  try {
    await worker.setParameters({ tessedit_pageseg_mode: "4" });

    let mejor = { ...(await intentarLectura(worker, dataUrl)), imagen: dataUrl };
    for (const grados of [90, 180, 270]) {
      const girada = await rotarImagen(dataUrl, grados);
      const intento = await intentarLectura(worker, girada);
      if (intento.confidence > mejor.confidence) mejor = { ...intento, imagen: girada };
    }

    await worker.setParameters({ tessedit_pageseg_mode: "11" });
    const disperso = await intentarLectura(worker, mejor.imagen);

    return `${mejor.text}\n${disperso.text}`;
  } finally {
    await worker.terminate();
  }
}

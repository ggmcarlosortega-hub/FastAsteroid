// Las fotos de un celular real pueden pesar varios MB sin comprimir (algunas
// cámaras capturan a resoluciones que superan el límite de área de canvas de
// varios navegadores móviles, ~16 megapíxeles) — eso rompe el límite de tamaño
// del body en el servidor y hace que el OCR (Tesseract.js) sea mucho más lento
// e impreciso en un celular real que en las pruebas de escritorio. Se
// redimensiona y recomprime antes de usar la imagen para cualquier cosa.
export function comprimirImagen(dataUrl, { maxDim = 1600, calidad = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", calidad));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Gira una imagen 90/180/270 grados. Se usa para el reintento de OCR cuando la
// foto quedó de cabeza o en horizontal (el domiciliario no siempre la toma en
// vertical y hacia arriba) — probar varias orientaciones y quedarse con la de
// mejor confianza es mucho más simple y robusto que detectar la orientación de
// antemano.
export function rotarImagen(dataUrl, grados) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const vertical = grados === 90 || grados === 270;
      canvas.width = vertical ? img.height : img.width;
      canvas.height = vertical ? img.width : img.height;
      const ctx = canvas.getContext("2d");
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((grados * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

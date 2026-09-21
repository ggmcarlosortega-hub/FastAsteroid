// Exporta filas a un CSV descargable — 100% client-side, sobre datos que el
// hook llamante ya tiene cargados (sin pedirle nada nuevo al backend). Excel lo
// abre nativo, así que no hace falta ninguna librería de .xlsx.
//
// columnas: [{ key, label }] — label va en el encabezado, key busca el valor en
// cada fila (con soporte para "a.b" simple, ej. "cliente.nombre").
export function descargarCsv(nombreArchivo, columnas, filas) {
  function valorDe(fila, key) {
    return key.split(".").reduce((obj, parte) => obj?.[parte], fila);
  }

  // Un campo con coma, comilla o salto de línea se envuelve en comillas dobles,
  // duplicando las comillas internas — regla estándar de CSV (RFC 4180).
  function escapar(valor) {
    const texto = valor == null ? "" : String(valor);
    if (/[",\n]/.test(texto)) {
      return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
  }

  const encabezado = columnas.map((c) => escapar(c.label)).join(",");
  const lineas = filas.map((fila) => columnas.map((c) => escapar(valorDe(fila, c.key))).join(","));
  // BOM al inicio: sin esto, Excel en Windows a veces rompe los acentos/ñ del CSV.
  const contenido = "﻿" + [encabezado, ...lineas].join("\r\n");

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

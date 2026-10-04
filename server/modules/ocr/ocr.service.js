const crypto = require("crypto");
const { pool } = require("../../db/pool");
const { ServiceError } = require("../../lib/service-error");

const TIPOS = ["producto", "municipio"];
const TABLA_REFERENCIA = { producto: "producto", municipio: "municipio" };
const COLUMNA_REFERENCIA = { producto: "id_producto", municipio: "id_municipio" };
const MAX_ENTRADAS = 20;

// Lo que el OCR ya aprendió: texto leído (ya normalizado por quien lo envía) y el
// producto o municipio que el domiciliario confirmó para él.
async function listarAprendizaje() {
  const [rows] = await pool.execute(
    "SELECT tipo, texto_clave, id_referencia, veces FROM ocr_aprendizaje ORDER BY veces DESC"
  );
  return rows.map((r) => ({
    tipo: r.tipo,
    texto_clave: r.texto_clave,
    id_referencia: r.id_referencia,
    veces: r.veces,
  }));
}

// Guarda confirmaciones. Si el mismo texto ya apuntaba a otra referencia, gana la última
// confirmación (el domiciliario corrige lo que el sistema se equivocó), y se cuentan las
// veces que se confirmó.
async function registrarAprendizaje(entradas) {
  if (!Array.isArray(entradas) || entradas.length === 0) return { guardadas: 0 };
  if (entradas.length > MAX_ENTRADAS) {
    throw new ServiceError(`Máximo ${MAX_ENTRADAS} entradas por envío`, 400);
  }

  const limpias = entradas.map((e, i) => {
    if (!TIPOS.includes(e?.tipo)) throw new ServiceError(`Entrada ${i + 1}: tipo inválido`, 400);
    const texto = String(e.texto_clave ?? "").trim().toUpperCase().slice(0, 255);
    if (!texto) throw new ServiceError(`Entrada ${i + 1}: texto vacío`, 400);
    if (!e.id_referencia) throw new ServiceError(`Entrada ${i + 1}: falta la referencia`, 400);
    return { tipo: e.tipo, texto, id_referencia: String(e.id_referencia) };
  });

  for (const e of limpias) {
    const [existe] = await pool.execute(
      `SELECT 1 FROM ${TABLA_REFERENCIA[e.tipo]} WHERE ${COLUMNA_REFERENCIA[e.tipo]} = ?`,
      [e.id_referencia]
    );
    if (!existe[0]) throw new ServiceError(`La referencia de ${e.tipo} no existe`, 400);
  }

  for (const e of limpias) {
    await pool.execute(
      `INSERT INTO ocr_aprendizaje (id_aprendizaje, tipo, texto_clave, id_referencia)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id_referencia = VALUES(id_referencia), veces = veces + 1, ultima_vez = NOW()`,
      [crypto.randomUUID(), e.tipo, e.texto, e.id_referencia]
    );
  }
  return { guardadas: limpias.length };
}

module.exports = { listarAprendizaje, registrarAprendizaje };

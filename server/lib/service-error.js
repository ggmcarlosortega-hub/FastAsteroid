class ServiceError extends Error {
  constructor(message, status, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

// Equivalente a toErrorResponse() de Fasteroid/lib/service-error.js, adaptado a la
// API de respuesta de Express (res.status().json()) en vez de NextResponse.
function sendServiceError(res, err) {
  if (err instanceof ServiceError) {
    res.status(err.status).json({ error: err.message, ...err.extra });
    return;
  }
  // No es un error de negocio esperado: se relanza para que lo capture el
  // middleware de error central de app.js (responde 500, no tumba el proceso).
  throw err;
}

module.exports = { ServiceError, sendServiceError };

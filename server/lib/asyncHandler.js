// Express 4 no reenvía automáticamente los rechazos de una promesa al middleware de
// error — sin este wrapper, un error async sin capturar deja la solicitud colgada
// (nunca responde) en vez de caer en el manejador de errores central de app.js.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };

const { verifySessionToken, SESSION_COOKIE_NAME } = require("../auth");

// Reemplaza la parte de sesión de Fasteroid/proxy.js: exige un JWT válido en la
// cookie y expone la sesión decodificada como req.session para las rutas siguientes.
async function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const session = await verifySessionToken(token);

  if (!session) {
    return res.status(401).json({ error: "No autenticado" });
  }

  req.session = session;
  next();
}

// Reemplaza la parte de guard-por-rol de proxy.js (bloques /admin y /domiciliario).
// Se usa después de requireAuth en las rutas donde el rol importa.
function requireRole(rol) {
  return (req, res, next) => {
    if (req.session?.rol !== rol) {
      return res.status(403).json({ error: "No autorizado" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };

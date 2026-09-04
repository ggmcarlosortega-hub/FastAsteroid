const { Server } = require("socket.io");
const { verifySessionToken, SESSION_COOKIE_NAME } = require("./auth");

let io = null;

// Socket.IO no corre cookie-parser (eso es middleware de Express, esto es el
// handshake crudo) — alcanza con buscar a mano la única cookie que importa acá,
// sin sumar una dependencia nueva solo para esto.
function leerCookieSesion(cookieHeader) {
  if (!cookieHeader) return null;
  const partes = cookieHeader.split(";").map((p) => p.trim());
  const match = partes.find((p) => p.startsWith(`${SESSION_COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.slice(SESSION_COOKIE_NAME.length + 1)) : null;
}

// httpServer: mismo servidor HTTP de siempre (puerto 4000, el que usa el rewrite
// de Next) — se mantiene igual para no arriesgar lo que ya funciona.
// httpsServer: nuevo, solo para que el navegador pueda abrir el socket directo
// sin que el "mixed content" lo bloquee cuando el frontend es HTTPS (ver plan).
function initRealtime(httpServer, httpsServer) {
  io = new Server(httpServer, { cors: { origin: true, credentials: true } });
  if (httpsServer) {
    io.attach(httpsServer);
  }

  // Mismo criterio que requireAuth: sin sesión válida, no hay conexión.
  io.use(async (socket, next) => {
    const token = leerCookieSesion(socket.handshake.headers.cookie);
    const session = await verifySessionToken(token);
    if (!session) {
      next(new Error("No autenticado"));
      return;
    }
    socket.session = session;
    next();
  });

  return io;
}

// "Aviso de invalidación", no manda datos — cada pantalla vuelve a pedir lo
// suyo con el mismo fetch REST que ya usaba (ver Fasteroid/lib/useRealtime.js).
// No-op si todavía no se inicializó (ej. un script suelto como db/seed.js que
// llama a un servicio sin levantar el servidor real).
function emitCambio(evento) {
  if (io) io.emit(evento);
}

module.exports = { initRealtime, emitCambio };

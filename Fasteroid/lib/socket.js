"use client";

import { io } from "socket.io-client";

// El navegador tiene que hablarle directo a Express para el WebSocket (a
// diferencia del resto de /api/*, que Next.js reescribe server-to-server —
// ver next.config.mjs) — por eso elige el puerto/esquema según el protocolo
// de la página actual: si es HTTPS usa el listener HTTPS nuevo del backend
// (evita que el navegador bloquee un ws:// sin cifrar por "mixed content"
// desde una página https://), si es HTTP plano usa el mismo puerto de
// siempre. Ver server/server.js y el plan de "tiempo real" para el porqué.
function resolverUrl() {
  const esHttps = window.location.protocol === "https:";
  const puerto = esHttps
    ? process.env.NEXT_PUBLIC_WS_HTTPS_PORT ?? 4443
    : process.env.NEXT_PUBLIC_WS_PORT ?? 4000;
  return `${esHttps ? "https" : "http"}://${window.location.hostname}:${puerto}`;
}

// autoConnect: false — se conecta a mano recién cuando hay sesión (ver
// app/admin/layout.js y app/domiciliario/layout.js), para no intentar
// conectar (y reintentar en loop) desde /login, donde el handshake siempre
// va a rechazarse por falta de cookie de sesión.
const socket = typeof window !== "undefined" ? io(resolverUrl(), { withCredentials: true, autoConnect: false }) : null;

export default socket;

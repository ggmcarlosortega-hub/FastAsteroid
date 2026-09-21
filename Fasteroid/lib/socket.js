"use client";

import { io } from "socket.io-client";

// El navegador tiene que hablarle directo a Express para el WebSocket (a
// diferencia del resto de /api/*, que Next.js reescribe server-to-server —
// ver next.config.mjs).
//
// NEXT_PUBLIC_WS_URL (origen completo, ej. "https://api-fasteroid.onrender.com")
// es para un despliegue partido: frontend y backend en dominios DISTINTOS (ej.
// Vercel + Render/Railway) — ahí no hay forma de adivinar la URL del backend a
// partir de la página actual. Si no está definida, se asume que front y back
// viven en el mismo dominio (dev local, o los dos detrás del mismo proxy) y se
// arma la URL con el hostname actual + el puerto de siempre, eligiendo HTTPS o
// HTTP según el protocolo de la página (evita que el navegador bloquee un
// ws:// sin cifrar por "mixed content" desde una página https://). Ver
// server/server.js y el plan de "tiempo real" para el porqué de los puertos.
function resolverUrl() {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;

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

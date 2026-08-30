"use client";

import { useEffect, useRef } from "react";
import socket from "./socket";

// Vuelve a llamar `onEvento` (normalmente el mismo `cargar()` que el hook ya
// tenía) cada vez que el backend avisa que algo cambió (ver
// server/lib/realtime.js) — así ninguna pantalla depende de que alguien la
// recargue a mano. También se dispara al reconectar el socket ("connect"):
// si el celular perdió señal un momento, se vuelve a pedir todo por si se
// perdió algún aviso mientras estuvo desconectado.
//
// eventos: un string ("domicilios:changed") o un array de varios.
export function useRealtime(eventos, onEvento) {
  const callbackRef = useRef(onEvento);
  callbackRef.current = onEvento;

  const lista = Array.isArray(eventos) ? eventos : [eventos];
  const key = lista.join(",");

  useEffect(() => {
    if (!socket) return;
    const handler = () => callbackRef.current();
    lista.forEach((evento) => socket.on(evento, handler));
    socket.on("connect", handler);
    return () => {
      lista.forEach((evento) => socket.off(evento, handler));
      socket.off("connect", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

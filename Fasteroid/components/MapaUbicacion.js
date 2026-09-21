"use client";

import { useEffect, useRef } from "react";

// Centro de Carepa, Antioquia — punto de partida cuando todavía no hay ninguna
// coordenada elegida (mismo pueblo que ya usan los datos de siembra del proyecto).
const CENTRO_CAREPA = [7.7539, -76.652];

// Mapa de ubicación con Leaflet, en JS puro (sin react-leaflet): import dinámico
// dentro de un useEffect + manejo imperativo, mismo criterio que ya usa el
// proyecto con Tesseract.js — no vale la pena una capa de wrapper de React
// encima solo para esto.
//
// - Sin onChange: mapa de solo lectura con un marcador fijo (pantallas de
//   detalle).
// - Con onChange: tocar el mapa fija/mueve el marcador y avisa la nueva
//   coordenada — arranca SIN marcador si no hay latitud/longitud iniciales, para
//   obligar a tocar el mapa al menos una vez en vez de asumir un punto que la
//   persona nunca confirmó.
export default function MapaUbicacion({ latitud, longitud, onChange, height = 220 }) {
  const contenedorRef = useRef(null);
  const mapaRef = useRef(null);
  const marcadorRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelado = false;

    import("leaflet").then((L) => {
      if (cancelado || !contenedorRef.current) return;

      // Los íconos por defecto de Leaflet vienen con rutas relativas que se
      // rompen con cualquier bundler (Webpack/Turbopack incluidos) — se
      // reemplazan por los mismos PNG servidos como archivos estáticos desde
      // public/leaflet/ (copiados de node_modules/leaflet/dist/images/).
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      const hayPunto = latitud != null && longitud != null;
      const centro = hayPunto ? [latitud, longitud] : CENTRO_CAREPA;

      // Un mapa de solo lectura (detalle de cliente/domicilio) es una vista
      // fija del punto — sin interacción no hay forma de "perder" el punto
      // arrastrando o haciendo zoom sin querer, sobre todo en las tarjetas
      // chicas de la lista de ubicaciones de un cliente.
      const mapa = L.map(contenedorRef.current, {
        zoomControl: !!onChange,
        dragging: !!onChange,
        scrollWheelZoom: !!onChange,
        doubleClickZoom: !!onChange,
        touchZoom: !!onChange,
        boxZoom: !!onChange,
        keyboard: !!onChange,
      }).setView(centro, hayPunto ? 16 : 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapa);

      if (hayPunto) {
        marcadorRef.current = L.marker(centro, { draggable: !!onChange }).addTo(mapa);
        marcadorRef.current.on("dragend", () => {
          const { lat, lng } = marcadorRef.current.getLatLng();
          onChangeRef.current?.({ latitud: lat, longitud: lng });
        });
      }

      if (onChange) {
        mapa.on("click", (e) => {
          if (!marcadorRef.current) {
            marcadorRef.current = L.marker(e.latlng, { draggable: true }).addTo(mapa);
            marcadorRef.current.on("dragend", () => {
              const { lat, lng } = marcadorRef.current.getLatLng();
              onChangeRef.current?.({ latitud: lat, longitud: lng });
            });
          } else {
            marcadorRef.current.setLatLng(e.latlng);
          }
          onChangeRef.current?.({ latitud: e.latlng.lat, longitud: e.latlng.lng });
        });
      }

      mapaRef.current = mapa;

      // El contenedor puede arrancar en 0 de alto si el modal todavía se está
      // animando/abriendo — sin este recálculo el mapa queda mal centrado o en
      // blanco hasta el primer resize de la ventana.
      setTimeout(() => mapaRef.current?.invalidateSize(), 150);
    });

    return () => {
      cancelado = true;
      mapaRef.current?.remove();
      mapaRef.current = null;
      marcadorRef.current = null;
    };
    // Solo se crea una vez por instancia del componente — reposicionar ante un
    // cambio de latitud/longitud lo maneja el efecto de abajo sin recrear el mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si el padre fija latitud/longitud por otro medio (ej. al cargar datos ya
  // guardados) después de montado el mapa, reposiciona el marcador sin
  // recrearlo.
  useEffect(() => {
    if (!mapaRef.current || latitud == null || longitud == null) return;
    import("leaflet").then((L) => {
      if (!mapaRef.current) return;
      if (!marcadorRef.current) {
        marcadorRef.current = L.marker([latitud, longitud], { draggable: !!onChange }).addTo(mapaRef.current);
        if (onChange) {
          marcadorRef.current.on("dragend", () => {
            const { lat, lng } = marcadorRef.current.getLatLng();
            onChangeRef.current?.({ latitud: lat, longitud: lng });
          });
        }
      } else {
        marcadorRef.current.setLatLng([latitud, longitud]);
      }
      mapaRef.current.setView([latitud, longitud], mapaRef.current.getZoom());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitud, longitud]);

  return (
    <div
      ref={contenedorRef}
      style={{ height }}
      className="w-full overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700"
    />
  );
}

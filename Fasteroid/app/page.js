import { Users, MapPin, Bike, Radio, MapPinned, ScanLine, DatabaseZap } from "lucide-react";
import LogoMark from "../components/LogoMark";
import Hero from "../components/landing/Hero";
import CifrasReales from "../components/landing/CifrasReales";
import BloqueFuncion from "../components/landing/BloqueFuncion";
import GrillaCapacidades from "../components/landing/GrillaCapacidades";
import CTAFinal from "../components/landing/CTAFinal";

export const dynamic = "force-dynamic";

// Server Component: no hay origen de navegador del que colgarse, así que se llama
// directo a Express (no a través del rewrite, que es solo para el navegador).
async function obtenerStats() {
  const apiUrl = process.env.API_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}/api/stats`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // El backend puede estar caído (ver sección de escalabilidad en aplicativos.md)
    // — la landing no debe romperse por eso, solo mostrar que no hay conexión.
    return null;
  }
}

export default async function Home() {
  const datos = await obtenerStats();
  const conectado = datos !== null;

  const stats = [
    { label: "Roles", value: datos?.usuarios ?? "—", icon: Users },
    { label: "Clientes", value: datos?.clientes ?? "—", icon: Users },
    { label: "Ubicaciones", value: datos?.ubicaciones ?? "—", icon: MapPin },
    { label: "Domicilios", value: datos?.domicilios ?? "—", icon: Bike },
  ];

  return (
    <div className="bg-white dark:bg-zinc-950">
      <Hero />

      <CifrasReales stats={stats} conectado={conectado} />

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex flex-col gap-20">
          <BloqueFuncion
            eyebrow="Lista de espera compartida"
            titulo="Nadie espera a que el Admin asigne un domicilio"
            texto="Cada pedido nuevo entra a una lista compartida — cualquier domiciliario disponible lo toma primero, en tiempo real, sin llamadas ni malentendidos sobre quién lleva qué."
            icon={Radio}
            detalle="Actualizaciones en vivo con WebSockets"
          />
          <BloqueFuncion
            eyebrow="Ubicaciones"
            titulo="Un mapa, no un par de coordenadas"
            texto="Clientes y domicilios se marcan tocando un punto en el mapa — nadie tiene que saber qué es una latitud o una longitud para usar la app."
            icon={MapPinned}
            detalle="Mapas interactivos con OpenStreetMap"
            reverso
          />
          <BloqueFuncion
            eyebrow="Inventario y compras"
            titulo="El stock se cuida solo"
            texto="Cada venta descuenta del inventario real, y las facturas de compra se pueden escanear con la cámara para no cargar todo a mano — con margen de ganancia calculado por producto."
            icon={ScanLine}
            detalle="Escaneo de facturas + control de stock"
          />
        </div>
      </section>

      <GrillaCapacidades />

      <CTAFinal />

      <footer className="border-t border-zinc-200 bg-white px-6 py-10 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
          <LogoMark className="w-28" />
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Gestión de domicilios para RIGOS DAY PIZZA — Carepa, Antioquia.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600">
            <DatabaseZap size={13} />
            MySQL + Express · Next.js
          </div>
        </div>
      </footer>
    </div>
  );
}

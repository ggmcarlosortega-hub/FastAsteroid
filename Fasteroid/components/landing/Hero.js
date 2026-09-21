import Link from "next/link";
import { LogIn, MapPin, Radio, Bike, TrendingUp } from "lucide-react";
import LogoMark from "../LogoMark";

const BADGES = [
  { icon: Radio, texto: "Tiempo real" },
  { icon: MapPin, texto: "Mapas interactivos" },
  { icon: Bike, texto: "Hecho en Carepa, Antioquia" },
];

// Misma paleta de marca que ya usa /login (#eeebe8 claro / #1c1917 oscuro,
// acento #a9787d) — la landing y el login comparten identidad visual.
// Estructura tomada de brevo.com/es (titular + bajada + CTA a la izquierda,
// composición de tarjetas de producto a la derecha), colores propios.
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#eeebe8] pb-24 pt-8 dark:bg-[#1c1917]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <LogoMark className="w-36" />
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1c1917] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#312d2a] dark:bg-white dark:text-[#1c1917] dark:hover:bg-zinc-200"
        >
          <LogIn size={15} />
          Iniciar sesión
        </Link>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-12 px-6 md:mt-20 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#1c1917] dark:text-white sm:text-5xl">
            Cada domicilio, bajo control en tiempo real
          </h1>
          <p className="mt-5 max-w-md text-base text-zinc-600 dark:text-zinc-400">
            Fasteroid organiza pedidos, ubicaciones, inventario y el
            mantenimiento del vehículo de RIGOS DAY PIZZA en un solo lugar —
            todo actualizado al instante para Admin y domiciliarios.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#a9787d] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#8f6266]"
          >
            <LogIn size={16} />
            Iniciar sesión
          </Link>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
            {BADGES.map(({ icon: Icon, texto }) => (
              <span
                key={texto}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"
              >
                <Icon size={13} className="text-[#a9787d]" />
                {texto}
              </span>
            ))}
          </div>
        </div>

        {/* Composición de tarjetas — ilustrativa, no son capturas reales (no
            correspondería mostrar datos de un negocio real en una landing
            pública), inspirada en el collage de producto de brevo.com/es. */}
        <div className="relative hidden h-80 md:block">
          <div className="absolute left-0 top-0 w-56 -rotate-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                En curso
              </span>
              <span className="text-[10px] text-zinc-400">Espacio 3</span>
            </div>
            <p className="mt-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Casa con rejas negras
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <MapPin size={11} />
              Calle 70, Carepa
            </p>
          </div>

          <div className="absolute right-2 top-16 w-40 rotate-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="h-20 w-full overflow-hidden rounded-lg bg-[#dfe7d8]">
              <div className="h-full w-full opacity-70" style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0,0,0,0.06) 8px, rgba(0,0,0,0.06) 9px), repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.06) 8px, rgba(0,0,0,0.06) 9px)",
              }} />
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-200">
              <MapPin size={12} className="text-[#a9787d]" />
              Ubicación en vivo
            </div>
          </div>

          <div className="absolute bottom-0 left-16 w-48 rotate-1 rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <TrendingUp size={13} />
              Neto del mes
            </p>
            <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-500">
              +$266.000
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import {
  Rocket,
  DatabaseZap,
  Users,
  MapPin,
  Bike,
  CheckCircle2,
  XCircle,
  LogIn,
} from "lucide-react";

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
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-20 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
          <Rocket size={32} />
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Fasteroid
        </h1>
        <p className="mt-2 max-w-md text-zinc-500 dark:text-zinc-400">
          Gestión de domicilios en Carepa — clientes, ubicaciones, entregas y
          mantenimiento del vehículo en un solo lugar.
        </p>

        {conectado ? (
          <div className="mt-6 flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 size={16} />
            Backend y base de datos conectados
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle size={16} />
            No se pudo conectar con el backend
          </div>
        )}

        {/* Tarjetas de conteo (usuarios/clientes/ubicaciones/domicilios) — solo
            demuestran que la base de datos responde, no son datos de negocio
            reales para nadie que no sea desarrollador. */}
        <div className="mt-10 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Icon className="text-orange-500" size={20} />
              <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {value}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {label}
              </span>
            </div>
          ))}
        </div>

        <Link
          href="/login"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <LogIn size={16} />
          Iniciar sesión
        </Link>

        <div className="mt-6 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600">
          <DatabaseZap size={14} />
          MySQL + Express · Next.js
        </div>
      </div>
    </div>
  );
}

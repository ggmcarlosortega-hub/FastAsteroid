import Link from "next/link";
import {
  Rocket,
  DatabaseZap,
  Users,
  MapPin,
  Bike,
  CheckCircle2,
  LogIn,
} from "lucide-react";
import { prisma } from "../lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [usuarios, clientes, ubicaciones, domicilios] = await Promise.all([
    prisma.usuario.count(),
    prisma.cliente.count(),
    prisma.ubicacion.count(),
    prisma.domicilio.count(),
  ]);

  const stats = [
    { label: "Roles", value: usuarios, icon: Users },
    { label: "Clientes", value: clientes, icon: Users },
    { label: "Ubicaciones", value: ubicaciones, icon: MapPin },
    { label: "Domicilios", value: domicilios, icon: Bike },
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

        <div className="mt-6 flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 size={16} />
          Backend y base de datos conectados
        </div>

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
          SQLite + Prisma · Next.js
        </div>
      </div>
    </div>
  );
}

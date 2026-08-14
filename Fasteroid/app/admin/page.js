import Link from "next/link";
import { Users, Bike, ArrowRight } from "lucide-react";

const ACCESOS = [
  {
    href: "/admin/clientes",
    icon: Users,
    titulo: "Clientes",
    descripcion: "Alta, edición y ubicaciones",
  },
  {
    href: "/admin/domicilios",
    icon: Bike,
    titulo: "Domicilios",
    descripcion: "En curso, historial y asignación",
  },
];

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Panel Admin
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        El dashboard con métricas mensuales llega en el Bloque 4 del backlog.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {ACCESOS.map(({ href, icon: Icon, titulo, descripcion }) => (
          <Link
            key={href}
            href={href}
            className="flex w-fit items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4 transition-colors hover:border-orange-300 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <Icon size={18} />
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{titulo}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{descripcion}</p>
            </div>
            <ArrowRight size={16} className="ml-4 text-zinc-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}

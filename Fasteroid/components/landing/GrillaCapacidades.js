import { Bike, Users, Boxes, Wrench, LayoutDashboard, MapPinned } from "lucide-react";

// Espejo directo de las secciones reales del panel Admin — mismo patrón que
// la fila de canales ("Email marketing", "SMS marketing"...) de
// brevo.com/es, con las capacidades propias de Fasteroid.
const CAPACIDADES = [
  { icon: Bike, label: "Domicilios" },
  { icon: Users, label: "Clientes" },
  { icon: Boxes, label: "Inventario" },
  { icon: Wrench, label: "Mantenimiento" },
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: MapPinned, label: "Municipios" },
];

export default function GrillaCapacidades() {
  return (
    <section className="bg-white px-6 py-20 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold text-[#1c1917] dark:text-white sm:text-3xl">
          Todo lo que el negocio necesita, en un solo panel
        </h2>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {CAPACIDADES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f6f3f1] text-[#a9787d] dark:bg-zinc-800">
                <Icon size={20} />
              </div>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

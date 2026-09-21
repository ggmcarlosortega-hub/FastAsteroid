import { CheckCircle2, XCircle } from "lucide-react";

// Mismos datos que ya traía la landing vieja (obtenerStats() en page.js, sin
// cambios) — presentados como una franja de cifras grandes en vez de 4
// cajitas chicas (inspirado en el "Más de 600.000 clientes..." de
// brevo.com/es), con números reales de esta base, no inventados.
export default function CifrasReales({ stats, conectado }) {
  return (
    <section className="border-b border-zinc-200 bg-white px-6 py-14 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl text-center">
        <p
          className={`flex items-center justify-center gap-1.5 text-xs font-medium ${
            conectado ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
          }`}
        >
          {conectado ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
          {conectado ? "Datos en vivo de esta operación" : "No se pudo conectar con el backend"}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <Icon size={18} className="text-[#a9787d]" />
              <span className="text-3xl font-bold text-[#1c1917] dark:text-white sm:text-4xl">
                {value}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

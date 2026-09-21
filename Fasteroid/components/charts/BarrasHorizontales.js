"use client";

// Desglose categórico chico (2-4 categorías) — mismo patrón visual que `Barra`
// dentro de GananciasPerdidas.js, generalizado a N categorías con ícono propio en
// vez de las 2 fijas (ganancias/pérdidas). Se usa tanto en pantalla como en el PDF
// (Exportar PDF es window.print() sobre lo que ya está en pantalla).
//
// items: [{ label, valor, color: "bg-*-500", icon: LucideIcon }]
function formatoDefault(valor) {
  return valor.toLocaleString("es-CO");
}

export default function BarrasHorizontales({ titulo, icon: TituloIcon, items, formato = formatoDefault }) {
  const max = Math.max(...items.map((i) => i.valor), 1);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        {TituloIcon && <TituloIcon size={13} />}
        {titulo}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {items.map(({ label, valor, color, icon: Icon }) => {
          const pct = max > 0 ? Math.max((valor / max) * 100, valor > 0 ? 3 : 0) : 0;
          return (
            <div key={label}>
              {/* Ícono + nombre siempre visibles junto al valor — el color solo
                  refuerza, nunca es la única forma de distinguir una categoría de
                  otra (ver nota de paleta del plan). */}
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  {Icon && <Icon size={13} />}
                  {label}
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{formato(valor)}</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                <div className={`h-full rounded-r ${color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

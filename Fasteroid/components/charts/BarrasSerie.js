"use client";

// Serie temporal/secuencial en barras verticales — mismo estilo de "divs con
// porcentaje" que el resto de gráficos del proyecto (GananciasPerdidas.js,
// DesglosePago.js), sin SVG ni librería. Con pocos puntos se etiqueta el valor
// sobre cada barra; con muchos, solo el eje X en unos pocos (primero, último y
// algunos del medio) para no saturar — nunca un número por punto.
//
// items: [{ label, valor }]
function formatoDefault(valor) {
  return valor.toLocaleString("es-CO");
}

const MAX_ETIQUETAS_VALOR = 8;
const MAX_TICKS_EJE = 6;

export default function BarrasSerie({ titulo, icon: TituloIcon, items, color = "bg-orange-500", formato = formatoDefault }) {
  const max = Math.max(...items.map((i) => i.valor), 1);
  const mostrarValores = items.length <= MAX_ETIQUETAS_VALOR;

  // Índices del eje X a etiquetar: siempre el primero y el último, repartiendo el
  // resto lo más parejo posible hasta MAX_TICKS_EJE en total.
  const ticks = new Set();
  if (items.length > 0) {
    const paso = Math.max(1, Math.ceil((items.length - 1) / (MAX_TICKS_EJE - 1)));
    for (let i = 0; i < items.length; i += paso) ticks.add(i);
    ticks.add(items.length - 1);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        {TituloIcon && <TituloIcon size={13} />}
        {titulo}
      </p>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-400">Sin datos en este período.</p>
      ) : (
        <>
          <div className="mt-4 flex h-28 items-end gap-0.5">
            {items.map(({ label, valor }, i) => {
              const pct = max > 0 ? Math.max((valor / max) * 100, valor > 0 ? 4 : 0) : 0;
              return (
                <div key={`${label}-${i}`} className="flex h-full flex-1 flex-col items-center justify-end">
                  {mostrarValores && (
                    <span className="mb-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">{formato(valor)}</span>
                  )}
                  <div
                    className={`w-full rounded-t ${color}`}
                    style={{ height: `${pct}%`, minHeight: valor > 0 ? "2px" : 0 }}
                    title={`${label}: ${formato(valor)}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex gap-0.5">
            {items.map(({ label }, i) => (
              <div key={`${label}-${i}`} className="flex-1 text-center text-[10px] text-zinc-400">
                {ticks.has(i) ? label : ""}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

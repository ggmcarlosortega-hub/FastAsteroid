"use client";

// Comparativa mensual (ganancias vs. pérdidas) en barras agrupadas — mismo
// estilo "divs con % de altura" que BarrasSerie.js, sin SVG ni librería, pero
// con dos series por punto en vez de una y cada mes clicable. Cada mes
// seleccionado reusa el mismo `mes` del selector de DashboardPage.js en vez
// de abrir un modal aparte: todo lo que ya se muestra debajo (Ganancias/
// Pérdidas, tiles) ya funciona como "el detalle" del mes elegido.
//
// serie: [{ mes: "2026-04", nombreMes: "Abr", ganancias, perdidas }]
function formatoCOP(valor) {
  if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)}M`;
  if (valor >= 1000) return `$${(valor / 1000).toFixed(0)}K`;
  return `$${valor}`;
}

export default function BarrasComparativas({ serie, mesSeleccionado, onSelect }) {
  if (!serie || serie.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-400">Sin datos para comparar todavía.</p>
      </div>
    );
  }

  const max = Math.max(...serie.flatMap((p) => [p.ganancias, p.perdidas]), 1);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Comparativa mensual: ganancias vs. pérdidas</p>
        <div className="flex items-center gap-3 text-[10px] text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-green-600" /> Ganancias
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-red-500" /> Pérdidas
          </span>
        </div>
      </div>

      <div className="mt-4 flex h-32 items-end gap-2">
        {serie.map((punto) => {
          const pctGanancias = Math.max((punto.ganancias / max) * 100, punto.ganancias > 0 ? 3 : 0);
          const pctPerdidas = Math.max((punto.perdidas / max) * 100, punto.perdidas > 0 ? 3 : 0);
          const seleccionado = punto.mes === mesSeleccionado;
          return (
            <button
              key={punto.mes}
              type="button"
              onClick={() => onSelect(punto.mes)}
              className={`flex h-full flex-1 flex-col items-center justify-end gap-1 rounded-lg px-1 pt-1 transition-colors ${
                seleccionado ? "bg-[#a9787d]/10 dark:bg-[#a9787d]/15" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              }`}
              title={`${punto.nombreMes}: ganancias ${formatoCOP(punto.ganancias)}, pérdidas ${formatoCOP(punto.perdidas)}`}
            >
              <div className="flex h-full w-full items-end justify-center gap-0.5">
                <div
                  className="w-full max-w-3 rounded-t bg-green-600"
                  style={{ height: `${pctGanancias}%`, minHeight: punto.ganancias > 0 ? "2px" : 0 }}
                />
                <div
                  className="w-full max-w-3 rounded-t bg-red-500"
                  style={{ height: `${pctPerdidas}%`, minHeight: punto.perdidas > 0 ? "2px" : 0 }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-1 flex gap-2">
        {serie.map((punto) => (
          <span
            key={punto.mes}
            className={`flex-1 text-center text-[10px] ${
              punto.mes === mesSeleccionado
                ? "font-semibold text-[#a9787d] dark:text-[#c99a9e]"
                : "text-zinc-400"
            }`}
          >
            {punto.nombreMes}
          </span>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-zinc-400">Toca un mes para ver su detalle abajo</p>
    </div>
  );
}

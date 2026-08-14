"use client";

import { TrendingUp } from "lucide-react";

function formatoCOP(valor) {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}

function Barra({ label, valor, max, colorClase, pistaClase }) {
  const pct = max > 0 ? Math.max((valor / max) * 100, valor > 0 ? 3 : 0) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-zinc-600 dark:text-zinc-300">{label}</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{formatoCOP(valor)}</span>
      </div>
      <div className={`h-5 w-full overflow-hidden rounded ${pistaClase}`}>
        <div className={`h-full rounded-r ${colorClase}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Ganancias = suma de `precio` de domicilios Entregados; Pérdidas = suma de
// `precio` de domicilios Cancelados, para el período seleccionado. `precio` se
// fija al crear el domicilio (independiente del desenlace), así que ambas cifras
// son reales, no estimadas — ver sección 24 del documento unificado.
export default function GananciasPerdidas({ ganancias, perdidas }) {
  const neto = ganancias - perdidas;
  const max = Math.max(ganancias, perdidas, 1);
  const esPositivo = neto >= 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <TrendingUp size={13} />
          Neto del período
        </p>
      </div>
      <p
        className={`mt-1 text-4xl font-semibold ${
          esPositivo ? "text-green-700 dark:text-green-500" : "text-red-700 dark:text-red-500"
        }`}
      >
        {esPositivo ? "+" : "−"}
        {formatoCOP(Math.abs(neto))}
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <Barra
          label="Ganancias (entregados)"
          valor={ganancias}
          max={max}
          colorClase="bg-green-600"
          pistaClase="bg-green-50 dark:bg-green-950/40"
        />
        <Barra
          label="Pérdidas (cancelados)"
          valor={perdidas}
          max={max}
          colorClase="bg-red-600"
          pistaClase="bg-red-50 dark:bg-red-950/40"
        />
      </div>
    </div>
  );
}

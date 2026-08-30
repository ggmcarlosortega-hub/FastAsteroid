"use client";

import { Wallet } from "lucide-react";

function formatoCOP(valor) {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}

// Colores propios para efectivo/transferencia — ámbar y azul, distintos del
// verde (ganancias) / rojo (pérdidas) de GananciasPerdidas.js y del naranja de
// marca, para que un vistazo rápido no los confunda entre sí.
const COLOR_EFECTIVO = "bg-amber-500";
const COLOR_TRANSFERENCIA = "bg-blue-500";

// Un solo componente para los dos usos pedidos: la barra de progreso del
// domiciliario (día actual) y el desglose del Admin (período elegido, general
// y por cada domiciliario con compact=true).
export default function DesglosePago({
  efectivo,
  transferencia,
  compact = false,
  titulo = "Efectivo vs. transferencia",
}) {
  const total = efectivo + transferencia;
  const pctEfectivo = total > 0 ? (efectivo / total) * 100 : 0;
  const pctTransferencia = total > 0 ? (transferencia / total) * 100 : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          {pctEfectivo > 0 && <div className={`h-full ${COLOR_EFECTIVO}`} style={{ width: `${pctEfectivo}%` }} />}
          {pctTransferencia > 0 && (
            <div className={`h-full ${COLOR_TRANSFERENCIA}`} style={{ width: `${pctTransferencia}%` }} />
          )}
        </div>
        <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{formatoCOP(total)}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <Wallet size={13} />
        {titulo}
      </p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{formatoCOP(total)}</p>

      {/* Barra de progreso segmentada: un solo tramo ámbar (efectivo) y uno azul
          (transferencia), proporcional a cuánto fue de cada uno. */}
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {pctEfectivo > 0 && <div className={`h-full ${COLOR_EFECTIVO}`} style={{ width: `${pctEfectivo}%` }} />}
        {pctTransferencia > 0 && (
          <div className={`h-full ${COLOR_TRANSFERENCIA}`} style={{ width: `${pctTransferencia}%` }} />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
        <span className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${COLOR_EFECTIVO}`} />
          <span className="text-zinc-600 dark:text-zinc-300">Efectivo</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{formatoCOP(efectivo)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${COLOR_TRANSFERENCIA}`} />
          <span className="text-zinc-600 dark:text-zinc-300">Transferencia</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{formatoCOP(transferencia)}</span>
        </span>
      </div>
    </div>
  );
}

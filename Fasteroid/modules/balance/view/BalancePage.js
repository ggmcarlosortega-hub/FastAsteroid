"use client";

import { useBalance } from "../logic/useBalance";
import ErrorReintentar from "../../../components/ErrorReintentar";

function formatoCOP(valor) {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}

function Tarjeta({ titulo, valor, detalle, tono }) {
  const color =
    tono === "ingreso"
      ? "text-green-600 dark:text-green-400"
      : tono === "egreso"
        ? "text-red-600 dark:text-red-400"
        : "text-zinc-900 dark:text-zinc-50";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{titulo}</p>
      <p className={`mt-1 text-xl font-semibold ${color}`}>{valor}</p>
      {detalle && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{detalle}</p>}
    </div>
  );
}

export default function BalancePage() {
  const { rango, setRango, balance, loading, error, reintentar } = useBalance();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Balance</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Ingresos de domicilios entregados menos compras de inventario y gastos de mantenimiento.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="text-sm text-zinc-600 dark:text-zinc-300">
          Desde{" "}
          <input
            type="date"
            value={rango.desde}
            onChange={(e) => setRango({ ...rango, desde: e.target.value })}
            className="rounded-lg border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <label className="text-sm text-zinc-600 dark:text-zinc-300">
          Hasta{" "}
          <input
            type="date"
            value={rango.hasta}
            onChange={(e) => setRango({ ...rango, hasta: e.target.value })}
            className="rounded-lg border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
      </div>

      {loading && <p className="mt-6 text-center text-sm text-zinc-400">Cargando...</p>}
      {!loading && error && <ErrorReintentar mensaje={error} onReintentar={reintentar} />}

      {!loading && !error && balance && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tarjeta
              titulo="Ingresos"
              valor={formatoCOP(balance.ingresos.total)}
              detalle={`${balance.ingresos.domicilios} domicilios entregados`}
              tono="ingreso"
            />
            <Tarjeta
              titulo="Egresos"
              valor={formatoCOP(balance.egresos.total)}
              detalle={`Compras ${formatoCOP(balance.egresos.compras)} · Mantenimiento ${formatoCOP(balance.egresos.mantenimiento)}`}
              tono="egreso"
            />
            <Tarjeta titulo="Saldo" valor={formatoCOP(balance.saldo)} tono={balance.saldo >= 0 ? "ingreso" : "egreso"} />
            <Tarjeta
              titulo="Cobrado"
              valor={formatoCOP(balance.ingresos.efectivo + balance.ingresos.transferencia)}
              detalle={`Efectivo ${formatoCOP(balance.ingresos.efectivo)} · Transferencia ${formatoCOP(balance.ingresos.transferencia)}`}
            />
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="px-4 py-3 font-medium">Día</th>
                  <th className="px-4 py-3 text-right font-medium">Ingresos</th>
                  <th className="px-4 py-3 text-right font-medium">Egresos</th>
                  <th className="px-4 py-3 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {balance.porDia
                  .filter((d) => d.ingresos > 0 || d.egresos > 0)
                  .map((d) => (
                    <tr key={d.fecha}>
                      <td className="px-4 py-2 text-zinc-900 dark:text-zinc-50">{d.fecha}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                        {formatoCOP(d.ingresos)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                        {formatoCOP(d.egresos)}
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-semibold tabular-nums ${
                          d.saldo >= 0 ? "text-zinc-900 dark:text-zinc-50" : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatoCOP(d.saldo)}
                      </td>
                    </tr>
                  ))}
                {balance.porDia.every((d) => d.ingresos === 0 && d.egresos === 0) && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-sm text-zinc-400">
                      No hay movimientos en este rango.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

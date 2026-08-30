"use client";

import { Box } from "lucide-react";

// El baúl físico tiene 3 secciones con 3 espacios cada una (ver imagenes/Baul.png)
// — 9 espacios en total. El identificador que se guarda es un número plano 1-9
// (mismo campo espacio_baul de siempre, sin cambiar su forma), pero la grilla se
// agrupa visualmente en 3 filas de 3 para que se vea igual al baúl real.
export const ESPACIOS_VALIDOS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const SECCIONES = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

export default function EspacioBaulSelector({ espaciosOcupados, value, onChange, error }) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <Box size={14} />
        Espacio del baúl
      </label>
      <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-300 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800/50">
        {SECCIONES.map((seccion, i) => (
          <div key={i} className="flex gap-1.5">
            {seccion.map((espacio) => {
              const ocupado = espaciosOcupados.includes(espacio);
              const seleccionado = value === espacio;
              return (
                <button
                  key={espacio}
                  type="button"
                  disabled={ocupado}
                  onClick={() => onChange(espacio)}
                  // 3 estados visuales de cada casilla: ocupada (gris, no se puede
                  // tocar), elegida (naranja sólido), libre (blanca/oscura normal).
                  className={`flex flex-1 items-center justify-center rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                    ocupado
                      ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-700"
                      : seleccionado
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-zinc-300 bg-white text-zinc-700 hover:border-orange-300 active:bg-orange-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-orange-700 dark:active:bg-orange-900/20"
                  }`}
                >
                  {espacio}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

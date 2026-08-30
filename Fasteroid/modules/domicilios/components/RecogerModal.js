"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import EspacioBaulSelector from "./EspacioBaulSelector";
import MySwal from "../../../lib/swal";

// Modal de un solo paso: cuando el Admin le asigna un domicilio a un
// domiciliario, este lo "recoge" acá y recién ahí elige el espacio del baúl
// (antes de recoger, el domicilio no tiene espacio asignado — ver sección 4).
function RecogerFormContent({ espaciosOcupados, ubicacionRecogida, onSaved }) {
  const [espacio, setEspacio] = useState(null);
  const [error, setError] = useState(null);

  function onSubmit(e) {
    e.preventDefault();
    if (!espacio) {
      setError("Obligatorio");
      return;
    }
    onSaved({ espacio_baul: espacio, ubicacion_recogida: ubicacionRecogida });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 text-left">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Elige en qué espacio del baúl llevas este domicilio.
      </p>

      <EspacioBaulSelector
        espaciosOcupados={espaciosOcupados}
        value={espacio}
        onChange={(e) => {
          setEspacio(e);
          setError(null);
        }}
        error={error}
      />

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => MySwal.close()}
          className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Save size={15} />
          Recoger domicilio
        </button>
      </div>
    </form>
  );
}

export function openRecogerModal(espaciosOcupados, ubicacionRecogida) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Recoger domicilio",
      html: (
        <RecogerFormContent
          espaciosOcupados={espaciosOcupados}
          ubicacionRecogida={ubicacionRecogida}
          onSaved={(data) => {
            resolved = true;
            resolve(data);
            MySwal.close();
          }}
        />
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: 380,
      didClose: () => {
        if (!resolved) resolve(null);
      },
    });
  });
}

"use client";

import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Box, Save } from "lucide-react";

const MySwal = withReactContent(Swal);

function RecogerFormContent({ espaciosOcupados, onSaved }) {
  const espaciosLibres = [1, 2, 3].filter((e) => !espaciosOcupados.includes(e));
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { espacio_baul: "" } });

  function onSubmit(values) {
    onSaved({ espacio_baul: Number(values.espacio_baul) });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Elige en qué espacio del baúl llevas este domicilio.
      </p>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Box size={14} />
          Espacio del baúl
        </label>
        <select
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("espacio_baul", { required: "Obligatorio" })}
        >
          <option value="">Selecciona un espacio libre</option>
          {espaciosLibres.map((e) => (
            <option key={e} value={e}>
              Espacio {e}
            </option>
          ))}
        </select>
        {errors.espacio_baul && (
          <p className="mt-1 text-xs text-red-500">{errors.espacio_baul.message}</p>
        )}
      </div>

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
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Save size={15} />
          Recoger domicilio
        </button>
      </div>
    </form>
  );
}

export function openRecogerModal(espaciosOcupados) {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Recoger domicilio",
      html: (
        <RecogerFormContent
          espaciosOcupados={espaciosOcupados}
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

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { UserPlus, Phone, Lock, Eye, EyeOff, Save } from "lucide-react";
import MySwal from "../../../lib/swal";

// Crea la cuenta de un domiciliario nuevo — antes de esto la única forma de
// meter un usuario era db/seed.js. El teléfono es el usuario para iniciar
// sesión (mismo campo que /login), así que debe ser el mismo que usará esa
// persona para entrar.
function DomiciliarioFormContent({ onSaved }) {
  const [serverError, setServerError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { nombre: "", telefono: "", password: "" } });

  async function onSubmit(values) {
    setServerError(null);
    const res = await fetch("/api/domiciliarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();

    if (!res.ok) {
      setServerError(data.error ?? "No se pudo crear el domiciliario");
      return;
    }

    onSaved(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <UserPlus size={14} />
          Nombre
        </label>
        <input
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("nombre", { required: "El nombre es obligatorio" })}
        />
        {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Phone size={14} />
          Teléfono (con esto inicia sesión)
        </label>
        <input
          type="tel"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
          {...register("telefono", { required: "El teléfono es obligatorio" })}
        />
        {errors.telefono && <p className="mt-1 text-xs text-red-500">{errors.telefono.message}</p>}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Lock size={14} />
          Contraseña
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 dark:border-zinc-700 dark:bg-zinc-800">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full bg-transparent text-sm outline-none"
            {...register("password", {
              required: "La contraseña es obligatoria",
              minLength: { value: 6, message: "Debe tener al menos 6 caracteres" },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

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
          Crear domiciliario
        </button>
      </div>
    </form>
  );
}

export function openDomiciliarioFormModal() {
  return new Promise((resolve) => {
    let resolved = false;
    MySwal.fire({
      title: "Nuevo domiciliario",
      html: (
        <DomiciliarioFormContent
          onSaved={(data) => {
            resolved = true;
            resolve(data);
            MySwal.close();
          }}
        />
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: 420,
      didClose: () => {
        if (!resolved) resolve(null);
      },
    });
  });
}

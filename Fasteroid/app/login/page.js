"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Swal from "../../lib/swal";
import LogoMark from "../../components/LogoMark";
import {
  Phone,
  Lock,
  LogIn,
  Loader2,
  Eye,
  EyeOff,
  Bike,
  TrendingUp,
  ClipboardList,
  MapPinned,
} from "lucide-react";

const FEATURES = [
  {
    numero: "01",
    icon: TrendingUp,
    titulo: "Ventas",
    texto: "Analiza el comportamiento de tus ventas.",
  },
  {
    numero: "02",
    icon: ClipboardList,
    titulo: "Pedidos",
    texto: "Controla y organiza todos tus pedidos.",
  },
  {
    numero: "03",
    icon: MapPinned,
    titulo: "Distribución",
    texto: "Optimiza tus rutas y entregas.",
  },
];

function WaveDecoration({ className }) {
  return (
    <svg
      viewBox="0 0 400 120"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M0,70 C100,120 300,10 400,60 L400,120 L0,120 Z" fill="currentColor" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { telefono: "", password: "" } });

  async function onSubmit(values) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();

    if (!res.ok) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo iniciar sesión",
        text: data.error ?? "Inténtalo de nuevo",
        confirmButtonColor: "#a9787d",
      });
      return;
    }

    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `Bienvenido, ${data.nombre}`,
      timer: 1200,
      showConfirmButton: false,
    });

    router.push(data.rol === "Admin" ? "/admin" : "/domiciliario");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eeebe8] px-4 py-10 dark:bg-black lg:px-8">
      <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-zinc-900 dark:shadow-none lg:max-w-4xl lg:flex-row lg:shadow-xl">
        {/* Panel izquierdo — solo desktop: historia de marca */}
        <div className="relative hidden overflow-hidden bg-[#1c1917] px-10 py-12 text-white lg:flex lg:w-1/2 lg:flex-col lg:justify-between">
          <Bike
            size={340}
            className="pointer-events-none absolute -bottom-16 -left-20 -rotate-12 text-white/5"
            aria-hidden="true"
          />

          <div className="relative">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#c99a9e]">
              BIENVENIDO A
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">FASTEROID</h1>
            <p className="mt-1 text-sm font-medium tracking-wide text-[#c99a9e]">
              EL MOTOR DE TUS PEDIDOS.
            </p>
            <div className="mt-4 h-px w-10 bg-white/20" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Gestiona tus pedidos, analiza tus ventas y optimiza tu distribución. Todo lo que
              necesitas para mover tu operación más rápido y tomar mejores decisiones.
            </p>
          </div>

          <div className="relative mt-10 grid grid-cols-3 gap-4">
            {FEATURES.map(({ numero, icon: Icon, titulo, texto }) => (
              <div key={numero}>
                <p className="text-[11px] font-semibold text-white/40">{numero}</p>
                <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#e3b6ba]">
                  <Icon size={16} />
                </div>
                <p className="mt-2 text-xs font-semibold">{titulo}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-white/50">{texto}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho — formulario, visible en todos los tamaños */}
        <div className="relative flex flex-col items-center px-6 py-10 sm:px-10 lg:w-1/2 lg:justify-center lg:px-14">
          <WaveDecoration className="pointer-events-none absolute inset-x-0 top-0 h-24 w-full text-[#f2ecec] dark:text-zinc-800/60 lg:hidden" />

          <div className="relative flex flex-col items-center text-center">
            <LogoMark />
            <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">
              Inicia sesión para continuar
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="relative mt-8 flex w-full max-w-xs flex-col gap-4"
          >
            <div>
              <div className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 focus-within:border-[#a9787d] focus-within:ring-1 focus-within:ring-[#a9787d] dark:border-zinc-700 dark:bg-zinc-800">
                <Phone size={16} className="shrink-0 text-zinc-400" />
                <input
                  type="tel"
                  autoComplete="username"
                  placeholder="Ingresa tu número de teléfono"
                  aria-label="Teléfono"
                  className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
                  {...register("telefono", { required: "El teléfono es obligatorio" })}
                />
              </div>
              {errors.telefono && (
                <p className="mt-1 pl-4 text-xs text-red-500">{errors.telefono.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 focus-within:border-[#a9787d] focus-within:ring-1 focus-within:ring-[#a9787d] dark:border-zinc-700 dark:bg-zinc-800">
                <Lock size={16} className="shrink-0 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  aria-label="Contraseña"
                  className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
                  {...register("password", { required: "La contraseña es obligatoria" })}
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
              {errors.password && (
                <p className="mt-1 pl-4 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#a9787d] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8f6266] disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              Iniciar sesión
            </button>
          </form>

          <div className="relative mt-8 flex items-center gap-1.5 lg:hidden" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

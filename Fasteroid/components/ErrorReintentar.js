"use client";

// Banner de error + botón reintentar — mismo patrón que ya se probó en
// DashboardPage.js para el caso en que un fetch falla (backend caído,
// sesión vencida, cold-start del backend gratuito en producción) y antes
// dejaba la pantalla en "Cargando..." para siempre. Componente compartido
// porque este mismo bloque se repite igual en varias pantallas.
export default function ErrorReintentar({ mensaje, onReintentar }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center dark:border-red-900/50 dark:bg-red-900/20">
      <p className="text-sm text-red-700 dark:text-red-300">{mensaje}</p>
      <button
        type="button"
        onClick={onReintentar}
        className="mt-1 rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Reintentar
      </button>
    </div>
  );
}

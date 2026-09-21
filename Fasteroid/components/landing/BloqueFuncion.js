// Bloque texto+visual alternado — mismo patrón que la sección "Diseñado para
// crecer contigo" de brevo.com/es (eyebrow + título + texto a un lado, un
// visual del otro, alternando de lado en cada bloque), con contenido propio:
// funciones reales de Fasteroid, sin capturas de datos de negocio reales.
export default function BloqueFuncion({ eyebrow, titulo, texto, icon: Icon, detalle, reverso = false }) {
  return (
    <div
      className={`flex flex-col items-center gap-10 md:flex-row md:gap-16 ${
        reverso ? "md:flex-row-reverse" : ""
      }`}
    >
      <div className="flex-1">
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl border border-zinc-200 bg-[#f6f3f1] dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col items-center gap-3 px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#a9787d] text-white shadow-lg shadow-[#a9787d]/30">
              <Icon size={28} />
            </div>
            {detalle && (
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{detalle}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#a9787d]">
          {eyebrow}
        </p>
        <h3 className="mt-2 text-2xl font-bold text-[#1c1917] dark:text-white sm:text-3xl">
          {titulo}
        </h3>
        <p className="mt-3 max-w-md text-zinc-600 dark:text-zinc-400">{texto}</p>
      </div>
    </div>
  );
}

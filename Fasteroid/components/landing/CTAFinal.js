import Link from "next/link";
import { LogIn } from "lucide-react";

// Misma paleta del hero — banda de cierre, mismo patrón que el CTA final de
// brevo.com/es ("Suscríbete gratis" / "Pide una demo"), adaptado a que acá
// solo hay un camino posible: iniciar sesión.
export default function CTAFinal() {
  return (
    <section className="bg-[#eeebe8] px-6 py-20 text-center dark:bg-[#1c1917]">
      <h2 className="text-2xl font-bold text-[#1c1917] dark:text-white sm:text-3xl">
        ¿Listo para gestionar tus domicilios?
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
        Entra con tu teléfono y contraseña de Admin o Domiciliario.
      </p>
      <Link
        href="/login"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#a9787d] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#8f6266]"
      >
        <LogIn size={16} />
        Iniciar sesión
      </Link>
    </section>
  );
}

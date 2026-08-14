import { getSession } from "../../lib/auth";
import DomiciliarioHeader from "../../components/DomiciliarioHeader";

export default async function DomiciliarioLayout({ children }) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <DomiciliarioHeader nombre={session.nombre} />
      <main className="mx-auto max-w-2xl px-6 py-8">{children}</main>
    </div>
  );
}

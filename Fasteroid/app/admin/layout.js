import { getSession } from "../../lib/auth";
import AdminHeader from "../../components/AdminHeader";

export default async function AdminLayout({ children }) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <AdminHeader nombre={session.nombre} />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}

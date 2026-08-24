"use client";

import AdminHeader from "../../components/AdminHeader";
import { useSesion } from "../../lib/useSesion";

export default function AdminLayout({ children }) {
  const { session, loading } = useSesion("Admin");

  if (loading || !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <AdminHeader nombre={session.nombre} />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}

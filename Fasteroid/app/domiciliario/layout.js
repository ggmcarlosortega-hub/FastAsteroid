"use client";

import DomiciliarioHeader from "../../components/DomiciliarioHeader";
import { useSesion } from "../../lib/useSesion";

export default function DomiciliarioLayout({ children }) {
  const { session, loading } = useSesion("Domiciliario");

  if (loading || !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <DomiciliarioHeader nombre={session.nombre} />
      <main className="mx-auto max-w-2xl px-6 py-8">{children}</main>
    </div>
  );
}

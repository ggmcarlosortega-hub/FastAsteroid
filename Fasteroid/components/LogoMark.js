"use client";

import Image from "next/image";

// Dos variantes del logo (fondo claro / fondo oscuro): se alterna con `dark:`
// según el modo de color del sistema del usuario, igual que el resto de la
// app. Extraído de login/page.js para reutilizarlo también en la landing.
export default function LogoMark({ className = "w-52" }) {
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: "788 / 317" }}>
      <Image
        src="/fasteroid-negro.png"
        alt="Fasteroid"
        fill
        priority
        className="object-contain dark:hidden"
      />
      <Image
        src="/fasteroid-blanco.png"
        alt="Fasteroid"
        fill
        priority
        className="hidden object-contain dark:block"
      />
    </div>
  );
}

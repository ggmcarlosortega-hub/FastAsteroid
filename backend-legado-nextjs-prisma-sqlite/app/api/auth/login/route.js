import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { setSessionCookie } from "../../../../lib/auth";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const telefono = body?.telefono;
  const password = body?.password;

  if (!telefono || !password) {
    return NextResponse.json(
      { error: "telefono y password son obligatorios" },
      { status: 400 }
    );
  }

  const usuario = await prisma.usuario.findUnique({ where: { telefono } });
  if (!usuario) {
    return NextResponse.json(
      { error: "Teléfono o contraseña incorrectos" },
      { status: 401 }
    );
  }

  const passwordValida = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValida) {
    return NextResponse.json(
      { error: "Teléfono o contraseña incorrectos" },
      { status: 401 }
    );
  }

  await setSessionCookie({
    telefono: usuario.telefono,
    nombre: usuario.nombre,
    rol: usuario.rol,
  });

  return NextResponse.json({
    telefono: usuario.telefono,
    nombre: usuario.nombre,
    rol: usuario.rol,
  });
}

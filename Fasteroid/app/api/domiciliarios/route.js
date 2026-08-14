import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { listDomiciliarios } from "../../../modules/domicilios/logic/domicilios.service";

// Lista de usuarios con rol Domiciliario, para que el Admin elija a quién
// asignar un domicilio nuevo (sección 4 del documento unificado).
export async function GET() {
  const session = await getSession();
  if (session.rol !== "Admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return NextResponse.json(await listDomiciliarios());
}

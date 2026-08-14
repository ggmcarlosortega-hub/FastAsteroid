import { NextResponse } from "next/server";
import { getSession } from "../../../../../lib/auth";
import { toErrorResponse } from "../../../../../lib/service-error";
import { marcarEntregado } from "../../../../../modules/domicilios/logic/domicilios.service";

export async function POST(request, { params }) {
  const session = await getSession();
  if (session.rol !== "Domiciliario") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  try {
    const domicilio = await marcarEntregado(id, session.telefono, body ?? {});
    return NextResponse.json(domicilio);
  } catch (err) {
    return toErrorResponse(err);
  }
}

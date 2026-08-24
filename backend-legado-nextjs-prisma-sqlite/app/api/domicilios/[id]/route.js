import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { toErrorResponse } from "../../../../lib/service-error";
import { getDomicilio, actualizarDomicilio } from "../../../../modules/domicilios/logic/domicilios.service";

export async function GET(_request, { params }) {
  const session = await getSession();
  const { id } = await params;

  try {
    const domicilio = await getDomicilio(id, { telefono: session.telefono, rol: session.rol });
    return NextResponse.json(domicilio);
  } catch (err) {
    return toErrorResponse(err);
  }
}

// El Admin corrige el registro (ej. se equivocó en los productos seleccionados).
export async function PATCH(request, { params }) {
  const session = await getSession();
  if (session.rol !== "Admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  try {
    const domicilio = await actualizarDomicilio(id, body ?? {});
    return NextResponse.json(domicilio);
  } catch (err) {
    return toErrorResponse(err);
  }
}

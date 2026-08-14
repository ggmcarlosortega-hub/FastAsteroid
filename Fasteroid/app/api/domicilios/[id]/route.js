import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { toErrorResponse } from "../../../../lib/service-error";
import { getDomicilio } from "../../../../modules/domicilios/logic/domicilios.service";

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

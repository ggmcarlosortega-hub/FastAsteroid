import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { toErrorResponse } from "../../../../lib/service-error";
import { deleteUbicacion } from "../../../../modules/clientes/logic/clientes.service";

export async function DELETE(_request, { params }) {
  const session = await getSession();
  if (session.rol !== "Admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await deleteUbicacion(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}

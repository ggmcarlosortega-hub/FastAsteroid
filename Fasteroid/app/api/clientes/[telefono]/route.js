import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { toErrorResponse } from "../../../../lib/service-error";
import {
  getCliente,
  updateCliente,
  deleteCliente,
} from "../../../../modules/clientes/logic/clientes.service";

export async function GET(_request, { params }) {
  const { telefono } = await params;

  try {
    const cliente = await getCliente(telefono);
    return NextResponse.json(cliente);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (session.rol !== "Admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { telefono } = await params;
  const body = await request.json().catch(() => null);

  try {
    const cliente = await updateCliente(telefono, body ?? {});
    return NextResponse.json(cliente);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_request, { params }) {
  const session = await getSession();
  if (session.rol !== "Admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { telefono } = await params;

  try {
    await deleteCliente(telefono);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}

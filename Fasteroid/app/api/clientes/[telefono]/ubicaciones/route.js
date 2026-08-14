import { NextResponse } from "next/server";
import { toErrorResponse } from "../../../../../lib/service-error";
import { addUbicacion } from "../../../../../modules/clientes/logic/clientes.service";

// Admin y Domiciliario pueden agregar ubicaciones: el domiciliario guarda la
// ubicación de entrega al registrar un domicilio (sección 20 del documento).
export async function POST(request, { params }) {
  const { telefono } = await params;
  const body = await request.json().catch(() => null);

  try {
    const ubicacion = await addUbicacion(telefono, body ?? {});
    return NextResponse.json(ubicacion, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

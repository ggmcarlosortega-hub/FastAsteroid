import { NextResponse } from "next/server";
import { toErrorResponse } from "../../../lib/service-error";
import { listClientes, createCliente } from "../../../modules/clientes/logic/clientes.service";

export async function GET(request) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const clientes = await listClientes(q);
  return NextResponse.json(clientes);
}

// Admin y Domiciliario pueden crear clientes: el domiciliario registra clientes
// nuevos sobre la marcha al armar un domicilio (sección 20 del documento).
export async function POST(request) {
  const body = await request.json().catch(() => null);

  try {
    const cliente = await createCliente(body ?? {});
    return NextResponse.json(cliente, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

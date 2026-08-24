import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { toErrorResponse } from "../../../lib/service-error";
import {
  listActivos,
  listActivosTodos,
  listAsignados,
  listAsignadosTodos,
  listHistorial,
  crearDomicilio,
} from "../../../modules/domicilios/logic/domicilios.service";

export async function GET(request) {
  const session = await getSession();
  const sp = request.nextUrl.searchParams;

  if (sp.get("vista") === "activos") {
    if (session.rol === "Admin") {
      const telefono = sp.get("telefono");
      return NextResponse.json(telefono ? await listActivos(telefono) : await listActivosTodos());
    }
    return NextResponse.json(await listActivos(session.telefono));
  }

  if (sp.get("vista") === "asignados") {
    if (session.rol === "Admin") {
      const telefono = sp.get("telefono");
      return NextResponse.json(telefono ? await listAsignados(telefono) : await listAsignadosTodos());
    }
    return NextResponse.json(await listAsignados(session.telefono));
  }

  const telefonoDomiciliario =
    session.rol === "Admin" ? sp.get("telefono") || undefined : session.telefono;

  const domicilios = await listHistorial({
    telefonoDomiciliario,
    desde: sp.get("desde") || undefined,
    hasta: sp.get("hasta") || undefined,
    estado: sp.get("estado") || undefined,
  });
  return NextResponse.json(domicilios);
}

// El domiciliario registra los suyos; el Admin puede crear y asignar un
// domicilio a cualquier domiciliario (sección 4 del documento unificado).
export async function POST(request) {
  const session = await getSession();
  if (!["Admin", "Domiciliario"].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const telefonoDomiciliario =
    session.rol === "Domiciliario" ? session.telefono : body?.telefono_domiciliario;

  try {
    const domicilio = await crearDomicilio(telefonoDomiciliario, body ?? {}, {
      creadoPorAdmin: session.rol === "Admin",
    });
    return NextResponse.json(domicilio, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

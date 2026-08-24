import { prisma } from "../../../lib/prisma";
import { ServiceError } from "../../../lib/service-error";
import { haversineKm } from "./haversine";

const ESPACIOS_VALIDOS = [1, 2, 3];
const METODOS_PAGO_VALIDOS = ["Efectivo", "Transferencia"];
// Debajo de esto, la ubicación GPS capturada al entregar se considera "la misma"
// que una ya guardada del cliente (evita duplicados, sección 22 del documento).
const UMBRAL_UBICACION_DUPLICADA_KM = 0.1;

const INCLUDE_RELACIONES = {
  cliente: true,
  ubicacion: true,
};

export async function getDomicilio(id, { telefono, rol }) {
  const domicilio = await prisma.domicilio.findUnique({
    where: { id_domicilio: id },
    include: {
      ...INCLUDE_RELACIONES,
      domiciliario: { select: { telefono: true, nombre: true } },
    },
  });

  if (!domicilio) {
    throw new ServiceError("Domicilio no encontrado", 404);
  }
  if (rol !== "Admin" && domicilio.telefono_domiciliario !== telefono) {
    throw new ServiceError("No autorizado", 403);
  }

  return domicilio;
}

export async function listActivos(telefonoDomiciliario) {
  return prisma.domicilio.findMany({
    where: { telefono_domiciliario: telefonoDomiciliario, estado: "En_curso" },
    include: INCLUDE_RELACIONES,
    orderBy: { fecha_hora_creacion: "asc" },
  });
}

// Vista de Admin: todos los domicilios en curso, de cualquier domiciliario.
export async function listActivosTodos() {
  return prisma.domicilio.findMany({
    where: { estado: "En_curso" },
    include: { ...INCLUDE_RELACIONES, domiciliario: { select: { telefono: true, nombre: true } } },
    orderBy: { fecha_hora_creacion: "asc" },
  });
}

// Domicilios que el Admin ya asignó a este domiciliario pero que todavía no
// recoge (sin espacio de baúl asignado todavía) — sección 4 del documento.
export async function listAsignados(telefonoDomiciliario) {
  return prisma.domicilio.findMany({
    where: { telefono_domiciliario: telefonoDomiciliario, estado: "Asignado" },
    include: INCLUDE_RELACIONES,
    orderBy: { fecha_hora_creacion: "asc" },
  });
}

// Vista de Admin: todos los domicilios asignados y pendientes de recoger, de
// cualquier domiciliario.
export async function listAsignadosTodos() {
  return prisma.domicilio.findMany({
    where: { estado: "Asignado" },
    include: { ...INCLUDE_RELACIONES, domiciliario: { select: { telefono: true, nombre: true } } },
    orderBy: { fecha_hora_creacion: "asc" },
  });
}

export async function listDomiciliarios() {
  return prisma.usuario.findMany({
    where: { rol: "Domiciliario" },
    select: { telefono: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}

export async function listHistorial({ telefonoDomiciliario, desde, hasta, estado } = {}) {
  const where = {
    estado: estado ?? { in: ["Entregado", "Cancelado"] },
  };
  if (telefonoDomiciliario) where.telefono_domiciliario = telefonoDomiciliario;
  if (desde || hasta) {
    where.fecha_hora_creacion = {
      ...(desde ? { gte: new Date(desde) } : {}),
      ...(hasta ? { lte: new Date(hasta) } : {}),
    };
  }

  return prisma.domicilio.findMany({
    where,
    include: { ...INCLUDE_RELACIONES, domiciliario: { select: { telefono: true, nombre: true } } },
    orderBy: { fecha_hora_creacion: "desc" },
  });
}

// Cuando lo crea el Admin (creadoPorAdmin=true), queda "Asignado" sin espacio de
// baúl: el domiciliario recién lo elige al recogerlo con recogerDomicilio() (sección
// 4). Cuando lo crea el propio domiciliario, lo tiene en mano de una vez y elige el
// espacio ahí mismo, arrancando directo en "En_curso" como antes.
export async function crearDomicilio(telefonoDomiciliario, data, { creadoPorAdmin = false } = {}) {
  const telefono_cliente = data.telefono_cliente?.trim();
  const id_ubicacion = data.id_ubicacion?.trim();
  const productos = data.productos?.trim();
  const precio = Number(data.precio);
  const foto_productos_url = data.foto_productos_url ?? null;

  if (!telefonoDomiciliario) {
    throw new ServiceError("telefono_domiciliario es obligatorio", 400);
  }
  if (!telefono_cliente || !id_ubicacion || !productos) {
    throw new ServiceError(
      "cliente, ubicación y productos son obligatorios",
      400
    );
  }
  if (!Number.isFinite(precio) || precio <= 0) {
    throw new ServiceError("precio debe ser mayor a 0", 400);
  }
  if (!foto_productos_url) {
    throw new ServiceError("La foto del pedido es obligatoria", 400);
  }

  const domiciliario = await prisma.usuario.findUnique({ where: { telefono: telefonoDomiciliario } });
  if (!domiciliario || domiciliario.rol !== "Domiciliario") {
    throw new ServiceError("El domiciliario indicado no existe", 400);
  }

  const ubicacion = await prisma.ubicacion.findUnique({ where: { id_ubicacion } });
  if (!ubicacion || ubicacion.telefono_cliente !== telefono_cliente) {
    throw new ServiceError("La ubicación no pertenece a ese cliente", 400);
  }

  if (creadoPorAdmin) {
    return prisma.domicilio.create({
      data: {
        telefono_cliente,
        telefono_domiciliario: telefonoDomiciliario,
        id_ubicacion,
        productos,
        precio,
        estado: "Asignado",
        foto_productos_url,
      },
      include: { ...INCLUDE_RELACIONES, domiciliario: { select: { telefono: true, nombre: true } } },
    });
  }

  const espacio_baul = Number(data.espacio_baul);
  if (!ESPACIOS_VALIDOS.includes(espacio_baul)) {
    throw new ServiceError("espacio_baul debe ser 1, 2 o 3", 400);
  }

  const activos = await listActivos(telefonoDomiciliario);
  if (activos.length >= 3) {
    throw new ServiceError("Ya tienes 3 domicilios en curso (máximo por carga)", 409);
  }
  if (activos.some((d) => d.espacio_baul === espacio_baul)) {
    throw new ServiceError(`El espacio ${espacio_baul} del baúl ya está ocupado`, 409);
  }

  try {
    return await prisma.domicilio.create({
      data: {
        telefono_cliente,
        telefono_domiciliario: telefonoDomiciliario,
        id_ubicacion,
        productos,
        precio,
        espacio_baul,
        foto_productos_url,
      },
      include: { ...INCLUDE_RELACIONES, domiciliario: { select: { telefono: true, nombre: true } } },
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw new ServiceError(
        "Ese espacio del baúl ya está ocupado por otro domicilio en curso",
        409
      );
    }
    throw err;
  }
}

// El domiciliario recoge un domicilio "Asignado" por el Admin y ahí mismo elige en
// qué espacio del baúl lo lleva — solo entonces pasa a "En_curso" (sección 4).
export async function recogerDomicilio(id, telefonoDomiciliario, data) {
  const domicilio = await prisma.domicilio.findUnique({ where: { id_domicilio: id } });
  if (!domicilio) {
    throw new ServiceError("Domicilio no encontrado", 404);
  }
  if (domicilio.telefono_domiciliario !== telefonoDomiciliario) {
    throw new ServiceError("No autorizado", 403);
  }
  if (domicilio.estado !== "Asignado") {
    throw new ServiceError("Ese domicilio ya fue recogido o cerrado", 409);
  }

  const espacio_baul = Number(data.espacio_baul);
  if (!ESPACIOS_VALIDOS.includes(espacio_baul)) {
    throw new ServiceError("espacio_baul debe ser 1, 2 o 3", 400);
  }

  const activos = await listActivos(telefonoDomiciliario);
  if (activos.length >= 3) {
    throw new ServiceError("Ya tienes 3 domicilios en curso (máximo por carga)", 409);
  }
  if (activos.some((d) => d.espacio_baul === espacio_baul)) {
    throw new ServiceError(`El espacio ${espacio_baul} del baúl ya está ocupado`, 409);
  }

  try {
    return await prisma.domicilio.update({
      where: { id_domicilio: id },
      data: { estado: "En_curso", espacio_baul },
      include: { ...INCLUDE_RELACIONES, domiciliario: { select: { telefono: true, nombre: true } } },
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw new ServiceError(
        "Ese espacio del baúl ya está ocupado por otro domicilio en curso",
        409
      );
    }
    throw err;
  }
}

// El Admin corrige productos/precio de un domicilio ya creado, por ejemplo si se
// equivocó al seleccionar los productos (sección 4 del documento).
export async function actualizarDomicilio(id, data) {
  const existente = await prisma.domicilio.findUnique({ where: { id_domicilio: id } });
  if (!existente) {
    throw new ServiceError("Domicilio no encontrado", 404);
  }

  const productos = data.productos?.trim();
  const precio = Number(data.precio);
  if (!productos) {
    throw new ServiceError("productos es obligatorio", 400);
  }
  if (!Number.isFinite(precio) || precio <= 0) {
    throw new ServiceError("precio debe ser mayor a 0", 400);
  }

  return prisma.domicilio.update({
    where: { id_domicilio: id },
    data: { productos, precio },
    include: { ...INCLUDE_RELACIONES, domiciliario: { select: { telefono: true, nombre: true } } },
  });
}

async function getDomicilioActivoDeDomiciliario(id, telefonoDomiciliario) {
  const domicilio = await prisma.domicilio.findUnique({ where: { id_domicilio: id } });
  if (!domicilio) {
    throw new ServiceError("Domicilio no encontrado", 404);
  }
  if (domicilio.telefono_domiciliario !== telefonoDomiciliario) {
    throw new ServiceError("No autorizado", 403);
  }
  if (domicilio.estado !== "En_curso") {
    throw new ServiceError("Ese domicilio ya fue cerrado", 409);
  }
  return domicilio;
}

// Al entregar, la ubicación GPS real del domiciliario reemplaza la asignada al
// crear el domicilio (por el Admin o el propio cliente): en la práctica el cliente
// muchas veces no tiene clara su ubicación exacta y el Admin puede equivocarse por
// la rapidez con la que asigna — el punto donde realmente se hizo la entrega es la
// fuente de verdad. Si coincide (Haversine) con una ubicación ya guardada del
// cliente, el domicilio simplemente queda apuntando a esa. Si no coincide con
// ninguna, hace falta un nombre para crear la ubicación nueva — si todavía no
// llegó (primer intento, antes de mostrarle el segundo panel al domiciliario), se
// corta acá con un error distinguible en vez de crear algo o cerrar el domicilio.
async function resolverUbicacionEntrega(telefonoCliente, ubicacionEntrega, nombreLugar) {
  const ubicaciones = await prisma.ubicacion.findMany({
    where: { telefono_cliente: telefonoCliente },
  });

  const existente = ubicaciones.find(
    (u) => haversineKm(u, ubicacionEntrega) <= UMBRAL_UBICACION_DUPLICADA_KM
  );
  if (existente) {
    return { id_ubicacion: existente.id_ubicacion, esNueva: false };
  }

  if (!nombreLugar?.trim()) {
    throw new ServiceError(
      "Esta ubicación no coincide con ninguna guardada del cliente. Indica el nombre del lugar",
      409,
      { requiereNombreLugar: true }
    );
  }

  const nueva = await prisma.ubicacion.create({
    data: {
      telefono_cliente: telefonoCliente,
      latitud: ubicacionEntrega.latitud,
      longitud: ubicacionEntrega.longitud,
      alias_direccion: nombreLugar.trim(),
    },
  });
  return { id_ubicacion: nueva.id_ubicacion, esNueva: true };
}

export async function marcarEntregado(id, telefonoDomiciliario, data) {
  const domicilioActivo = await getDomicilioActivoDeDomiciliario(id, telefonoDomiciliario);

  const metodo_pago = data.metodo_pago;
  const valor_recaudado = Number(data.valor_recaudado);
  const distancia_km = data.distancia_km != null ? Number(data.distancia_km) : null;

  if (!METODOS_PAGO_VALIDOS.includes(metodo_pago)) {
    throw new ServiceError("metodo_pago inválido", 400);
  }
  if (!Number.isFinite(valor_recaudado) || valor_recaudado <= 0) {
    throw new ServiceError("valor_recaudado debe ser mayor a 0", 400);
  }

  const latitudEntrega = Number(data.ubicacion_entrega?.latitud);
  const longitudEntrega = Number(data.ubicacion_entrega?.longitud);
  if (!Number.isFinite(latitudEntrega) || !Number.isFinite(longitudEntrega)) {
    throw new ServiceError(
      "No se pudo capturar tu ubicación GPS. Activa la ubicación e intenta de nuevo",
      400
    );
  }
  const ubicacionEntrega = { latitud: latitudEntrega, longitud: longitudEntrega };

  const { id_ubicacion: idUbicacionEntrega, esNueva } = await resolverUbicacionEntrega(
    domicilioActivo.telefono_cliente,
    ubicacionEntrega,
    data.nombre_lugar
  );

  const domicilio = await prisma.domicilio.update({
    where: { id_domicilio: id },
    data: {
      estado: "Entregado",
      fecha_hora_entrega: new Date(),
      metodo_pago,
      valor_recaudado,
      distancia_km,
      id_ubicacion: idUbicacionEntrega,
    },
    include: INCLUDE_RELACIONES,
  });

  return {
    ...domicilio,
    ubicacionNueva: esNueva,
    ubicacionActualizada: idUbicacionEntrega !== domicilioActivo.id_ubicacion,
  };
}

export async function marcarCancelado(id, telefonoDomiciliario, data) {
  await getDomicilioActivoDeDomiciliario(id, telefonoDomiciliario);

  const motivo_cancelacion = data.motivo_cancelacion?.trim();
  if (!motivo_cancelacion) {
    throw new ServiceError("El motivo de cancelación es obligatorio", 400);
  }

  return prisma.domicilio.update({
    where: { id_domicilio: id },
    data: {
      estado: "Cancelado",
      fecha_hora_entrega: new Date(),
      motivo_cancelacion,
    },
    include: INCLUDE_RELACIONES,
  });
}

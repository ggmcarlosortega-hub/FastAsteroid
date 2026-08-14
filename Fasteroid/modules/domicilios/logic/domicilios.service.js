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

export async function crearDomicilio(telefonoDomiciliario, data) {
  const telefono_cliente = data.telefono_cliente?.trim();
  const id_ubicacion = data.id_ubicacion?.trim();
  const productos = data.productos?.trim();
  const espacio_baul = Number(data.espacio_baul);
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
  if (!ESPACIOS_VALIDOS.includes(espacio_baul)) {
    throw new ServiceError("espacio_baul debe ser 1, 2 o 3", 400);
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

// Al entregar se captura la ubicación GPS real del domiciliario y se compara
// contra las ubicaciones ya guardadas del cliente (Haversine). Si no coincide con
// ninguna, se guarda como una ubicación nueva; si coincide, no se duplica —
// sección 22 del documento unificado.
async function guardarUbicacionSiEsNueva(telefonoCliente, ubicacionEntrega) {
  if (!ubicacionEntrega) return false;

  const latitud = Number(ubicacionEntrega.latitud);
  const longitud = Number(ubicacionEntrega.longitud);
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) return false;

  const ubicaciones = await prisma.ubicacion.findMany({
    where: { telefono_cliente: telefonoCliente },
  });

  const yaExiste = ubicaciones.some(
    (u) => haversineKm(u, { latitud, longitud }) <= UMBRAL_UBICACION_DUPLICADA_KM
  );
  if (yaExiste) return false;

  await prisma.ubicacion.create({
    data: {
      telefono_cliente: telefonoCliente,
      latitud,
      longitud,
      alias_direccion: `Entrega ${new Date().toLocaleDateString("es-CO")}`,
    },
  });
  return true;
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

  const ubicacionGuardada = await guardarUbicacionSiEsNueva(
    domicilioActivo.telefono_cliente,
    data.ubicacion_entrega
  );

  const domicilio = await prisma.domicilio.update({
    where: { id_domicilio: id },
    data: {
      estado: "Entregado",
      fecha_hora_entrega: new Date(),
      metodo_pago,
      valor_recaudado,
      distancia_km,
    },
    include: INCLUDE_RELACIONES,
  });

  return { ...domicilio, ubicacionGuardada };
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

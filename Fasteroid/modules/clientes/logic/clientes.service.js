import { prisma } from "../../../lib/prisma";
import { ServiceError } from "../../../lib/service-error";

export async function listClientes(q) {
  return prisma.cliente.findMany({
    where: q
      ? { OR: [{ telefono: { contains: q } }, { nombre: { contains: q } }] }
      : undefined,
    include: { _count: { select: { ubicaciones: true, domicilios: true } } },
    orderBy: { fecha_primer_registro: "desc" },
  });
}

export async function createCliente({ telefono, nombre }) {
  telefono = telefono?.trim();
  nombre = nombre?.trim();

  if (!telefono || !nombre) {
    throw new ServiceError("telefono y nombre son obligatorios", 400);
  }

  const existente = await prisma.cliente.findUnique({ where: { telefono } });
  if (existente) {
    throw new ServiceError("Ya existe un cliente con ese teléfono", 409);
  }

  return prisma.cliente.create({ data: { telefono, nombre } });
}

export async function getCliente(telefono) {
  const cliente = await prisma.cliente.findUnique({
    where: { telefono },
    include: { ubicaciones: { orderBy: { alias_direccion: "asc" } } },
  });

  if (!cliente) {
    throw new ServiceError("Cliente no encontrado", 404);
  }

  return cliente;
}

export async function updateCliente(telefono, { nombre }) {
  nombre = nombre?.trim();
  if (!nombre) {
    throw new ServiceError("nombre es obligatorio", 400);
  }

  const cliente = await prisma.cliente
    .update({ where: { telefono }, data: { nombre } })
    .catch(() => null);

  if (!cliente) {
    throw new ServiceError("Cliente no encontrado", 404);
  }

  return cliente;
}

export async function deleteCliente(telefono) {
  try {
    await prisma.cliente.delete({ where: { telefono } });
  } catch {
    throw new ServiceError(
      "No se pudo eliminar (verifica que el cliente exista y no tenga domicilios asociados)",
      409
    );
  }
}

export async function addUbicacion(telefono, { alias_direccion, latitud, longitud }) {
  alias_direccion = alias_direccion?.trim();
  latitud = Number(latitud);
  longitud = Number(longitud);

  if (!alias_direccion || Number.isNaN(latitud) || Number.isNaN(longitud)) {
    throw new ServiceError("alias_direccion, latitud y longitud son obligatorios", 400);
  }

  const cliente = await prisma.cliente.findUnique({ where: { telefono } });
  if (!cliente) {
    throw new ServiceError("Cliente no encontrado", 404);
  }

  return prisma.ubicacion.create({
    data: { telefono_cliente: telefono, alias_direccion, latitud, longitud },
  });
}

export async function deleteUbicacion(id) {
  try {
    await prisma.ubicacion.delete({ where: { id_ubicacion: id } });
  } catch {
    throw new ServiceError(
      "No se pudo eliminar (verifica que la ubicación exista y no tenga domicilios asociados)",
      409
    );
  }
}

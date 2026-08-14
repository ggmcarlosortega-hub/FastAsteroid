require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const bcrypt = require("bcryptjs");

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const USUARIOS_DEMO = [
  { telefono: "3000000000", nombre: "Admin Demo", password: "admin123", rol: "Admin" },
  { telefono: "3000000001", nombre: "Domiciliario Demo", password: "domi123", rol: "Domiciliario" },
];

const CLIENTES_DEMO = [
  {
    telefono: "3011111111",
    nombre: "Juan Pérez",
    ubicaciones: [
      { alias_direccion: "Casa", latitud: 7.7539, longitud: -76.6552 },
      { alias_direccion: "Trabajo", latitud: 7.7561, longitud: -76.6498 },
    ],
  },
  {
    telefono: "3022222222",
    nombre: "María Gómez",
    ubicaciones: [{ alias_direccion: "Casa", latitud: 7.7502, longitud: -76.6511 }],
  },
];

async function main() {
  for (const usuario of USUARIOS_DEMO) {
    const password_hash = await bcrypt.hash(usuario.password, 10);
    await prisma.usuario.upsert({
      where: { telefono: usuario.telefono },
      update: {},
      create: {
        telefono: usuario.telefono,
        nombre: usuario.nombre,
        password_hash,
        rol: usuario.rol,
      },
    });
    console.log(`Usuario ${usuario.rol} listo: ${usuario.telefono} / ${usuario.password}`);
  }

  for (const { telefono, nombre, ubicaciones } of CLIENTES_DEMO) {
    const existente = await prisma.cliente.findUnique({ where: { telefono } });
    if (existente) {
      console.log(`Cliente ya existía: ${nombre} (${telefono})`);
      continue;
    }
    await prisma.cliente.create({
      data: { telefono, nombre, ubicaciones: { create: ubicaciones } },
    });
    console.log(`Cliente creado: ${nombre} (${telefono}) con ${ubicaciones.length} ubicación(es)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

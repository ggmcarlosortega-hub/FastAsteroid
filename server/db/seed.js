require("dotenv/config");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { pool } = require("./pool");

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
    await pool.execute(
      `INSERT INTO usuario (telefono, nombre, password_hash, rol) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE telefono = telefono`,
      [usuario.telefono, usuario.nombre, password_hash, usuario.rol]
    );
    console.log(`Usuario ${usuario.rol} listo: ${usuario.telefono} / ${usuario.password}`);
  }

  for (const { telefono, nombre, ubicaciones } of CLIENTES_DEMO) {
    const [existentes] = await pool.execute("SELECT telefono FROM cliente WHERE telefono = ?", [
      telefono,
    ]);
    if (existentes.length > 0) {
      console.log(`Cliente ya existía: ${nombre} (${telefono})`);
      continue;
    }

    await pool.execute("INSERT INTO cliente (telefono, nombre) VALUES (?, ?)", [telefono, nombre]);
    for (const ubicacion of ubicaciones) {
      await pool.execute(
        "INSERT INTO ubicacion (id_ubicacion, telefono_cliente, alias_direccion, latitud, longitud) VALUES (?, ?, ?, ?, ?)",
        [
          crypto.randomUUID(),
          telefono,
          ubicacion.alias_direccion,
          ubicacion.latitud,
          ubicacion.longitud,
        ]
      );
    }
    console.log(`Cliente creado: ${nombre} (${telefono}) con ${ubicaciones.length} ubicación(es)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

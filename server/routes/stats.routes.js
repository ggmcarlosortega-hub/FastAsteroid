const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { pool } = require("../db/pool");

const router = express.Router();

// Público a propósito: solo conteos agregados, sin datos personales — lo usa la
// landing page de Next.js (app/page.js) para demostrar que el backend y la base de
// datos están arriba, igual que hacía antes con Prisma directo.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [[usuarios], [clientes], [ubicaciones], [domicilios]] = await Promise.all([
      pool.query("SELECT COUNT(*) AS n FROM usuario"),
      pool.query("SELECT COUNT(*) AS n FROM cliente"),
      pool.query("SELECT COUNT(*) AS n FROM ubicacion"),
      pool.query("SELECT COUNT(*) AS n FROM domicilio"),
    ]);
    res.json({
      usuarios: usuarios[0].n,
      clientes: clientes[0].n,
      ubicaciones: ubicaciones[0].n,
      domicilios: domicilios[0].n,
    });
  })
);

module.exports = router;

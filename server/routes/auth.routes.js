const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db/pool");
const {
  setSessionCookie,
  clearSessionCookie,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} = require("../lib/auth");
const { asyncHandler } = require("../lib/asyncHandler");

const router = express.Router();

router.post("/login", asyncHandler(async (req, res) => {
  const telefono = req.body?.telefono;
  const password = req.body?.password;

  if (!telefono || !password) {
    return res.status(400).json({ error: "telefono y password son obligatorios" });
  }

  const [rows] = await pool.execute("SELECT * FROM usuario WHERE telefono = ?", [telefono]);
  const usuario = rows[0];
  if (!usuario) {
    return res.status(401).json({ error: "Teléfono o contraseña incorrectos" });
  }

  const passwordValida = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValida) {
    return res.status(401).json({ error: "Teléfono o contraseña incorrectos" });
  }

  await setSessionCookie(res, {
    telefono: usuario.telefono,
    nombre: usuario.nombre,
    rol: usuario.rol,
  });

  res.json({ telefono: usuario.telefono, nombre: usuario.nombre, rol: usuario.rol });
}));

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/me", asyncHandler(async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const session = await verifySessionToken(token);
  if (!session) {
    return res.status(401).json({ error: "No autenticado" });
  }
  res.json({ telefono: session.telefono, nombre: session.nombre, rol: session.rol });
}));

module.exports = router;

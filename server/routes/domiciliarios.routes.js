const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const domiciliosService = require("../modules/domicilios/domicilios.service");

const router = express.Router();

// Lista de usuarios con rol Domiciliario, para que el Admin elija a quién
// asignar un domicilio nuevo (sección 4 del documento unificado).
router.get(
  "/",
  requireAuth,
  requireRole("Admin"),
  asyncHandler(async (_req, res) => {
    res.json(await domiciliosService.listDomiciliarios());
  })
);

module.exports = router;

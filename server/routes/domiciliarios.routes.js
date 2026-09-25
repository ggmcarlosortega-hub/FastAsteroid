const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const domiciliosService = require("../modules/domicilios/domicilios.service");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("Admin"));

// ?soloActivos=1: versión liviana (solo telefono/nombre, solo activos) que usa el
// selector de "a quién asignar" en NuevoDomicilioModal.js. Sin ese parámetro:
// lista completa con totales históricos, para la pantalla "Domiciliarios".
router.get(
  "/",
  asyncHandler(async (req, res) => {
    if (req.query.soloActivos === "1") {
      res.json(await domiciliosService.listDomiciliarios());
    } else {
      res.json(await domiciliosService.listDomiciliariosConTotales());
    }
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const domiciliario = await domiciliosService.crearDomiciliario(req.body ?? {});
      res.status(201).json(domiciliario);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.patch(
  "/:telefono",
  asyncHandler(async (req, res) => {
    try {
      await domiciliosService.setActivoDomiciliario(req.params.telefono, req.body?.activo);
      res.json({ ok: true });
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

module.exports = router;

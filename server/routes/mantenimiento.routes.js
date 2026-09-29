const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const mantenimientoService = require("../modules/mantenimiento/mantenimiento.service");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("Admin"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const registros = await mantenimientoService.listRegistros(req.query.id_vehiculo);
      res.json(registros);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const registro = await mantenimientoService.createRegistro(req.body ?? {});
      res.status(201).json(registro);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.get(
  "/alerta",
  asyncHandler(async (req, res) => {
    try {
      res.json(await mantenimientoService.getAlertaPreventiva(req.query.id_vehiculo));
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

// Usada por el dashboard del Admin: no recibe id_vehiculo — recorre todos los
// vehículos activos y devuelve solo los que de verdad deben alertar.
router.get(
  "/alertas",
  asyncHandler(async (_req, res) => {
    res.json(await mantenimientoService.getAlertasPreventivas());
  })
);

module.exports = router;

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
  asyncHandler(async (_req, res) => {
    const registros = await mantenimientoService.listRegistros();
    res.json(registros);
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
  asyncHandler(async (_req, res) => {
    res.json(await mantenimientoService.getAlertaPreventiva());
  })
);

module.exports = router;

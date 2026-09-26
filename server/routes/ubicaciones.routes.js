const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const clientesService = require("../modules/clientes/clientes.service");

const router = express.Router();

// Sin requireRole: tanto Admin como Domiciliario necesitan poder corregir el
// municipio de una ubicación ya guardada (ver GET /api/municipios, mismo criterio).
router.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    try {
      const ubicacion = await clientesService.updateUbicacion(req.params.id, req.body ?? {});
      res.json(ubicacion);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    try {
      await clientesService.deleteUbicacion(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

module.exports = router;

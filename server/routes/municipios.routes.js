const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const municipiosService = require("../modules/inventario/municipios.service");

const router = express.Router();

router.use(requireAuth);

// GET abierto a cualquier rol autenticado: el selector de municipio al crear o
// editar una ubicación lo usa tanto el Admin como el Domiciliario.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const municipios = await municipiosService.listMunicipios();
    res.json(municipios);
  })
);

router.post(
  "/",
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    try {
      const municipio = await municipiosService.createMunicipio(req.body ?? {});
      res.status(201).json(municipio);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.patch(
  "/:id",
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    try {
      const municipio = await municipiosService.updateMunicipio(req.params.id, req.body ?? {});
      res.json(municipio);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.delete(
  "/:id",
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    try {
      await municipiosService.deleteMunicipio(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

module.exports = router;

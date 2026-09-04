const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const categoriasService = require("../modules/inventario/categorias.service");

const router = express.Router();

router.use(requireAuth);

// GET abierto a cualquier rol autenticado: SeleccionProductosPicker.js (usado por
// el domiciliario al crear un domicilio) necesita los nombres para agrupar.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categorias = await categoriasService.listCategorias();
    res.json(categorias);
  })
);

router.post(
  "/",
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    try {
      const categoria = await categoriasService.createCategoria(req.body ?? {});
      res.status(201).json(categoria);
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
      const categoria = await categoriasService.updateCategoria(req.params.id, req.body ?? {});
      res.json(categoria);
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
      await categoriasService.deleteCategoria(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

module.exports = router;

const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const proveedoresService = require("../modules/inventario/proveedores.service");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("Admin"));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const proveedores = await proveedoresService.listProveedores();
    res.json(proveedores);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const proveedor = await proveedoresService.createProveedor(req.body ?? {});
      res.status(201).json(proveedor);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const proveedor = await proveedoresService.updateProveedor(req.params.id, req.body ?? {});
      res.json(proveedor);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      await proveedoresService.deleteProveedor(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

module.exports = router;

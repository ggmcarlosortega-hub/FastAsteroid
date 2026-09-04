const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const inventarioService = require("../modules/inventario/inventario.service");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("Admin"));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const inventario = await inventarioService.getInventario();
    res.json(inventario);
  })
);

module.exports = router;

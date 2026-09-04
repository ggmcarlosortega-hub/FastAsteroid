const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const lotesService = require("../modules/inventario/lotes.service");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("Admin"));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const lotes = await lotesService.listLotes();
    res.json(lotes);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const lote = await lotesService.createLote(req.body ?? {});
      res.status(201).json(lote);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

module.exports = router;

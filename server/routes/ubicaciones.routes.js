const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const clientesService = require("../modules/clientes/clientes.service");

const router = express.Router();

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

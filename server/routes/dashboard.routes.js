const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const dashboardService = require("../modules/dashboard/dashboard.service");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("Admin"));

function mesActual() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
}

router.get(
  "/resumen",
  asyncHandler(async (req, res) => {
    try {
      const resumen = await dashboardService.getResumenMensual(req.query.mes || mesActual());
      res.json(resumen);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

module.exports = router;

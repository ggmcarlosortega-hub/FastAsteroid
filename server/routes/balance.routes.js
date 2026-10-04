const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const balanceService = require("../modules/balance/balance.service");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("Admin"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const balance = await balanceService.getBalance({ desde: req.query.desde, hasta: req.query.hasta });
      res.json(balance);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

module.exports = router;

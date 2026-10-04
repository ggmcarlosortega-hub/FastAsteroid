const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth } = require("../lib/middleware/requireAuth");
const ocrService = require("../modules/ocr/ocr.service");

const router = express.Router();

router.use(requireAuth);

// Lo leen y lo alimentan los domiciliarios al confirmar una comanda escaneada.
router.get(
  "/aprendizaje",
  asyncHandler(async (_req, res) => {
    res.json(await ocrService.listarAprendizaje());
  })
);

router.post(
  "/aprendizaje",
  asyncHandler(async (req, res) => {
    try {
      res.status(201).json(await ocrService.registrarAprendizaje(req.body?.entradas));
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

module.exports = router;

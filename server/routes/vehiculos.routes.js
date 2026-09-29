const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const vehiculosService = require("../modules/mantenimiento/vehiculos.service");

const router = express.Router();

router.use(requireAuth);

// GET abierto a cualquier rol autenticado — mismo criterio que
// categorias.routes.js/municipios.routes.js, por si en el futuro un
// domiciliario necesita elegir vehículo (hoy Mantenimiento es Admin-only,
// pero listar vehículos por sí solo no expone nada sensible).
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await vehiculosService.listVehiculos({ soloActivos: req.query.soloActivos === "1" }));
  })
);

router.post(
  "/",
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    try {
      const vehiculo = await vehiculosService.createVehiculo(req.body ?? {});
      res.status(201).json(vehiculo);
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
      const vehiculo = await vehiculosService.updateVehiculo(req.params.id, req.body ?? {});
      res.json(vehiculo);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

module.exports = router;

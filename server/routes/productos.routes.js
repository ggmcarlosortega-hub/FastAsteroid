const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const productosService = require("../modules/inventario/productos.service");

const router = express.Router();

router.use(requireAuth);

// GET abierto a cualquier rol autenticado: el domiciliario necesita leer el
// catálogo para elegir productos al crear un domicilio.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const soloActivos = req.query.activos === "1";
    const productos = await productosService.listProductos({ soloActivos });
    res.json(productos);
  })
);

router.post(
  "/",
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    try {
      const producto = await productosService.createProducto(req.body ?? {});
      res.status(201).json(producto);
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
      const producto = await productosService.updateProducto(req.params.id, req.body ?? {});
      res.json(producto);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.post(
  "/bulk",
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    try {
      const productos = await productosService.createProductosBulk(req.body?.lineas ?? []);
      res.status(201).json(productos);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

module.exports = router;

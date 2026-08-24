const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth, requireRole } = require("../lib/middleware/requireAuth");
const clientesService = require("../modules/clientes/clientes.service");

const router = express.Router();

// Los route.js individuales de Next.js no llamaban a getSession() en GET/POST
// clientes ni en POST ubicaciones, pero Fasteroid/proxy.js exigía sesión para
// CUALQUIER /api/* salvo login/logout — esa guarda global es la que de verdad
// gobernaba el comportamiento, así que acá se replica con requireAuth en todo el
// router. PATCH/DELETE de cliente y DELETE de ubicación además exigían rol Admin.
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const clientes = await clientesService.listClientes(q);
    res.json(clientes);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const cliente = await clientesService.createCliente(req.body ?? {});
      res.status(201).json(cliente);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.get(
  "/:telefono",
  asyncHandler(async (req, res) => {
    try {
      const cliente = await clientesService.getCliente(req.params.telefono);
      res.json(cliente);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.patch(
  "/:telefono",
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    try {
      const cliente = await clientesService.updateCliente(req.params.telefono, req.body ?? {});
      res.json(cliente);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.delete(
  "/:telefono",
  requireRole("Admin"),
  asyncHandler(async (req, res) => {
    try {
      await clientesService.deleteCliente(req.params.telefono);
      res.json({ ok: true });
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.post(
  "/:telefono/ubicaciones",
  asyncHandler(async (req, res) => {
    try {
      const ubicacion = await clientesService.addUbicacion(req.params.telefono, req.body ?? {});
      res.status(201).json(ubicacion);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

module.exports = router;

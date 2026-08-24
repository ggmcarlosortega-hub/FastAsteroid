const express = require("express");
const { asyncHandler } = require("../lib/asyncHandler");
const { sendServiceError } = require("../lib/service-error");
const { requireAuth } = require("../lib/middleware/requireAuth");
const domiciliosService = require("../modules/domicilios/domicilios.service");

const router = express.Router();

// Todas las rutas de domicilios exigían sesión en Fasteroid/proxy.js (matcher
// "/api/:path*" salvo login/logout) — acá se aplica el mismo guard a nivel de router.
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const session = req.session;
    const sp = req.query;

    if (sp.vista === "activos") {
      if (session.rol === "Admin") {
        const telefono = sp.telefono;
        return res.json(
          telefono
            ? await domiciliosService.listActivos(telefono)
            : await domiciliosService.listActivosTodos()
        );
      }
      return res.json(await domiciliosService.listActivos(session.telefono));
    }

    if (sp.vista === "asignados") {
      if (session.rol === "Admin") {
        const telefono = sp.telefono;
        return res.json(
          telefono
            ? await domiciliosService.listAsignados(telefono)
            : await domiciliosService.listAsignadosTodos()
        );
      }
      return res.json(await domiciliosService.listAsignados(session.telefono));
    }

    const telefonoDomiciliario = session.rol === "Admin" ? sp.telefono || undefined : session.telefono;

    const domicilios = await domiciliosService.listHistorial({
      telefonoDomiciliario,
      desde: sp.desde || undefined,
      hasta: sp.hasta || undefined,
      estado: sp.estado || undefined,
    });
    res.json(domicilios);
  })
);

// El domiciliario registra los suyos; el Admin puede crear y asignar un
// domicilio a cualquier domiciliario (sección 4 del documento unificado).
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const session = req.session;
    if (!["Admin", "Domiciliario"].includes(session.rol)) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const body = req.body ?? {};
    const telefonoDomiciliario =
      session.rol === "Domiciliario" ? session.telefono : body.telefono_domiciliario;

    try {
      const domicilio = await domiciliosService.crearDomicilio(telefonoDomiciliario, body, {
        creadoPorAdmin: session.rol === "Admin",
      });
      res.status(201).json(domicilio);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const domicilio = await domiciliosService.getDomicilio(req.params.id, {
        telefono: req.session.telefono,
        rol: req.session.rol,
      });
      res.json(domicilio);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

// El Admin corrige el registro (ej. se equivocó en los productos seleccionados).
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    if (req.session.rol !== "Admin") {
      return res.status(403).json({ error: "No autorizado" });
    }
    try {
      const domicilio = await domiciliosService.actualizarDomicilio(req.params.id, req.body ?? {});
      res.json(domicilio);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.post(
  "/:id/entregar",
  asyncHandler(async (req, res) => {
    if (req.session.rol !== "Domiciliario") {
      return res.status(403).json({ error: "No autorizado" });
    }
    try {
      const domicilio = await domiciliosService.marcarEntregado(
        req.params.id,
        req.session.telefono,
        req.body ?? {}
      );
      res.json(domicilio);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.post(
  "/:id/cancelar",
  asyncHandler(async (req, res) => {
    if (req.session.rol !== "Domiciliario") {
      return res.status(403).json({ error: "No autorizado" });
    }
    try {
      const domicilio = await domiciliosService.marcarCancelado(
        req.params.id,
        req.session.telefono,
        req.body ?? {}
      );
      res.json(domicilio);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

router.post(
  "/:id/recoger",
  asyncHandler(async (req, res) => {
    if (req.session.rol !== "Domiciliario") {
      return res.status(403).json({ error: "No autorizado" });
    }
    try {
      const domicilio = await domiciliosService.recogerDomicilio(
        req.params.id,
        req.session.telefono,
        req.body ?? {}
      );
      res.json(domicilio);
    } catch (err) {
      sendServiceError(res, err);
    }
  })
);

module.exports = router;

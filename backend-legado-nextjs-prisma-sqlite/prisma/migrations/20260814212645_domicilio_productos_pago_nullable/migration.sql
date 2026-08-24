/*
  Warnings:

  - Added the required column `productos` to the `domicilio` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_domicilio" (
    "id_domicilio" TEXT NOT NULL PRIMARY KEY,
    "telefono_cliente" TEXT NOT NULL,
    "telefono_domiciliario" TEXT NOT NULL,
    "id_ubicacion" TEXT NOT NULL,
    "productos" TEXT NOT NULL,
    "fecha_hora_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_hora_entrega" DATETIME,
    "valor_recaudado" REAL,
    "metodo_pago" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'En_curso',
    "distancia_km" REAL,
    "espacio_baul" INTEGER NOT NULL,
    "foto_productos_url" TEXT,
    "motivo_cancelacion" TEXT,
    CONSTRAINT "domicilio_telefono_cliente_fkey" FOREIGN KEY ("telefono_cliente") REFERENCES "cliente" ("telefono") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "domicilio_telefono_domiciliario_fkey" FOREIGN KEY ("telefono_domiciliario") REFERENCES "usuario" ("telefono") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "domicilio_id_ubicacion_fkey" FOREIGN KEY ("id_ubicacion") REFERENCES "ubicacion" ("id_ubicacion") ON DELETE RESTRICT ON UPDATE CASCADE,
    CHECK ("metodo_pago" IS NULL OR "metodo_pago" IN ('Efectivo', 'Transferencia')),
    CHECK ("estado" IN ('En_curso', 'Entregado', 'Cancelado')),
    CHECK ("espacio_baul" BETWEEN 1 AND 3),
    CHECK ("estado" != 'Cancelado' OR "motivo_cancelacion" IS NOT NULL)
);
INSERT INTO "new_domicilio" ("distancia_km", "espacio_baul", "estado", "fecha_hora_creacion", "fecha_hora_entrega", "foto_productos_url", "id_domicilio", "id_ubicacion", "metodo_pago", "motivo_cancelacion", "telefono_cliente", "telefono_domiciliario", "valor_recaudado") SELECT "distancia_km", "espacio_baul", "estado", "fecha_hora_creacion", "fecha_hora_entrega", "foto_productos_url", "id_domicilio", "id_ubicacion", "metodo_pago", "motivo_cancelacion", "telefono_cliente", "telefono_domiciliario", "valor_recaudado" FROM "domicilio";
DROP TABLE "domicilio";
ALTER TABLE "new_domicilio" RENAME TO "domicilio";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Máximo 3 domicilios "En_curso" simultáneos por domiciliario, uno por espacio de baúl (sección 16).
CREATE UNIQUE INDEX "domicilio_espacio_activo_unico" ON "domicilio"("telefono_domiciliario", "espacio_baul") WHERE "estado" = 'En_curso';

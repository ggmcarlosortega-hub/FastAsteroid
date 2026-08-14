-- CreateTable
CREATE TABLE "usuario" (
    "telefono" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    CHECK ("rol" IN ('Admin', 'Domiciliario'))
);

-- CreateTable
CREATE TABLE "cliente" (
    "telefono" TEXT NOT NULL PRIMARY KEY,
    "fecha_primer_registro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ubicacion" (
    "id_ubicacion" TEXT NOT NULL PRIMARY KEY,
    "telefono_cliente" TEXT NOT NULL,
    "latitud" REAL NOT NULL,
    "longitud" REAL NOT NULL,
    "alias_direccion" TEXT NOT NULL,
    CONSTRAINT "ubicacion_telefono_cliente_fkey" FOREIGN KEY ("telefono_cliente") REFERENCES "cliente" ("telefono") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "domicilio" (
    "id_domicilio" TEXT NOT NULL PRIMARY KEY,
    "telefono_cliente" TEXT NOT NULL,
    "telefono_domiciliario" TEXT NOT NULL,
    "id_ubicacion" TEXT NOT NULL,
    "fecha_hora_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_hora_entrega" DATETIME,
    "valor_recaudado" REAL NOT NULL,
    "metodo_pago" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'En_curso',
    "distancia_km" REAL,
    "espacio_baul" INTEGER NOT NULL,
    "foto_productos_url" TEXT,
    "motivo_cancelacion" TEXT,
    CONSTRAINT "domicilio_telefono_cliente_fkey" FOREIGN KEY ("telefono_cliente") REFERENCES "cliente" ("telefono") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "domicilio_telefono_domiciliario_fkey" FOREIGN KEY ("telefono_domiciliario") REFERENCES "usuario" ("telefono") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "domicilio_id_ubicacion_fkey" FOREIGN KEY ("id_ubicacion") REFERENCES "ubicacion" ("id_ubicacion") ON DELETE RESTRICT ON UPDATE CASCADE,
    CHECK ("metodo_pago" IN ('Efectivo', 'Transferencia')),
    CHECK ("estado" IN ('En_curso', 'Entregado', 'Cancelado')),
    CHECK ("espacio_baul" BETWEEN 1 AND 3),
    CHECK ("estado" != 'Cancelado' OR "motivo_cancelacion" IS NOT NULL)
);

-- CreateTable
CREATE TABLE "registro_mantenimiento" (
    "id_registro" TEXT NOT NULL PRIMARY KEY,
    "fecha_hora" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kilometraje_actual" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "galones_ingresados" REAL,
    "costo_total" REAL,
    "descripcion_compras_y_taller" TEXT,
    CHECK ("tipo" IN ('Tanqueo', 'Taller', 'Compra_Adicional'))
);

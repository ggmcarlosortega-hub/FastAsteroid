-- Esquema MySQL de Fasteroid, traducido de Fasteroid/prisma/schema.prisma.
-- Reglas de traducción documentadas en el plan de migración y en aplicativos.md.

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS domicilio;
DROP TABLE IF EXISTS ubicacion;
DROP TABLE IF EXISTS registro_mantenimiento;
DROP TABLE IF EXISTS cliente;
DROP TABLE IF EXISTS usuario;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE usuario (
  telefono      VARCHAR(20)  PRIMARY KEY,
  nombre        VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('Admin', 'Domiciliario') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cliente (
  telefono              VARCHAR(20)  PRIMARY KEY,
  nombre                VARCHAR(255) NOT NULL,
  fecha_primer_registro DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ubicacion (
  id_ubicacion     CHAR(36)     PRIMARY KEY,
  telefono_cliente VARCHAR(20)  NOT NULL,
  latitud          DOUBLE       NOT NULL,
  longitud         DOUBLE       NOT NULL,
  alias_direccion  VARCHAR(255) NOT NULL,
  CONSTRAINT ubicacion_telefono_cliente_fkey
    FOREIGN KEY (telefono_cliente) REFERENCES cliente(telefono)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- estado: 'Asignado' (creado por el Admin, sin espacio de baúl todavía) | 'En_curso'
-- (recogido, tracking activo) | 'Entregado' | 'Cancelado'.
--
-- espacio_activo es una columna generada (STORED) que vale espacio_baul solo cuando
-- estado = 'En_curso', y NULL en cualquier otro caso. MySQL no soporta índices únicos
-- parciales como el `WHERE estado = 'En_curso'` que tenía SQLite; esta columna generada
-- + el UNIQUE KEY de más abajo reproducen exactamente el mismo comportamiento, porque
-- MySQL trata cada NULL de un índice único como un valor distinto (no colisionan entre sí).
CREATE TABLE domicilio (
  id_domicilio           CHAR(36)       PRIMARY KEY,
  telefono_cliente       VARCHAR(20)    NOT NULL,
  telefono_domiciliario  VARCHAR(20)    NOT NULL,
  -- Se fija al crear el domicilio, pero se reemplaza al entregar por la ubicación GPS
  -- real capturada en ese momento (sección 6 del documento unificado).
  id_ubicacion           CHAR(36)       NOT NULL,
  productos               TEXT          NOT NULL,
  precio                  DECIMAL(10,2) NOT NULL,
  fecha_hora_creacion    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_hora_entrega     DATETIME       NULL,
  valor_recaudado        DECIMAL(10,2)  NULL,
  metodo_pago            ENUM('Efectivo', 'Transferencia') NULL,
  estado                 ENUM('Asignado', 'En_curso', 'Entregado', 'Cancelado') NOT NULL DEFAULT 'En_curso',
  distancia_km           DOUBLE         NULL,
  espacio_baul           TINYINT        NULL,
  -- LONGTEXT y no TEXT: una foto real en base64 puede superar los 64 KB que MySQL
  -- permite en TEXT (SQLite no tenía ese límite práctico).
  foto_productos_url     LONGTEXT       NULL,
  motivo_cancelacion     TEXT           NULL,
  espacio_activo         TINYINT GENERATED ALWAYS AS (IF(estado = 'En_curso', espacio_baul, NULL)) STORED,

  CONSTRAINT domicilio_telefono_cliente_fkey
    FOREIGN KEY (telefono_cliente) REFERENCES cliente(telefono)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT domicilio_telefono_domiciliario_fkey
    FOREIGN KEY (telefono_domiciliario) REFERENCES usuario(telefono)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT domicilio_id_ubicacion_fkey
    FOREIGN KEY (id_ubicacion) REFERENCES ubicacion(id_ubicacion)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT chk_domicilio_espacio_baul CHECK (espacio_baul IS NULL OR espacio_baul BETWEEN 1 AND 3),
  CONSTRAINT chk_domicilio_motivo_cancelacion CHECK (estado <> 'Cancelado' OR motivo_cancelacion IS NOT NULL),

  -- Máximo 3 domicilios "En_curso" por domiciliario, uno por espacio de baúl (sección 16).
  UNIQUE KEY domicilio_espacio_activo_unico (telefono_domiciliario, espacio_activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Definida en el modelo pero todavía sin flujo de UI/API (Bloque 3 del backlog, pendiente).
CREATE TABLE registro_mantenimiento (
  id_registro                  CHAR(36)      PRIMARY KEY,
  fecha_hora                   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  kilometraje_actual            INT          NOT NULL,
  tipo                          ENUM('Tanqueo', 'Taller', 'Compra_Adicional') NOT NULL,
  galones_ingresados             DOUBLE      NULL,
  costo_total                    DECIMAL(10,2) NULL,
  descripcion_compras_y_taller   TEXT        NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

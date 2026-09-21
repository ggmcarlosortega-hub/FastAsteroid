-- Esquema MySQL de Fasteroid, traducido de Fasteroid/prisma/schema.prisma.
-- Reglas de traducción documentadas en el plan de migración y en aplicativos.md.

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS domicilio_producto;
DROP TABLE IF EXISTS lote_compra;
DROP TABLE IF EXISTS domicilio;
DROP TABLE IF EXISTS ubicacion;
DROP TABLE IF EXISTS municipio;
DROP TABLE IF EXISTS registro_mantenimiento;
DROP TABLE IF EXISTS cliente;
DROP TABLE IF EXISTS producto;
DROP TABLE IF EXISTS categoria_producto;
DROP TABLE IF EXISTS proveedor;
DROP TABLE IF EXISTS usuario;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE usuario (
  telefono      VARCHAR(20)  PRIMARY KEY,
  nombre        VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('Admin', 'Domiciliario') NOT NULL,
  -- Un domiciliario inactivo desaparece del selector de "asignar domicilio" pero
  -- sigue pudiendo iniciar sesión — para no dejarlo tildado a mitad de una entrega
  -- ya asignada. Mismo patrón que producto.activo.
  activo        BOOLEAN      NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cliente (
  telefono              VARCHAR(20)  PRIMARY KEY,
  nombre                VARCHAR(255) NOT NULL,
  fecha_primer_registro DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo aparte, igual patrón que proveedor — un producto puede quedar sin
-- categoría (id_categoria NULL) hasta que alguien se la asigne.
CREATE TABLE categoria_producto (
  id_categoria    CHAR(36)      PRIMARY KEY,
  nombre          VARCHAR(255)  NOT NULL UNIQUE,
  fecha_creacion  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Módulo de inventario (Fase 1): catálogo de productos que vende el negocio.
CREATE TABLE producto (
  id_producto     CHAR(36)      PRIMARY KEY,
  nombre          VARCHAR(255)  NOT NULL,
  precio_venta    DECIMAL(10,2) NOT NULL,
  -- Un producto con ventas o compras asociadas no se borra (FK ON DELETE RESTRICT
  -- desde domicilio_producto/lote_compra) — se desactiva para sacarlo de la
  -- selección al crear domicilios sin romper el historial.
  activo          BOOLEAN       NOT NULL DEFAULT TRUE,
  -- A diferencia de proveedor/producto en lote_compra (RESTRICT), borrar una
  -- categoría no debe bloquearse ni borrar productos — solo los deja sin categoría.
  id_categoria    CHAR(36)      NULL,
  fecha_creacion  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT producto_categoria_fkey
    FOREIGN KEY (id_categoria) REFERENCES categoria_producto(id_categoria)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE proveedor (
  id_proveedor    CHAR(36)      PRIMARY KEY,
  nombre          VARCHAR(255)  NOT NULL,
  telefono        VARCHAR(20)   NULL,
  fecha_creacion  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo de municipios con recargo de domicilio — un municipio distinto al
-- del negocio (Carepa) puede costar más entregarlo; el recargo se suma al
-- precio sugerido al crear un domicilio a una ubicación con municipio (ver
-- NuevoDomicilioModal.js). No aparece Carepa en esta tabla: una ubicación sin
-- municipio asignado (id_municipio NULL) es simplemente "sin recargo".
CREATE TABLE municipio (
  id_municipio      CHAR(36)      PRIMARY KEY,
  nombre            VARCHAR(255)  NOT NULL UNIQUE,
  recargo_domicilio DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ubicacion (
  id_ubicacion     CHAR(36)     PRIMARY KEY,
  telefono_cliente VARCHAR(20)  NOT NULL,
  latitud          DOUBLE       NOT NULL,
  longitud         DOUBLE       NOT NULL,
  alias_direccion  VARCHAR(255) NOT NULL,
  -- Opcional a propósito: una dirección local (Carepa) no necesita municipio ni
  -- recargo — así un pedido simple no obliga a elegir nada acá.
  id_municipio     CHAR(36)     NULL,
  CONSTRAINT ubicacion_telefono_cliente_fkey
    FOREIGN KEY (telefono_cliente) REFERENCES cliente(telefono)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ubicacion_municipio_fkey
    FOREIGN KEY (id_municipio) REFERENCES municipio(id_municipio)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- estado: 'Asignado' (creado por el Admin, en la lista de espera compartida — sin
-- domiciliario ni espacio de baúl todavía) | 'En_curso' (tomado por algún domiciliario,
-- tracking activo) | 'Entregado' | 'Cancelado'.
--
-- telefono_domiciliario es NULL mientras el domicilio está en la lista de espera
-- ('Asignado', creado por el Admin sin elegir a nadie) — cualquier domiciliario
-- disponible lo toma con recogerDomicilio(), que lo fija ahí de forma atómica (ver
-- domicilios.service.js). Cuando lo crea el propio domiciliario, se fija de una vez.
--
-- espacio_activo es una columna generada (STORED) que vale espacio_baul solo cuando
-- estado = 'En_curso', y NULL en cualquier otro caso. MySQL no soporta índices únicos
-- parciales como el `WHERE estado = 'En_curso'` que tenía SQLite; esta columna generada
-- + el UNIQUE KEY de más abajo reproducen exactamente el mismo comportamiento, porque
-- MySQL trata cada NULL de un índice único como un valor distinto (no colisionan entre sí).
CREATE TABLE domicilio (
  id_domicilio           CHAR(36)       PRIMARY KEY,
  telefono_cliente       VARCHAR(20)    NOT NULL,
  telefono_domiciliario  VARCHAR(20)    NULL,
  -- Se fija al crear el domicilio, pero se reemplaza al entregar por la ubicación GPS
  -- real capturada en ese momento (sección 6 del documento unificado).
  id_ubicacion           CHAR(36)       NOT NULL,
  productos               TEXT          NOT NULL,
  precio                  DECIMAL(10,2) NOT NULL,
  fecha_hora_creacion    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_hora_entrega     DATETIME       NULL,
  valor_recaudado        DECIMAL(10,2)  NULL,
  -- Cuando metodo_pago = 'Ambos', valor_efectivo + valor_transferencia = valor_recaudado.
  -- Para Efectivo/Transferencia (uno solo), el backend igual llena las dos columnas
  -- (una con el monto completo, la otra en 0) para que cualquier reporte que sume
  -- estas dos columnas no tenga que hacer casos especiales por método.
  valor_efectivo         DECIMAL(10,2)  NULL,
  valor_transferencia    DECIMAL(10,2)  NULL,
  metodo_pago            ENUM('Efectivo', 'Transferencia', 'Ambos') NULL,
  estado                 ENUM('Asignado', 'En_curso', 'Entregado', 'Cancelado') NOT NULL DEFAULT 'En_curso',
  distancia_km           DOUBLE         NULL,
  -- Punto GPS del domiciliario en el momento en que el domicilio pasa a "En_curso"
  -- (al crearlo él mismo, o al recogerlo si lo asignó el Admin) — junto con la
  -- ubicación de entrega, es lo que permite calcular distancia_km con Haversine sin
  -- depender de un tracking continuo en segundo plano (poco confiable con la
  -- pantalla bloqueada o la app en background durante una entrega real).
  latitud_recogida       DOUBLE         NULL,
  longitud_recogida      DOUBLE         NULL,
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

  -- El baúl físico tiene 3 secciones con 3 espacios cada una (imagenes/Baul.png)
  -- — 9 espacios en total, numerados 1-9. Mantener sincronizado con
  -- ESPACIOS_VALIDOS en server/modules/domicilios/domicilios.service.js y en
  -- Fasteroid/modules/domicilios/components/EspacioBaulSelector.js.
  CONSTRAINT chk_domicilio_espacio_baul CHECK (espacio_baul IS NULL OR espacio_baul BETWEEN 1 AND 9),
  CONSTRAINT chk_domicilio_motivo_cancelacion CHECK (estado <> 'Cancelado' OR motivo_cancelacion IS NOT NULL),

  -- Máximo 9 domicilios "En_curso" por domiciliario, uno por espacio de baúl (sección 16).
  UNIQUE KEY domicilio_espacio_activo_unico (telefono_domiciliario, espacio_activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Un registro por compra/lote recibido de un proveedor — alimenta el inventario
-- calculado (comprado - vendido) del módulo de inventario.
CREATE TABLE lote_compra (
  id_lote            CHAR(36)      PRIMARY KEY,
  id_producto        CHAR(36)      NOT NULL,
  id_proveedor       CHAR(36)      NOT NULL,
  numero_lote        VARCHAR(100)  NULL,
  cantidad_comprada  INT           NOT NULL,
  -- Lo que costó cada unidad en ESTA compra (no el precio de venta) — alimenta el
  -- margen de ganancia del producto (precio_venta - costo promedio ponderado de sus
  -- lotes). NULL en lotes viejos de antes de este campo; obligatorio de acá en
  -- adelante (ver createLote/createLotesBulk en lotes.service.js).
  costo_unitario     DECIMAL(10,2) NULL,
  fecha_caducidad    DATE          NULL,
  fecha_compra       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT lote_compra_producto_fkey
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT lote_compra_proveedor_fkey
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_lote_cantidad CHECK (cantidad_comprada > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Líneas de venta: qué productos y cuántos llevaba cada domicilio. Es la fuente de
-- verdad para inventario y (más adelante) reportes de ventas — domicilio.productos
-- sigue siendo un texto de despliegue generado a partir de estas líneas al crear el
-- domicilio, para que toda la UI que ya lo muestra siga funcionando sin cambios.
CREATE TABLE domicilio_producto (
  id_domicilio_producto  CHAR(36)      PRIMARY KEY,
  id_domicilio           CHAR(36)      NOT NULL,
  id_producto            CHAR(36)      NOT NULL,
  cantidad               INT           NOT NULL,
  -- Precio del producto al momento de la venta (no el de hoy) — si el precio del
  -- catálogo cambia después, el historial de ventas no debe verse afectado.
  precio_unitario        DECIMAL(10,2) NOT NULL,
  CONSTRAINT domicilio_producto_domicilio_fkey
    FOREIGN KEY (id_domicilio) REFERENCES domicilio(id_domicilio)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT domicilio_producto_producto_fkey
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_domicilio_producto_cantidad CHECK (cantidad > 0)
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

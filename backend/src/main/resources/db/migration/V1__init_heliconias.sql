CREATE SCHEMA IF NOT EXISTS heliconias;
SET search_path TO heliconias;

CREATE TABLE IF NOT EXISTS roles (
    id_rol              SERIAL PRIMARY KEY,
    nombre              VARCHAR(50) NOT NULL UNIQUE,
    descripcion         VARCHAR(200),
    estado              BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario          SERIAL PRIMARY KEY,
    id_rol              INT NOT NULL,
    nombres             VARCHAR(100) NOT NULL,
    apellidos           VARCHAR(100) NOT NULL,
    username            VARCHAR(50) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    correo              VARCHAR(120),
    telefono            VARCHAR(20),
    estado              BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acceso       TIMESTAMP,
    fecha_creacion      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

CREATE TABLE IF NOT EXISTS clientes (
    id_cliente          SERIAL PRIMARY KEY,
    tipo_documento      VARCHAR(20) NOT NULL,
    nro_documento       VARCHAR(20) NOT NULL UNIQUE,
    nombres             VARCHAR(100) NOT NULL,
    apellidos           VARCHAR(100),
    telefono            VARCHAR(20),
    correo              VARCHAR(120),
    direccion           VARCHAR(200),
    observaciones       TEXT,
    estado              BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zonas (
    id_zona             SERIAL PRIMARY KEY,
    nombre              VARCHAR(80) NOT NULL UNIQUE,
    descripcion         VARCHAR(200),
    estado              BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mesas (
    id_mesa             SERIAL PRIMARY KEY,
    id_zona             INT NOT NULL,
    codigo_mesa         VARCHAR(20) NOT NULL UNIQUE,
    capacidad           INT NOT NULL CHECK (capacidad > 0),
    estado_operativo    VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
    observaciones       VARCHAR(250),
    fecha_creacion      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mesa_zona
        FOREIGN KEY (id_zona) REFERENCES zonas(id_zona),
    CONSTRAINT chk_estado_operativo_mesa
        CHECK (estado_operativo IN ('DISPONIBLE', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO', 'INACTIVA'))
);

CREATE TABLE IF NOT EXISTS categorias_producto (
    id_categoria        SERIAL PRIMARY KEY,
    nombre              VARCHAR(80) NOT NULL UNIQUE,
    descripcion         VARCHAR(200),
    estado              BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
    id_producto         SERIAL PRIMARY KEY,
    id_categoria        INT NOT NULL,
    codigo_producto     VARCHAR(20) NOT NULL UNIQUE,
    nombre              VARCHAR(120) NOT NULL,
    descripcion         VARCHAR(250),
    precio_venta        NUMERIC(12,2) NOT NULL CHECK (precio_venta >= 0),
    costo_referencial   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (costo_referencial >= 0),
    stock_controlado    BOOLEAN NOT NULL DEFAULT FALSE,
    stock_actual        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    unidad_medida       VARCHAR(20) NOT NULL DEFAULT 'UNIDAD',
    foto_url            VARCHAR(255),
    estado              BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (id_categoria) REFERENCES categorias_producto(id_categoria)
);

CREATE TABLE IF NOT EXISTS reservas (
    id_reserva              SERIAL PRIMARY KEY,
    codigo_reserva          VARCHAR(20) NOT NULL UNIQUE,
    id_cliente              INT NOT NULL,
    id_mesa                 INT NOT NULL,
    fecha_reserva           DATE NOT NULL,
    hora_inicio             TIME NOT NULL,
    hora_fin                TIME NOT NULL,
    cantidad_personas       INT NOT NULL CHECK (cantidad_personas > 0),
    estado_reserva          VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    observaciones           TEXT,
    id_usuario_registro     INT NOT NULL,
    fecha_registro          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reserva_cliente
        FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    CONSTRAINT fk_reserva_mesa
        FOREIGN KEY (id_mesa) REFERENCES mesas(id_mesa),
    CONSTRAINT fk_reserva_usuario
        FOREIGN KEY (id_usuario_registro) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_estado_reserva
        CHECK (estado_reserva IN ('PENDIENTE', 'CONFIRMADA', 'EN_USO', 'FINALIZADA', 'CANCELADA', 'NO_ASISTIO')),
    CONSTRAINT chk_hora_reserva
        CHECK (hora_fin > hora_inicio)
);

CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido                SERIAL PRIMARY KEY,
    codigo_pedido            VARCHAR(20) NOT NULL UNIQUE,
    id_reserva               INT,
    id_mesa                  INT NOT NULL,
    id_cliente               INT,
    fecha_pedido             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre             TIMESTAMP,
    estado_pedido            VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
    subtotal                 NUMERIC(12,2) NOT NULL DEFAULT 0,
    descuento                NUMERIC(12,2) NOT NULL DEFAULT 0,
    igv                      NUMERIC(12,2) NOT NULL DEFAULT 0,
    total                    NUMERIC(12,2) NOT NULL DEFAULT 0,
    observaciones            TEXT,
    id_usuario_registro      INT NOT NULL,
    CONSTRAINT fk_pedido_reserva
        FOREIGN KEY (id_reserva) REFERENCES reservas(id_reserva),
    CONSTRAINT fk_pedido_mesa
        FOREIGN KEY (id_mesa) REFERENCES mesas(id_mesa),
    CONSTRAINT fk_pedido_cliente
        FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    CONSTRAINT fk_pedido_usuario
        FOREIGN KEY (id_usuario_registro) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_estado_pedido
        CHECK (estado_pedido IN ('ABIERTO', 'EN_PREPARACION', 'ATENDIDO', 'CERRADO', 'ANULADO'))
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
    id_detalle_pedido        SERIAL PRIMARY KEY,
    id_pedido                INT NOT NULL,
    id_producto              INT NOT NULL,
    cantidad                 NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),
    precio_unitario          NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
    descuento_item           NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (descuento_item >= 0),
    subtotal_item            NUMERIC(12,2) NOT NULL DEFAULT 0,
    observaciones            VARCHAR(250),
    CONSTRAINT fk_detalle_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE IF NOT EXISTS metodos_pago (
    id_metodo_pago       SERIAL PRIMARY KEY,
    nombre               VARCHAR(50) NOT NULL UNIQUE,
    descripcion          VARCHAR(200),
    estado               BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS simulaciones_pago (
    id_simulacion            SERIAL PRIMARY KEY,
    id_pedido                INT NOT NULL,
    subtotal                 NUMERIC(12,2) NOT NULL DEFAULT 0,
    descuento                NUMERIC(12,2) NOT NULL DEFAULT 0,
    igv                      NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_simulado           NUMERIC(12,2) NOT NULL DEFAULT 0,
    monto_recibido           NUMERIC(12,2) NOT NULL DEFAULT 0,
    vuelto_estimado          NUMERIC(12,2) NOT NULL DEFAULT 0,
    metodo_pago_sugerido     VARCHAR(50),
    fecha_simulacion         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario               INT NOT NULL,
    CONSTRAINT fk_simulacion_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_simulacion_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS pagos (
    id_pago                  SERIAL PRIMARY KEY,
    id_pedido                INT NOT NULL,
    fecha_pago               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monto_pagado             NUMERIC(12,2) NOT NULL CHECK (monto_pagado >= 0),
    id_metodo_pago           INT NOT NULL,
    numero_operacion         VARCHAR(100),
    observaciones            TEXT,
    estado_pago              VARCHAR(20) NOT NULL DEFAULT 'PAGADO',
    id_usuario_registro      INT NOT NULL,
    CONSTRAINT fk_pago_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_pago_metodo
        FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago(id_metodo_pago),
    CONSTRAINT fk_pago_usuario
        FOREIGN KEY (id_usuario_registro) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_estado_pago
        CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'ANULADO', 'REEMBOLSADO'))
);

CREATE TABLE IF NOT EXISTS cajas (
    id_caja              SERIAL PRIMARY KEY,
    nombre               VARCHAR(80) NOT NULL UNIQUE,
    descripcion          VARCHAR(200),
    estado               BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS aperturas_caja (
    id_apertura              SERIAL PRIMARY KEY,
    id_caja                  INT NOT NULL,
    fecha_apertura           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monto_inicial            NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monto_inicial >= 0),
    monto_cierre             NUMERIC(12,2),
    fecha_cierre             TIMESTAMP,
    estado                   VARCHAR(20) NOT NULL DEFAULT 'ABIERTA',
    id_usuario_apertura      INT NOT NULL,
    id_usuario_cierre        INT,
    CONSTRAINT fk_apertura_caja
        FOREIGN KEY (id_caja) REFERENCES cajas(id_caja),
    CONSTRAINT fk_apertura_usuario
        FOREIGN KEY (id_usuario_apertura) REFERENCES usuarios(id_usuario),
        CONSTRAINT fk_cierre_usuario
        FOREIGN KEY (id_usuario_cierre) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_estado_apertura
        CHECK (estado IN ('ABIERTA', 'CERRADA'))
);

CREATE TABLE IF NOT EXISTS movimientos_caja (
    id_movimiento            SERIAL PRIMARY KEY,
    id_apertura              INT NOT NULL,
    tipo_movimiento          VARCHAR(20) NOT NULL,
    concepto                 VARCHAR(150) NOT NULL,
    monto                    NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
    referencia               VARCHAR(120),
    fecha_movimiento         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario               INT NOT NULL,
    CONSTRAINT fk_movimiento_apertura
        FOREIGN KEY (id_apertura) REFERENCES aperturas_caja(id_apertura),
    CONSTRAINT fk_movimiento_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_tipo_movimiento
        CHECK (tipo_movimiento IN ('INGRESO', 'EGRESO'))
);

CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria             SERIAL PRIMARY KEY,
    tabla_afectada           VARCHAR(100) NOT NULL,
    accion                   VARCHAR(20) NOT NULL,
    id_registro_afectado     VARCHAR(50),
    valores_anteriores       JSONB,
    valores_nuevos           JSONB,
    fecha_accion             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario               INT,
    ip_equipo                VARCHAR(50),
    CONSTRAINT fk_auditoria_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas(fecha_reserva);
CREATE INDEX IF NOT EXISTS idx_reservas_mesa ON reservas(id_mesa);
CREATE INDEX IF NOT EXISTS idx_reservas_cliente ON reservas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_mesa ON pedidos(id_mesa);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_pedido ON pagos(id_pedido);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_caja(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha_accion);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);

CREATE OR REPLACE FUNCTION fn_calcular_subtotal_item()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subtotal_item := (NEW.cantidad * NEW.precio_unitario) - NEW.descuento_item;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calcular_subtotal_item ON detalle_pedido;
CREATE TRIGGER trg_calcular_subtotal_item
BEFORE INSERT OR UPDATE ON detalle_pedido
FOR EACH ROW
EXECUTE FUNCTION fn_calcular_subtotal_item();

CREATE OR REPLACE FUNCTION fn_recalcular_totales_pedido(p_id_pedido INT)
RETURNS VOID AS $$
DECLARE
    v_subtotal NUMERIC(12,2);
    v_descuento NUMERIC(12,2);
    v_igv NUMERIC(12,2);
    v_total NUMERIC(12,2);
BEGIN
    SELECT COALESCE(SUM(subtotal_item), 0)
      INTO v_subtotal
      FROM detalle_pedido
     WHERE id_pedido = p_id_pedido;

    SELECT COALESCE(descuento, 0)
      INTO v_descuento
      FROM pedidos
     WHERE id_pedido = p_id_pedido;

    v_igv := ROUND((v_subtotal - v_descuento) * 0.18, 2);
    v_total := ROUND((v_subtotal - v_descuento) + v_igv, 2);

    UPDATE pedidos
       SET subtotal = v_subtotal,
           igv = v_igv,
           total = v_total
     WHERE id_pedido = p_id_pedido;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_trigger_recalcular_pedido()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM fn_recalcular_totales_pedido(OLD.id_pedido);
        RETURN OLD;
    ELSE
        PERFORM fn_recalcular_totales_pedido(NEW.id_pedido);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalcular_pedido_ins_upd ON detalle_pedido;
CREATE TRIGGER trg_recalcular_pedido_ins_upd
AFTER INSERT OR UPDATE ON detalle_pedido
FOR EACH ROW
EXECUTE FUNCTION fn_trigger_recalcular_pedido();

DROP TRIGGER IF EXISTS trg_recalcular_pedido_del ON detalle_pedido;
CREATE TRIGGER trg_recalcular_pedido_del
AFTER DELETE ON detalle_pedido
FOR EACH ROW
EXECUTE FUNCTION fn_trigger_recalcular_pedido();

CREATE OR REPLACE FUNCTION fn_validar_cruce_reservas()
RETURNS TRIGGER AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*)
      INTO v_count
      FROM reservas r
     WHERE r.id_mesa = NEW.id_mesa
       AND r.fecha_reserva = NEW.fecha_reserva
       AND r.estado_reserva IN ('PENDIENTE', 'CONFIRMADA', 'EN_USO')
       AND r.id_reserva <> COALESCE(NEW.id_reserva, -1)
       AND (
            NEW.hora_inicio < r.hora_fin
            AND NEW.hora_fin > r.hora_inicio
       );

    IF v_count > 0 THEN
        RAISE EXCEPTION 'La mesa ya tiene una reserva en ese rango horario';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_cruce_reservas ON reservas;
CREATE TRIGGER trg_validar_cruce_reservas
BEFORE INSERT OR UPDATE ON reservas
FOR EACH ROW
EXECUTE FUNCTION fn_validar_cruce_reservas();

CREATE OR REPLACE FUNCTION fn_registrar_movimiento_caja_por_pago()
RETURNS TRIGGER AS $$
DECLARE
    v_apertura INT;
BEGIN
    IF NEW.estado_pago = 'PAGADO' THEN
        SELECT ac.id_apertura
          INTO v_apertura
          FROM aperturas_caja ac
         WHERE ac.estado = 'ABIERTA'
         ORDER BY ac.fecha_apertura DESC
         LIMIT 1;

        IF v_apertura IS NOT NULL THEN
            INSERT INTO movimientos_caja (
                id_apertura,
                tipo_movimiento,
                concepto,
                monto,
                referencia,
                fecha_movimiento,
                id_usuario
            ) VALUES (
                v_apertura,
                'INGRESO',
                'Cobro de pedido',
                NEW.monto_pagado,
                'Pago ID ' || NEW.id_pago || ' / Pedido ID ' || NEW.id_pedido,
                CURRENT_TIMESTAMP,
                NEW.id_usuario_registro
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pago_movimiento_caja ON pagos;
CREATE TRIGGER trg_pago_movimiento_caja
AFTER INSERT ON pagos
FOR EACH ROW
EXECUTE FUNCTION fn_registrar_movimiento_caja_por_pago();

CREATE OR REPLACE FUNCTION fn_auditoria_generica()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id INT;
BEGIN
    BEGIN
        v_user_id := current_setting('app.current_user_id', true)::INT;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria(tabla_afectada, accion, id_registro_afectado, valores_nuevos, id_usuario)
        VALUES (TG_TABLE_NAME, TG_OP, NULL, to_jsonb(NEW), v_user_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO auditoria(tabla_afectada, accion, id_registro_afectado, valores_anteriores, valores_nuevos, id_usuario)
        VALUES (TG_TABLE_NAME, TG_OP, NULL, to_jsonb(OLD), to_jsonb(NEW), v_user_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria(tabla_afectada, accion, id_registro_afectado, valores_anteriores, id_usuario)
        VALUES (TG_TABLE_NAME, TG_OP, NULL, to_jsonb(OLD), v_user_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditoria_reservas ON reservas;
CREATE TRIGGER trg_auditoria_reservas
AFTER INSERT OR UPDATE OR DELETE ON reservas
FOR EACH ROW EXECUTE FUNCTION fn_auditoria_generica();

DROP TRIGGER IF EXISTS trg_auditoria_pedidos ON pedidos;
CREATE TRIGGER trg_auditoria_pedidos
AFTER INSERT OR UPDATE OR DELETE ON pedidos
FOR EACH ROW EXECUTE FUNCTION fn_auditoria_generica();

DROP TRIGGER IF EXISTS trg_auditoria_pagos ON pagos;
CREATE TRIGGER trg_auditoria_pagos
AFTER INSERT OR UPDATE OR DELETE ON pagos
FOR EACH ROW EXECUTE FUNCTION fn_auditoria_generica();

DROP TRIGGER IF EXISTS trg_auditoria_productos ON productos;
CREATE TRIGGER trg_auditoria_productos
AFTER INSERT OR UPDATE OR DELETE ON productos
FOR EACH ROW EXECUTE FUNCTION fn_auditoria_generica();

CREATE OR REPLACE FUNCTION sp_reservar_mesa(
    p_codigo_reserva VARCHAR,
    p_id_cliente INT,
    p_id_mesa INT,
    p_fecha_reserva DATE,
    p_hora_inicio TIME,
    p_hora_fin TIME,
    p_cantidad_personas INT,
    p_observaciones TEXT,
    p_id_usuario INT
) RETURNS INT AS $$
DECLARE
    v_id_reserva INT;
BEGIN
    INSERT INTO reservas (
        codigo_reserva,
        id_cliente,
        id_mesa,
        fecha_reserva,
        hora_inicio,
        hora_fin,
        cantidad_personas,
        estado_reserva,
        observaciones,
        id_usuario_registro
    ) VALUES (
        p_codigo_reserva,
        p_id_cliente,
        p_id_mesa,
        p_fecha_reserva,
        p_hora_inicio,
        p_hora_fin,
        p_cantidad_personas,
        'PENDIENTE',
        p_observaciones,
        p_id_usuario
    ) RETURNING id_reserva INTO v_id_reserva;

    RETURN v_id_reserva;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_cerrar_pedido(p_id_pedido INT)
RETURNS VOID AS $$
BEGIN
    UPDATE pedidos
       SET estado_pedido = 'CERRADO',
           fecha_cierre = CURRENT_TIMESTAMP
     WHERE id_pedido = p_id_pedido;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_registrar_pago(
    p_id_pedido INT,
    p_monto NUMERIC,
    p_id_metodo_pago INT,
    p_numero_operacion VARCHAR,
    p_observaciones TEXT,
    p_id_usuario INT
) RETURNS INT AS $$
DECLARE
    v_id_pago INT;
BEGIN
    INSERT INTO pagos (
        id_pedido,
        monto_pagado,
        id_metodo_pago,
        numero_operacion,
        observaciones,
        estado_pago,
        id_usuario_registro
    ) VALUES (
        p_id_pedido,
        p_monto,
        p_id_metodo_pago,
        p_numero_operacion,
        p_observaciones,
        'PAGADO',
        p_id_usuario
    ) RETURNING id_pago INTO v_id_pago;

    UPDATE pedidos
       SET estado_pedido = 'CERRADO',
           fecha_cierre = CURRENT_TIMESTAMP
     WHERE id_pedido = p_id_pedido;

    RETURN v_id_pago;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW vw_reservas_detalle AS
SELECT
    r.id_reserva,
    r.codigo_reserva,
    r.fecha_reserva,
    r.hora_inicio,
    r.hora_fin,
    r.cantidad_personas,
    r.estado_reserva,
    c.nombres || ' ' || COALESCE(c.apellidos,'') AS cliente,
    m.codigo_mesa,
    z.nombre AS zona,
    u.username AS registrado_por
FROM reservas r
JOIN clientes c ON c.id_cliente = r.id_cliente
JOIN mesas m ON m.id_mesa = r.id_mesa
JOIN zonas z ON z.id_zona = m.id_zona
JOIN usuarios u ON u.id_usuario = r.id_usuario_registro;

CREATE OR REPLACE VIEW vw_pedidos_detalle AS
SELECT
    p.id_pedido,
    p.codigo_pedido,
    p.fecha_pedido,
    p.estado_pedido,
    p.subtotal,
    p.descuento,
    p.igv,
    p.total,
    m.codigo_mesa,
    c.nombres || ' ' || COALESCE(c.apellidos,'') AS cliente,
    u.username AS registrado_por
FROM pedidos p
JOIN mesas m ON m.id_mesa = p.id_mesa
LEFT JOIN clientes c ON c.id_cliente = p.id_cliente
JOIN usuarios u ON u.id_usuario = p.id_usuario_registro;

CREATE OR REPLACE VIEW vw_ventas_pagadas AS
SELECT
    pg.id_pago,
    pg.fecha_pago,
    pg.monto_pagado,
    mp.nombre AS metodo_pago,
    p.codigo_pedido,
    p.total AS total_pedido,
    m.codigo_mesa
FROM pagos pg
JOIN metodos_pago mp ON mp.id_metodo_pago = pg.id_metodo_pago
JOIN pedidos p ON p.id_pedido = pg.id_pedido
JOIN mesas m ON m.id_mesa = p.id_mesa
WHERE pg.estado_pago = 'PAGADO';

INSERT INTO roles(nombre, descripcion)
SELECT 'ADMINISTRADOR', 'Control total del sistema'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'ADMINISTRADOR');

INSERT INTO roles(nombre, descripcion)
SELECT 'OPERADOR', 'Registro operativo del sistema'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'OPERADOR');

INSERT INTO usuarios(id_rol, nombres, apellidos, username, password_hash, correo, telefono)
SELECT 1, 'Admin', 'Sistema', 'admin', 'Admin2026*', 'admin@heliconias.pe', '999111222'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'admin');

INSERT INTO usuarios(id_rol, nombres, apellidos, username, password_hash, correo, telefono)
SELECT 2, 'Operador', 'Sistema', 'operador', 'Operador2026*', 'operador@heliconias.pe', '999333444'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE username = 'operador');

INSERT INTO clientes(tipo_documento, nro_documento, nombres, apellidos, telefono, correo, direccion)
SELECT 'DNI', '12345678', 'Carlos', 'Ramirez', '987654321', 'carlos@gmail.com', 'Pucallpa'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nro_documento = '12345678');

INSERT INTO clientes(tipo_documento, nro_documento, nombres, apellidos, telefono, correo, direccion)
SELECT 'DNI', '87654321', 'Mariela', 'Soto', '912345678', 'mariela@gmail.com', 'Calleria'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nro_documento = '87654321');

INSERT INTO clientes(tipo_documento, nro_documento, nombres, apellidos, telefono, correo, direccion)
SELECT 'RUC', '20123456789', 'Empresa', 'Amazónica', '901111111', 'ventas@amazonica.pe', 'Yarinacocha'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nro_documento = '20123456789');

INSERT INTO zonas(nombre, descripcion)
SELECT 'TERRAZA', 'Zona principal al aire libre'
WHERE NOT EXISTS (SELECT 1 FROM zonas WHERE nombre = 'TERRAZA');

INSERT INTO zonas(nombre, descripcion)
SELECT 'PISCINA', 'Zona contigua a piscina'
WHERE NOT EXISTS (SELECT 1 FROM zonas WHERE nombre = 'PISCINA');

INSERT INTO zonas(nombre, descripcion)
SELECT 'JARDIN', 'Zona campestre'
WHERE NOT EXISTS (SELECT 1 FROM zonas WHERE nombre = 'JARDIN');

INSERT INTO zonas(nombre, descripcion)
SELECT 'SALON_TECHADO', 'Área de eventos y lluvia'
WHERE NOT EXISTS (SELECT 1 FROM zonas WHERE nombre = 'SALON_TECHADO');

INSERT INTO mesas(id_zona, codigo_mesa, capacidad, estado_operativo, observaciones)
SELECT 1, 'M01', 4, 'DISPONIBLE', NULL
WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE codigo_mesa = 'M01');

INSERT INTO mesas(id_zona, codigo_mesa, capacidad, estado_operativo, observaciones)
SELECT 1, 'M02', 4, 'DISPONIBLE', NULL
WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE codigo_mesa = 'M02');

INSERT INTO mesas(id_zona, codigo_mesa, capacidad, estado_operativo, observaciones)
SELECT 2, 'M03', 6, 'DISPONIBLE', 'Vista a piscina'
WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE codigo_mesa = 'M03');

INSERT INTO mesas(id_zona, codigo_mesa, capacidad, estado_operativo, observaciones)
SELECT 2, 'M04', 8, 'DISPONIBLE', NULL
WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE codigo_mesa = 'M04');

INSERT INTO mesas(id_zona, codigo_mesa, capacidad, estado_operativo, observaciones)
SELECT 3, 'M05', 10, 'DISPONIBLE', 'Ideal para grupos'
WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE codigo_mesa = 'M05');

INSERT INTO mesas(id_zona, codigo_mesa, capacidad, estado_operativo, observaciones)
SELECT 4, 'M06', 12, 'DISPONIBLE', 'Área techada'
WHERE NOT EXISTS (SELECT 1 FROM mesas WHERE codigo_mesa = 'M06');

INSERT INTO categorias_producto(nombre, descripcion)
SELECT 'PLATOS', 'Comidas principales'
WHERE NOT EXISTS (SELECT 1 FROM categorias_producto WHERE nombre = 'PLATOS');

INSERT INTO categorias_producto(nombre, descripcion)
SELECT 'BEBIDAS', 'Bebidas frías y calientes'
WHERE NOT EXISTS (SELECT 1 FROM categorias_producto WHERE nombre = 'BEBIDAS');

INSERT INTO categorias_producto(nombre, descripcion)
SELECT 'COCTELES', 'Licores y mezclas'
WHERE NOT EXISTS (SELECT 1 FROM categorias_producto WHERE nombre = 'COCTELES');

INSERT INTO categorias_producto(nombre, descripcion)
SELECT 'POSTRES', 'Dulces y postres'
WHERE NOT EXISTS (SELECT 1 FROM categorias_producto WHERE nombre = 'POSTRES');

INSERT INTO productos(id_categoria, codigo_producto, nombre, descripcion, precio_venta, costo_referencial, stock_controlado, stock_actual, stock_minimo, unidad_medida, foto_url)
SELECT 1, 'P001', 'Juane', 'Plato regional', 25.00, 12.00, FALSE, 0, 0, 'PLATO', NULL
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE codigo_producto = 'P001');

INSERT INTO productos(id_categoria, codigo_producto, nombre, descripcion, precio_venta, costo_referencial, stock_controlado, stock_actual, stock_minimo, unidad_medida, foto_url)
SELECT 1, 'P002', 'Cecina con tacacho', 'Plato regional', 30.00, 15.00, FALSE, 0, 0, 'PLATO', NULL
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE codigo_producto = 'P002');

INSERT INTO productos(id_categoria, codigo_producto, nombre, descripcion, precio_venta, costo_referencial, stock_controlado, stock_actual, stock_minimo, unidad_medida, foto_url)
SELECT 2, 'P003', 'Gaseosa 500ml', 'Bebida gaseosa', 5.00, 2.50, TRUE, 100, 10, 'BOTELLA', NULL
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE codigo_producto = 'P003');

INSERT INTO productos(id_categoria, codigo_producto, nombre, descripcion, precio_venta, costo_referencial, stock_controlado, stock_actual, stock_minimo, unidad_medida, foto_url)
SELECT 2, 'P004', 'Agua mineral', 'Agua sin gas', 4.00, 1.50, TRUE, 80, 10, 'BOTELLA', NULL
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE codigo_producto = 'P004');

INSERT INTO productos(id_categoria, codigo_producto, nombre, descripcion, precio_venta, costo_referencial, stock_controlado, stock_actual, stock_minimo, unidad_medida, foto_url)
SELECT 3, 'P005', 'Mojito', 'Cóctel clásico', 18.00, 8.00, FALSE, 0, 0, 'VASO', NULL
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE codigo_producto = 'P005');

INSERT INTO productos(id_categoria, codigo_producto, nombre, descripcion, precio_venta, costo_referencial, stock_controlado, stock_actual, stock_minimo, unidad_medida, foto_url)
SELECT 4, 'P006', 'Cheesecake', 'Porción de postre', 12.00, 4.50, FALSE, 0, 0, 'PORCION', NULL
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE codigo_producto = 'P006');

INSERT INTO metodos_pago(nombre, descripcion)
SELECT 'EFECTIVO', 'Pago en efectivo'
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE nombre = 'EFECTIVO');

INSERT INTO metodos_pago(nombre, descripcion)
SELECT 'YAPE', 'Pago con Yape'
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE nombre = 'YAPE');

INSERT INTO metodos_pago(nombre, descripcion)
SELECT 'PLIN', 'Pago con Plin'
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE nombre = 'PLIN');

INSERT INTO metodos_pago(nombre, descripcion)
SELECT 'TARJETA', 'Pago con tarjeta'
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE nombre = 'TARJETA');

INSERT INTO metodos_pago(nombre, descripcion)
SELECT 'TRANSFERENCIA', 'Transferencia bancaria'
WHERE NOT EXISTS (SELECT 1 FROM metodos_pago WHERE nombre = 'TRANSFERENCIA');

INSERT INTO cajas(nombre, descripcion)
SELECT 'CAJA PRINCIPAL', 'Caja principal del recreo'
WHERE NOT EXISTS (SELECT 1 FROM cajas WHERE nombre = 'CAJA PRINCIPAL');

INSERT INTO aperturas_caja(id_caja, monto_inicial, estado, id_usuario_apertura)
SELECT 1, 200.00, 'ABIERTA', 1
WHERE NOT EXISTS (SELECT 1 FROM aperturas_caja WHERE id_caja = 1 AND estado = 'ABIERTA');

INSERT INTO reservas(codigo_reserva, id_cliente, id_mesa, fecha_reserva, hora_inicio, hora_fin, cantidad_personas, estado_reserva, observaciones, id_usuario_registro)
SELECT 'R0001', 1, 1, CURRENT_DATE, '12:00', '14:00', 4, 'CONFIRMADA', 'Reserva familiar', 2
WHERE NOT EXISTS (SELECT 1 FROM reservas WHERE codigo_reserva = 'R0001');

INSERT INTO reservas(codigo_reserva, id_cliente, id_mesa, fecha_reserva, hora_inicio, hora_fin, cantidad_personas, estado_reserva, observaciones, id_usuario_registro)
SELECT 'R0002', 2, 3, CURRENT_DATE, '13:00', '16:00', 5, 'PENDIENTE', 'Cumpleaños pequeño', 2
WHERE NOT EXISTS (SELECT 1 FROM reservas WHERE codigo_reserva = 'R0002');

INSERT INTO pedidos(codigo_pedido, id_reserva, id_mesa, id_cliente, estado_pedido, descuento, observaciones, id_usuario_registro)
SELECT 'PD0001', 1, 1, 1, 'ABIERTO', 0, 'Pedido mesa 1', 2
WHERE NOT EXISTS (SELECT 1 FROM pedidos WHERE codigo_pedido = 'PD0001');

INSERT INTO pedidos(codigo_pedido, id_reserva, id_mesa, id_cliente, estado_pedido, descuento, observaciones, id_usuario_registro, fecha_cierre)
SELECT 'PD0002', NULL, 4, 2, 'CERRADO', 5, 'Pedido sin reserva previa', 2, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM pedidos WHERE codigo_pedido = 'PD0002');

INSERT INTO detalle_pedido(id_pedido, id_producto, cantidad, precio_unitario, descuento_item, observaciones)
SELECT 1, 1, 2, 25.00, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM detalle_pedido WHERE id_pedido = 1 AND id_producto = 1);

INSERT INTO detalle_pedido(id_pedido, id_producto, cantidad, precio_unitario, descuento_item, observaciones)
SELECT 1, 3, 4, 5.00, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM detalle_pedido WHERE id_pedido = 1 AND id_producto = 3);

INSERT INTO detalle_pedido(id_pedido, id_producto, cantidad, precio_unitario, descuento_item, observaciones)
SELECT 2, 2, 1, 30.00, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM detalle_pedido WHERE id_pedido = 2 AND id_producto = 2);

INSERT INTO detalle_pedido(id_pedido, id_producto, cantidad, precio_unitario, descuento_item, observaciones)
SELECT 2, 5, 2, 18.00, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM detalle_pedido WHERE id_pedido = 2 AND id_producto = 5);

INSERT INTO detalle_pedido(id_pedido, id_producto, cantidad, precio_unitario, descuento_item, observaciones)
SELECT 2, 6, 1, 12.00, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM detalle_pedido WHERE id_pedido = 2 AND id_producto = 6);

INSERT INTO simulaciones_pago(id_pedido, subtotal, descuento, igv, total_simulado, monto_recibido, vuelto_estimado, metodo_pago_sugerido, id_usuario)
SELECT
    p.id_pedido,
    p.subtotal,
    p.descuento,
    p.igv,
    p.total,
    100.00,
    100.00 - p.total,
    'EFECTIVO',
    2
FROM pedidos p
WHERE p.id_pedido = 2
  AND NOT EXISTS (SELECT 1 FROM simulaciones_pago WHERE id_pedido = 2);

INSERT INTO pagos(id_pedido, monto_pagado, id_metodo_pago, numero_operacion, observaciones, estado_pago, id_usuario_registro)
SELECT
    2,
    total,
    1,
    NULL,
    'Pago completo del pedido PD0002',
    'PAGADO',
    2
FROM pedidos
WHERE id_pedido = 2
  AND NOT EXISTS (SELECT 1 FROM pagos WHERE id_pedido = 2);

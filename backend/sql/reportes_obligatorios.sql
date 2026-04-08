-- Reporte de reservas del día
SELECT
    r.codigo_reserva,
    r.fecha_reserva,
    r.hora_inicio,
    r.hora_fin,
    c.nombres || ' ' || COALESCE(c.apellidos,'') AS cliente,
    m.codigo_mesa,
    z.nombre AS zona,
    r.cantidad_personas,
    r.estado_reserva
FROM heliconias.reservas r
JOIN heliconias.clientes c ON c.id_cliente = r.id_cliente
JOIN heliconias.mesas m ON m.id_mesa = r.id_mesa
JOIN heliconias.zonas z ON z.id_zona = m.id_zona
WHERE r.fecha_reserva = CURRENT_DATE
ORDER BY r.hora_inicio;

-- Disponibilidad de mesas
SELECT
    m.codigo_mesa,
    z.nombre AS zona,
    m.capacidad,
    m.estado_operativo
FROM heliconias.mesas m
JOIN heliconias.zonas z ON z.id_zona = m.id_zona
ORDER BY m.codigo_mesa;

-- Pedidos activos por mesa
SELECT
    m.codigo_mesa,
    p.codigo_pedido,
    p.estado_pedido,
    p.total,
    p.fecha_pedido
FROM heliconias.pedidos p
JOIN heliconias.mesas m ON m.id_mesa = p.id_mesa
WHERE p.estado_pedido IN ('ABIERTO', 'EN_PREPARACION', 'ATENDIDO')
ORDER BY p.fecha_pedido DESC;

-- Ventas del día
SELECT
    DATE(pg.fecha_pago) AS fecha,
    COUNT(*) AS cantidad_pagos,
    COALESCE(SUM(pg.monto_pagado), 0) AS total_vendido
FROM heliconias.pagos pg
WHERE pg.estado_pago = 'PAGADO'
  AND DATE(pg.fecha_pago) = CURRENT_DATE
GROUP BY DATE(pg.fecha_pago);

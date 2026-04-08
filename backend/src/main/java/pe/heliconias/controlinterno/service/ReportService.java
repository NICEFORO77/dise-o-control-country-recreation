package pe.heliconias.controlinterno.service;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ReportService {

    private final JdbcTemplate jdbcTemplate;

    public ReportService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> getRequiredReports() {
        return Map.of(
                "reservasDelDia", query(
                        """
                        SELECT r.codigo_reserva, r.fecha_reserva, r.hora_inicio, r.hora_fin,
                               c.nombres || ' ' || COALESCE(c.apellidos,'') AS cliente,
                               m.codigo_mesa, z.nombre AS zona, r.cantidad_personas, r.estado_reserva
                        FROM heliconias.reservas r
                        JOIN heliconias.clientes c ON c.id_cliente = r.id_cliente
                        JOIN heliconias.mesas m ON m.id_mesa = r.id_mesa
                        JOIN heliconias.zonas z ON z.id_zona = m.id_zona
                        WHERE r.fecha_reserva = CURRENT_DATE
                        ORDER BY r.hora_inicio
                        """
                ),
                "disponibilidadMesas", query(
                        """
                        SELECT m.codigo_mesa, z.nombre AS zona, m.capacidad, m.estado_operativo,
                               CASE
                                   WHEN EXISTS (
                                       SELECT 1
                                       FROM heliconias.reservas r
                                       WHERE r.id_mesa = m.id_mesa
                                         AND r.fecha_reserva = CURRENT_DATE
                                         AND r.estado_reserva IN ('PENDIENTE', 'CONFIRMADA', 'EN_USO')
                                   ) THEN 'NO DISPONIBLE'
                                   ELSE 'DISPONIBLE'
                               END AS disponibilidad_hoy
                        FROM heliconias.mesas m
                        JOIN heliconias.zonas z ON z.id_zona = m.id_zona
                        ORDER BY m.codigo_mesa
                        """
                ),
                "pedidosActivosPorMesa", query(
                        """
                        SELECT m.codigo_mesa, p.codigo_pedido, p.estado_pedido, p.total, p.fecha_pedido
                        FROM heliconias.pedidos p
                        JOIN heliconias.mesas m ON m.id_mesa = p.id_mesa
                        WHERE p.estado_pedido IN ('ABIERTO', 'EN_PREPARACION', 'ATENDIDO')
                        ORDER BY p.fecha_pedido DESC
                        """
                ),
                "ventasDelDia", query(
                        """
                        SELECT DATE(pg.fecha_pago) AS fecha, COUNT(*) AS cantidad_pagos,
                               COALESCE(SUM(pg.monto_pagado), 0) AS total_vendido
                        FROM heliconias.pagos pg
                        WHERE pg.estado_pago = 'PAGADO' AND DATE(pg.fecha_pago) = CURRENT_DATE
                        GROUP BY DATE(pg.fecha_pago)
                        """
                ),
                "ventasPorMetodoPago", query(
                        """
                        SELECT mp.nombre AS metodo_pago, COUNT(*) AS operaciones,
                               COALESCE(SUM(pg.monto_pagado), 0) AS total
                        FROM heliconias.pagos pg
                        JOIN heliconias.metodos_pago mp ON mp.id_metodo_pago = pg.id_metodo_pago
                        WHERE pg.estado_pago = 'PAGADO'
                        GROUP BY mp.nombre
                        ORDER BY total DESC
                        """
                ),
                "cierreCaja", query(
                        """
                        SELECT ac.id_apertura, c.nombre AS caja, ac.fecha_apertura, ac.monto_inicial,
                               COALESCE(SUM(CASE WHEN mc.tipo_movimiento = 'INGRESO' THEN mc.monto ELSE 0 END), 0) AS ingresos,
                               COALESCE(SUM(CASE WHEN mc.tipo_movimiento = 'EGRESO' THEN mc.monto ELSE 0 END), 0) AS egresos,
                               ac.monto_cierre, ac.estado
                        FROM heliconias.aperturas_caja ac
                        JOIN heliconias.cajas c ON c.id_caja = ac.id_caja
                        LEFT JOIN heliconias.movimientos_caja mc ON mc.id_apertura = ac.id_apertura
                        GROUP BY ac.id_apertura, c.nombre, ac.fecha_apertura, ac.monto_inicial, ac.monto_cierre, ac.estado
                        ORDER BY ac.id_apertura DESC
                        """
                ),
                "productosMasVendidos", query(
                        """
                        SELECT p.codigo_producto, p.nombre, cp.nombre AS categoria,
                               COALESCE(SUM(dp.cantidad), 0) AS cantidad_vendida,
                               COALESCE(SUM(dp.subtotal_item), 0) AS total_vendido
                        FROM heliconias.detalle_pedido dp
                        JOIN heliconias.productos p ON p.id_producto = dp.id_producto
                        JOIN heliconias.categorias_producto cp ON cp.id_categoria = p.id_categoria
                        GROUP BY p.codigo_producto, p.nombre, cp.nombre
                        ORDER BY cantidad_vendida DESC, total_vendido DESC
                        LIMIT 10
                        """
                ),
                "reservasCanceladas", query(
                        """
                        SELECT codigo_reserva, fecha_reserva, hora_inicio, hora_fin, estado_reserva, observaciones
                        FROM heliconias.reservas
                        WHERE estado_reserva = 'CANCELADA'
                        ORDER BY fecha_registro DESC
                        """
                ),
                "pedidosAnulados", query(
                        """
                        SELECT codigo_pedido, fecha_pedido, estado_pedido, total, observaciones
                        FROM heliconias.pedidos
                        WHERE estado_pedido = 'ANULADO'
                        ORDER BY fecha_pedido DESC
                        """
                ),
                "auditoriaSistema", query(
                        """
                        SELECT a.id_auditoria, a.tabla_afectada, a.accion, a.fecha_accion, a.id_usuario,
                               u.username AS usuario, a.ip_equipo
                        FROM heliconias.auditoria a
                        LEFT JOIN heliconias.usuarios u ON u.id_usuario = a.id_usuario
                        ORDER BY a.fecha_accion DESC
                        LIMIT 50
                        """
                )
        );
    }

    private List<Map<String, Object>> query(String sql) {
        return jdbcTemplate.queryForList(sql);
    }
}

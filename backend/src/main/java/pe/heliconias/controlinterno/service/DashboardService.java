package pe.heliconias.controlinterno.service;

import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final JdbcTemplate jdbcTemplate;

    public DashboardService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> getSummary() {
        return Map.of(
                "clientes", scalar("SELECT COUNT(*) FROM heliconias.clientes"),
                "reservasHoy", scalar("SELECT COUNT(*) FROM heliconias.reservas WHERE fecha_reserva = CURRENT_DATE"),
                "pedidosActivos", scalar("SELECT COUNT(*) FROM heliconias.pedidos WHERE estado_pedido IN ('ABIERTO', 'EN_PREPARACION', 'ATENDIDO')"),
                "ventasHoy", scalarDecimal("SELECT COALESCE(SUM(monto_pagado), 0) FROM heliconias.pagos WHERE estado_pago = 'PAGADO' AND DATE(fecha_pago) = CURRENT_DATE"),
                "cajaAbierta", scalar("SELECT COUNT(*) FROM heliconias.aperturas_caja WHERE estado = 'ABIERTA'"),
                "productosStockMinimo", scalar("SELECT COUNT(*) FROM heliconias.productos WHERE stock_controlado = TRUE AND stock_actual <= stock_minimo")
        );
    }

    private Number scalar(String sql) {
        return jdbcTemplate.queryForObject(sql, Number.class);
    }

    private Number scalarDecimal(String sql) {
        return jdbcTemplate.queryForObject(sql, Number.class);
    }
}

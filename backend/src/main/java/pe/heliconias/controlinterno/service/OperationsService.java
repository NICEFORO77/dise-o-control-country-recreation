package pe.heliconias.controlinterno.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import pe.heliconias.controlinterno.dto.PaymentSimulationRequest;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class OperationsService {

    private final JdbcTemplate jdbcTemplate;
    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    public OperationsService(JdbcTemplate jdbcTemplate, NamedParameterJdbcTemplate namedParameterJdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedParameterJdbcTemplate = namedParameterJdbcTemplate;
    }

    public Map<String, String> nextCodes() {
        return Map.of(
                "reserva", nextCode("heliconias.reservas", "codigo_reserva", "R", 4),
                "pedido", nextCode("heliconias.pedidos", "codigo_pedido", "PD", 4)
        );
    }

    public Map<String, Object> simulatePayment(PaymentSimulationRequest request) {
        List<Map<String, Object>> pedidos = namedParameterJdbcTemplate.queryForList(
                """
                SELECT id_pedido, subtotal, descuento, igv, total
                FROM heliconias.pedidos
                WHERE id_pedido = :idPedido
                """,
                Map.of("idPedido", request.idPedido())
        );

        if (pedidos.isEmpty()) {
            throw new ResponseStatusException(NOT_FOUND, "Pedido no encontrado para simular pago");
        }

        Map<String, Object> pedido = pedidos.get(0);
        BigDecimal subtotal = asBigDecimal(pedido.get("subtotal"));
        BigDecimal descuento = asBigDecimal(pedido.get("descuento"));
        BigDecimal igv = asBigDecimal(pedido.get("igv"));
        BigDecimal total = asBigDecimal(pedido.get("total"));
        BigDecimal vuelto = request.montoRecibido().subtract(total).setScale(2, RoundingMode.HALF_UP);
        String metodoSugerido = request.montoRecibido().compareTo(total) >= 0 ? "EFECTIVO" : "YAPE";

        Number simulationId = namedParameterJdbcTemplate.queryForObject(
                """
                INSERT INTO heliconias.simulaciones_pago (
                    id_pedido, subtotal, descuento, igv, total_simulado,
                    monto_recibido, vuelto_estimado, metodo_pago_sugerido, id_usuario
                ) VALUES (
                    :idPedido, :subtotal, :descuento, :igv, :totalSimulado,
                    :montoRecibido, :vueltoEstimado, :metodoPagoSugerido, :idUsuario
                )
                RETURNING id_simulacion
                """,
                new MapSqlParameterSource()
                        .addValue("idPedido", request.idPedido())
                        .addValue("subtotal", subtotal)
                        .addValue("descuento", descuento)
                        .addValue("igv", igv)
                        .addValue("totalSimulado", total)
                        .addValue("montoRecibido", request.montoRecibido())
                        .addValue("vueltoEstimado", vuelto)
                        .addValue("metodoPagoSugerido", metodoSugerido)
                        .addValue("idUsuario", request.idUsuario()),
                Number.class
        );

        if (simulationId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "No se pudo registrar la simulación");
        }

        return namedParameterJdbcTemplate.queryForMap(
                """
                SELECT id_simulacion, id_pedido, subtotal, descuento, igv, total_simulado,
                       monto_recibido, vuelto_estimado, metodo_pago_sugerido, fecha_simulacion, id_usuario
                FROM heliconias.simulaciones_pago
                WHERE id_simulacion = :idSimulacion
                """,
                Map.of("idSimulacion", simulationId.intValue())
        );
    }

    private String nextCode(String table, String column, String prefix, int digits) {
        Integer next = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(MAX(CAST(SUBSTRING(%s FROM %d) AS INTEGER)), 0) + 1
                FROM %s
                """.formatted(column, prefix.length() + 1, table),
                Integer.class
        );
        int value = next == null ? 1 : next;
        return prefix + String.format("%0" + digits + "d", value);
    }

    private BigDecimal asBigDecimal(Object value) {
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        return new BigDecimal(String.valueOf(value)).setScale(2, RoundingMode.HALF_UP);
    }
}

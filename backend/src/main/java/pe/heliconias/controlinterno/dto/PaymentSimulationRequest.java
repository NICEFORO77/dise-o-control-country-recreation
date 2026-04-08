package pe.heliconias.controlinterno.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PaymentSimulationRequest(
        @NotNull Integer idPedido,
        @NotNull @DecimalMin("0.00") BigDecimal montoRecibido,
        @NotNull Integer idUsuario
) {
}

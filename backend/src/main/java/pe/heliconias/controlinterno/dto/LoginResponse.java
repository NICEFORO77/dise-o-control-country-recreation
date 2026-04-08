package pe.heliconias.controlinterno.dto;

import java.util.Map;

public record LoginResponse(
        String token,
        String tokenType,
        Map<String, Object> user
) {
}

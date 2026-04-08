package pe.heliconias.controlinterno.security;

public record AuthenticatedUser(
        Integer id,
        String username,
        String role,
        String fullName
) {
}

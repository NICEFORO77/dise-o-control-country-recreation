package pe.heliconias.controlinterno.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import pe.heliconias.controlinterno.dto.LoginRequest;
import pe.heliconias.controlinterno.dto.LoginResponse;
import pe.heliconias.controlinterno.security.AuthenticatedUser;
import pe.heliconias.controlinterno.security.JwtService;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class AuthService {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        Map<String, Object> user = findUserByUsername(request.username());
        String passwordHash = String.valueOf(user.get("password_hash"));
        if (!passwordEncoder.matches(request.password(), passwordHash)) {
            throw new ResponseStatusException(UNAUTHORIZED, "Credenciales inválidas");
        }

        Integer userId = ((Number) user.get("id_usuario")).intValue();
        jdbcTemplate.update(
                "UPDATE heliconias.usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id_usuario = ?",
                userId
        );

        AuthenticatedUser authenticatedUser = new AuthenticatedUser(
                userId,
                String.valueOf(user.get("username")),
                String.valueOf(user.get("rol")),
                user.get("nombres") + " " + user.get("apellidos")
        );

        return new LoginResponse(
                jwtService.generateToken(authenticatedUser),
                "Bearer",
                profileMap(authenticatedUser, user)
        );
    }

    public Map<String, Object> me(AuthenticatedUser user) {
        return profileMap(user, findUserByUsername(user.username()));
    }

    private Map<String, Object> findUserByUsername(String username) {
        List<Map<String, Object>> users = jdbcTemplate.queryForList(
                """
                SELECT u.id_usuario, u.id_rol, u.nombres, u.apellidos, u.username, u.password_hash,
                       u.correo, u.telefono, u.estado, u.ultimo_acceso, r.nombre AS rol
                FROM heliconias.usuarios u
                JOIN heliconias.roles r ON r.id_rol = u.id_rol
                WHERE u.username = ? AND u.estado = TRUE
                """,
                username
        );
        if (users.isEmpty()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Credenciales inválidas");
        }
        return users.get(0);
    }

    private Map<String, Object> profileMap(AuthenticatedUser user, Map<String, Object> row) {
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.id());
        profile.put("username", user.username());
        profile.put("role", user.role());
        profile.put("fullName", user.fullName());
        profile.put("email", row.get("correo"));
        profile.put("telefono", row.get("telefono"));
        profile.put("ultimoAcceso", row.get("ultimo_acceso"));
        return profile;
    }
}

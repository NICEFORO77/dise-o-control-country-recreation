package pe.heliconias.controlinterno.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import org.flywaydb.core.Flyway;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pe.heliconias.controlinterno.config.AppProperties;

@Service
public class BootstrapService {

    private final AppProperties appProperties;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final Flyway flyway;

    public BootstrapService(
            AppProperties appProperties,
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder,
            Flyway flyway
    ) {
        this.appProperties = appProperties;
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.flyway = flyway;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initialize() throws IOException {
        // Ensure the schema and seed data exist before post-migration bootstrap logic runs.
        flyway.migrate();
        Files.createDirectories(Path.of(appProperties.uploads().directory()));
        List<Map<String, Object>> users = jdbcTemplate.queryForList(
                """
                SELECT id_usuario, password_hash
                FROM heliconias.usuarios
                WHERE username IN ('admin', 'operador')
                """
        );

        for (Map<String, Object> user : users) {
            String passwordHash = String.valueOf(user.get("password_hash"));
            if (!passwordHash.startsWith("$argon2")) {
                jdbcTemplate.update(
                        "UPDATE heliconias.usuarios SET password_hash = ? WHERE id_usuario = ?",
                        passwordEncoder.encode(passwordHash),
                        user.get("id_usuario")
                );
            }
        }
    }
}

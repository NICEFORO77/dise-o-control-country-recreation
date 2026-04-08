package pe.heliconias.controlinterno.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.postgresql.util.PGobject;
import pe.heliconias.controlinterno.security.AuthenticatedUser;
import pe.heliconias.controlinterno.service.CrudRegistry.ResourceDefinition;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class CrudService {

    private final CrudRegistry crudRegistry;
    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public CrudService(
            CrudRegistry crudRegistry,
            NamedParameterJdbcTemplate namedParameterJdbcTemplate,
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper
    ) {
        this.crudRegistry = crudRegistry;
        this.namedParameterJdbcTemplate = namedParameterJdbcTemplate;
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> list(String resource, AuthenticatedUser user) {
        ResourceDefinition definition = crudRegistry.get(resource);
        crudRegistry.assertReadAllowed(definition, user.role());
        return jdbcTemplate.queryForList(
                "SELECT " + definition.selectClause() + " FROM " + definition.table() + " ORDER BY " + definition.idColumn() + " DESC"
        );
    }

    public Map<String, Object> get(String resource, Integer id, AuthenticatedUser user) {
        ResourceDefinition definition = crudRegistry.get(resource);
        crudRegistry.assertReadAllowed(definition, user.role());
        List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(
                "SELECT " + definition.selectClause() + " FROM " + definition.table() + " WHERE " + definition.idColumn() + " = :id",
                Map.of("id", id)
        );
        if (rows.isEmpty()) {
            throw new ResponseStatusException(NOT_FOUND, "Registro no encontrado");
        }
        return rows.get(0);
    }

    @Transactional
    public Map<String, Object> create(String resource, Map<String, Object> payload, AuthenticatedUser user) {
        ResourceDefinition definition = crudRegistry.get(resource);
        crudRegistry.assertWriteAllowed(definition, user.role());
        Map<String, Object> sanitized = sanitizePayload(definition, payload, true);
        if (sanitized.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "No se recibieron campos válidos para insertar");
        }

        setCurrentUserId(user.id());
        String columns = String.join(", ", sanitized.keySet());
        String values = sanitized.keySet().stream().map(key -> ":" + key).collect(Collectors.joining(", "));
        Number key = namedParameterJdbcTemplate.queryForObject(
                "INSERT INTO " + definition.table() + " (" + columns + ") VALUES (" + values + ") RETURNING " + definition.idColumn(),
                new MapSqlParameterSource(sanitized),
                Number.class
        );
        if (key == null) {
            throw new ResponseStatusException(BAD_REQUEST, "No fue posible obtener el ID generado");
        }
        return get(resource, key.intValue(), user);
    }

    @Transactional
    public Map<String, Object> update(String resource, Integer id, Map<String, Object> payload, AuthenticatedUser user) {
        ResourceDefinition definition = crudRegistry.get(resource);
        crudRegistry.assertWriteAllowed(definition, user.role());
        Map<String, Object> sanitized = sanitizePayload(definition, payload, false);
        if (sanitized.isEmpty()) {
            return get(resource, id, user);
        }

        if (("pedidos".equals(resource) && "ANULADO".equals(String.valueOf(sanitized.get("estado_pedido"))))
                || ("pagos".equals(resource) && "ANULADO".equals(String.valueOf(sanitized.get("estado_pago"))))) {
            crudRegistry.assertWriteAllowed(crudRegistry.get("usuarios"), user.role());
        }

        if ("pedidos".equals(resource) && "CERRADO".equals(String.valueOf(sanitized.get("estado_pedido")))
                && !sanitized.containsKey("fecha_cierre")) {
            sanitized.put("fecha_cierre", Timestamp.from(java.time.Instant.now()));
        }

        setCurrentUserId(user.id());
        String setClause = sanitized.keySet().stream()
                .map(key -> key + " = :" + key)
                .collect(Collectors.joining(", "));
        MapSqlParameterSource parameters = new MapSqlParameterSource(sanitized).addValue("id", id);
        int updated = namedParameterJdbcTemplate.update(
                "UPDATE " + definition.table() + " SET " + setClause + " WHERE " + definition.idColumn() + " = :id",
                parameters
        );
        if (updated == 0) {
            throw new ResponseStatusException(NOT_FOUND, "Registro no encontrado");
        }
        return get(resource, id, user);
    }

    @Transactional
    public void delete(String resource, Integer id, AuthenticatedUser user) {
        ResourceDefinition definition = crudRegistry.get(resource);
        crudRegistry.assertWriteAllowed(definition, user.role());
        if (!definition.deletable()) {
            throw new ResponseStatusException(BAD_REQUEST, "Este recurso no permite eliminación");
        }
        setCurrentUserId(user.id());
        int deleted = namedParameterJdbcTemplate.update(
                "DELETE FROM " + definition.table() + " WHERE " + definition.idColumn() + " = :id",
                Map.of("id", id)
        );
        if (deleted == 0) {
            throw new ResponseStatusException(NOT_FOUND, "Registro no encontrado");
        }
    }

    public Map<String, Object> patchProductPhoto(Integer idProducto, String photoUrl, AuthenticatedUser user) {
        return update("productos", idProducto, Map.of("foto_url", photoUrl), user);
    }

    private Map<String, Object> sanitizePayload(ResourceDefinition definition, Map<String, Object> payload, boolean creating) {
        Map<String, Object> sanitized = new LinkedHashMap<>();
        for (String column : definition.writeColumns()) {
            if (payload.containsKey(column)) {
                Object value = payload.get(column);
                if ("password_hash".equals(column) && value instanceof String password && !password.isBlank()) {
                    value = password.startsWith("$argon2") ? password : passwordEncoder.encode(password);
                }
                if ("auditoria".equals(definition.key())) {
                    value = convertAuditValue(column, value);
                }
                sanitized.put(column, value);
            }
        }
        if ("usuarios".equals(definition.key()) && creating && !sanitized.containsKey("password_hash")) {
            throw new ResponseStatusException(BAD_REQUEST, "Debe enviar password_hash para crear usuario");
        }
        return sanitized;
    }

    private void setCurrentUserId(Integer userId) {
        jdbcTemplate.queryForObject(
                "SELECT set_config('app.current_user_id', ?, true)",
                String.class,
                String.valueOf(userId)
        );
    }

    private Object convertAuditValue(String column, Object value) {
        if (value == null) {
            return null;
        }

        if ("valores_anteriores".equals(column) || "valores_nuevos".equals(column)) {
            try {
                PGobject jsonObject = new PGobject();
                jsonObject.setType("jsonb");
                if (value instanceof String rawJson) {
                    jsonObject.setValue(rawJson.isBlank() ? "{}" : rawJson);
                } else {
                    jsonObject.setValue(objectMapper.writeValueAsString(value));
                }
                return jsonObject;
            } catch (JsonProcessingException | java.sql.SQLException exception) {
                throw new ResponseStatusException(BAD_REQUEST, "JSON inválido para auditoría");
            }
        }

        if ("fecha_accion".equals(column) && value instanceof String rawTimestamp && !rawTimestamp.isBlank()) {
            try {
                return Timestamp.valueOf(rawTimestamp.replace("T", " "));
            } catch (IllegalArgumentException exception) {
                throw new ResponseStatusException(BAD_REQUEST, "Fecha de auditoría inválida");
            }
        }

        return value;
    }
}

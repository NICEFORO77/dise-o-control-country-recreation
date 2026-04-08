package pe.heliconias.controlinterno.service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Component
public class CrudRegistry {

    private final Map<String, ResourceDefinition> resources = Map.ofEntries(
            Map.entry("roles", new ResourceDefinition(
                    "roles", "heliconias.roles", "id_rol",
                    "id_rol, nombre, descripcion, estado, fecha_creacion",
                    List.of("nombre", "descripcion", "estado"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR"),
                    true
            )),
            Map.entry("usuarios", new ResourceDefinition(
                    "usuarios", "heliconias.usuarios", "id_usuario",
                    "id_usuario, id_rol, nombres, apellidos, username, correo, telefono, estado, ultimo_acceso, fecha_creacion",
                    List.of("id_rol", "nombres", "apellidos", "username", "password_hash", "correo", "telefono", "estado"),
                    Set.of("ADMINISTRADOR"),
                    Set.of("ADMINISTRADOR"),
                    true
            )),
            Map.entry("clientes", new ResourceDefinition(
                    "clientes", "heliconias.clientes", "id_cliente",
                    "id_cliente, tipo_documento, nro_documento, nombres, apellidos, telefono, correo, direccion, observaciones, estado, fecha_registro",
                    List.of("tipo_documento", "nro_documento", "nombres", "apellidos", "telefono", "correo", "direccion", "observaciones", "estado"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    true
            )),
            Map.entry("zonas", new ResourceDefinition(
                    "zonas", "heliconias.zonas", "id_zona",
                    "id_zona, nombre, descripcion, estado, fecha_creacion",
                    List.of("nombre", "descripcion", "estado"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR"),
                    true
            )),
            Map.entry("mesas", new ResourceDefinition(
                    "mesas", "heliconias.mesas", "id_mesa",
                    "id_mesa, id_zona, codigo_mesa, capacidad, estado_operativo, observaciones, fecha_creacion",
                    List.of("id_zona", "codigo_mesa", "capacidad", "estado_operativo", "observaciones"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR"),
                    true
            )),
            Map.entry("categorias-producto", new ResourceDefinition(
                    "categorias-producto", "heliconias.categorias_producto", "id_categoria",
                    "id_categoria, nombre, descripcion, estado, fecha_creacion",
                    List.of("nombre", "descripcion", "estado"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR"),
                    true
            )),
            Map.entry("productos", new ResourceDefinition(
                    "productos", "heliconias.productos", "id_producto",
                    "id_producto, id_categoria, codigo_producto, nombre, descripcion, precio_venta, costo_referencial, stock_controlado, stock_actual, stock_minimo, unidad_medida, foto_url, estado, fecha_registro",
                    List.of("id_categoria", "codigo_producto", "nombre", "descripcion", "precio_venta", "costo_referencial", "stock_controlado", "stock_actual", "stock_minimo", "unidad_medida", "foto_url", "estado"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR"),
                    true
            )),
            Map.entry("reservas", new ResourceDefinition(
                    "reservas", "heliconias.reservas", "id_reserva",
                    "id_reserva, codigo_reserva, id_cliente, id_mesa, fecha_reserva, hora_inicio, hora_fin, cantidad_personas, estado_reserva, observaciones, id_usuario_registro, fecha_registro",
                    List.of("codigo_reserva", "id_cliente", "id_mesa", "fecha_reserva", "hora_inicio", "hora_fin", "cantidad_personas", "estado_reserva", "observaciones", "id_usuario_registro"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    true
            )),
            Map.entry("pedidos", new ResourceDefinition(
                    "pedidos", "heliconias.pedidos", "id_pedido",
                    "id_pedido, codigo_pedido, id_reserva, id_mesa, id_cliente, fecha_pedido, fecha_cierre, estado_pedido, subtotal, descuento, igv, total, observaciones, id_usuario_registro",
                    List.of("codigo_pedido", "id_reserva", "id_mesa", "id_cliente", "fecha_cierre", "estado_pedido", "descuento", "observaciones", "id_usuario_registro"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    true
            )),
            Map.entry("detalle-pedido", new ResourceDefinition(
                    "detalle-pedido", "heliconias.detalle_pedido", "id_detalle_pedido",
                    "id_detalle_pedido, id_pedido, id_producto, cantidad, precio_unitario, descuento_item, subtotal_item, observaciones",
                    List.of("id_pedido", "id_producto", "cantidad", "precio_unitario", "descuento_item", "observaciones"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    true
            )),
            Map.entry("metodos-pago", new ResourceDefinition(
                    "metodos-pago", "heliconias.metodos_pago", "id_metodo_pago",
                    "id_metodo_pago, nombre, descripcion, estado",
                    List.of("nombre", "descripcion", "estado"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR"),
                    true
            )),
            Map.entry("simulaciones-pago", new ResourceDefinition(
                    "simulaciones-pago", "heliconias.simulaciones_pago", "id_simulacion",
                    "id_simulacion, id_pedido, subtotal, descuento, igv, total_simulado, monto_recibido, vuelto_estimado, metodo_pago_sugerido, fecha_simulacion, id_usuario",
                    List.of("id_pedido", "subtotal", "descuento", "igv", "total_simulado", "monto_recibido", "vuelto_estimado", "metodo_pago_sugerido", "id_usuario"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    true
            )),
            Map.entry("pagos", new ResourceDefinition(
                    "pagos", "heliconias.pagos", "id_pago",
                    "id_pago, id_pedido, fecha_pago, monto_pagado, id_metodo_pago, numero_operacion, observaciones, estado_pago, id_usuario_registro",
                    List.of("id_pedido", "monto_pagado", "id_metodo_pago", "numero_operacion", "observaciones", "estado_pago", "id_usuario_registro"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    true
            )),
            Map.entry("cajas", new ResourceDefinition(
                    "cajas", "heliconias.cajas", "id_caja",
                    "id_caja, nombre, descripcion, estado",
                    List.of("nombre", "descripcion", "estado"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR"),
                    true
            )),
            Map.entry("aperturas-caja", new ResourceDefinition(
                    "aperturas-caja", "heliconias.aperturas_caja", "id_apertura",
                    "id_apertura, id_caja, fecha_apertura, monto_inicial, monto_cierre, fecha_cierre, estado, id_usuario_apertura, id_usuario_cierre",
                    List.of("id_caja", "monto_inicial", "monto_cierre", "fecha_cierre", "estado", "id_usuario_apertura", "id_usuario_cierre"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR"),
                    true
            )),
            Map.entry("movimientos-caja", new ResourceDefinition(
                    "movimientos-caja", "heliconias.movimientos_caja", "id_movimiento",
                    "id_movimiento, id_apertura, tipo_movimiento, concepto, monto, referencia, fecha_movimiento, id_usuario",
                    List.of("id_apertura", "tipo_movimiento", "concepto", "monto", "referencia", "id_usuario"),
                    Set.of("ADMINISTRADOR", "OPERADOR"),
                    Set.of("ADMINISTRADOR"),
                    true
            )),
            Map.entry("auditoria", new ResourceDefinition(
                    "auditoria", "heliconias.auditoria", "id_auditoria",
                    "id_auditoria, tabla_afectada, accion, id_registro_afectado, valores_anteriores, valores_nuevos, fecha_accion, id_usuario, ip_equipo",
                    List.of("tabla_afectada", "accion", "id_registro_afectado", "valores_anteriores", "valores_nuevos", "fecha_accion", "id_usuario", "ip_equipo"),
                    Set.of("ADMINISTRADOR"),
                    Set.of("ADMINISTRADOR"),
                    true
            ))
    );

    public ResourceDefinition get(String resource) {
        ResourceDefinition definition = resources.get(resource);
        if (definition == null) {
            throw new ResponseStatusException(NOT_FOUND, "Recurso no soportado: " + resource);
        }
        return definition;
    }

    public void assertReadAllowed(ResourceDefinition definition, String role) {
        if (!definition.readRoles().contains(role)) {
            throw new ResponseStatusException(FORBIDDEN, "Sin permisos para consultar " + definition.key());
        }
    }

    public void assertWriteAllowed(ResourceDefinition definition, String role) {
        if (!definition.writeRoles().contains(role)) {
            throw new ResponseStatusException(FORBIDDEN, "Sin permisos para modificar " + definition.key());
        }
    }

    public record ResourceDefinition(
            String key,
            String table,
            String idColumn,
            String selectClause,
            List<String> writeColumns,
            Set<String> readRoles,
            Set<String> writeRoles,
            boolean deletable
    ) {
    }
}

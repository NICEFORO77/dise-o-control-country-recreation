export type FieldConfig = {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "date" | "time" | "boolean" | "select" | "email";
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  lookupResource?: string;
  optionValue?: string;
  optionLabel?: string;
};

export type ModuleConfig = {
  key: string;
  title: string;
  description: string;
  endpoint: string;
  idField: string;
  roles: string[];
  readOnly?: boolean;
  allowDelete?: boolean;
  fields: FieldConfig[];
};

export const modules: ModuleConfig[] = [
  {
    key: "roles",
    title: "Roles",
    description: "Perfiles del sistema para administración y operación.",
    endpoint: "/api/crud/roles",
    idField: "id_rol",
    roles: ["ADMINISTRADOR"],
    fields: [
      { key: "nombre", label: "Nombre", type: "text", required: true },
      { key: "descripcion", label: "Descripción", type: "textarea" },
      { key: "estado", label: "Activo", type: "boolean" }
    ]
  },
  {
    key: "usuarios",
    title: "Usuarios",
    description: "Administración de administradores y operadores.",
    endpoint: "/api/crud/usuarios",
    idField: "id_usuario",
    roles: ["ADMINISTRADOR"],
    fields: [
      { key: "id_rol", label: "Rol", type: "select", required: true, lookupResource: "roles", optionValue: "id_rol", optionLabel: "nombre" },
      { key: "nombres", label: "Nombres", type: "text", required: true },
      { key: "apellidos", label: "Apellidos", type: "text", required: true },
      { key: "username", label: "Usuario", type: "text", required: true },
      { key: "password_hash", label: "Contraseña", type: "text", placeholder: "Se encripta con Argon2" },
      { key: "correo", label: "Correo", type: "email" },
      { key: "telefono", label: "Teléfono", type: "text" },
      { key: "estado", label: "Activo", type: "boolean" }
    ]
  },
  {
    key: "clientes",
    title: "Clientes",
    description: "Registro de clientes frecuentes, nuevos y corporativos.",
    endpoint: "/api/crud/clientes",
    idField: "id_cliente",
    roles: ["ADMINISTRADOR", "OPERADOR"],
    fields: [
      {
        key: "tipo_documento",
        label: "Tipo documento",
        type: "select",
        required: true,
        options: [
          { value: "DNI", label: "DNI" },
          { value: "RUC", label: "RUC" },
          { value: "CE", label: "Carné de extranjería" },
          { value: "PASAPORTE", label: "Pasaporte" }
        ]
      },
      { key: "nro_documento", label: "Nro. documento", type: "text", required: true },
      { key: "nombres", label: "Nombres", type: "text", required: true },
      { key: "apellidos", label: "Apellidos", type: "text" },
      { key: "telefono", label: "Teléfono", type: "text" },
      { key: "correo", label: "Correo", type: "email" },
      { key: "direccion", label: "Dirección", type: "text" },
      { key: "observaciones", label: "Observaciones", type: "textarea" },
      { key: "estado", label: "Activo", type: "boolean" }
    ]
  },
  {
    key: "zonas",
    title: "Zonas",
    description: "Configuración de áreas del recreo.",
    endpoint: "/api/crud/zonas",
    idField: "id_zona",
    roles: ["ADMINISTRADOR"],
    fields: [
      { key: "nombre", label: "Nombre", type: "text", required: true },
      { key: "descripcion", label: "Descripción", type: "textarea" },
      { key: "estado", label: "Activa", type: "boolean" }
    ]
  },
  {
    key: "mesas",
    title: "Mesas",
    description: "Gestión de mesas, aforo y disponibilidad operativa.",
    endpoint: "/api/crud/mesas",
    idField: "id_mesa",
    roles: ["ADMINISTRADOR"],
    fields: [
      { key: "id_zona", label: "Zona", type: "select", required: true, lookupResource: "zonas", optionValue: "id_zona", optionLabel: "nombre" },
      { key: "codigo_mesa", label: "Código", type: "text", required: true },
      { key: "capacidad", label: "Capacidad", type: "number", required: true },
      {
        key: "estado_operativo",
        label: "Estado",
        type: "select",
        required: true,
        options: [
          { value: "DISPONIBLE", label: "Disponible" },
          { value: "OCUPADA", label: "Ocupada" },
          { value: "RESERVADA", label: "Reservada" },
          { value: "MANTENIMIENTO", label: "Mantenimiento" },
          { value: "INACTIVA", label: "Inactiva" }
        ]
      },
      { key: "observaciones", label: "Observaciones", type: "textarea" }
    ]
  },
  {
    key: "categorias-producto",
    title: "Categorías",
    description: "Clasificación comercial del menú.",
    endpoint: "/api/crud/categorias-producto",
    idField: "id_categoria",
    roles: ["ADMINISTRADOR"],
    fields: [
      { key: "nombre", label: "Nombre", type: "text", required: true },
      { key: "descripcion", label: "Descripción", type: "textarea" },
      { key: "estado", label: "Activa", type: "boolean" }
    ]
  },
  {
    key: "productos",
    title: "Productos",
    description: "Catálogo, precios, stock y foto del producto.",
    endpoint: "/api/crud/productos",
    idField: "id_producto",
    roles: ["ADMINISTRADOR"],
    fields: [
      { key: "id_categoria", label: "Categoría", type: "select", required: true, lookupResource: "categorias-producto", optionValue: "id_categoria", optionLabel: "nombre" },
      { key: "codigo_producto", label: "Código", type: "text", required: true },
      { key: "nombre", label: "Nombre", type: "text", required: true },
      { key: "descripcion", label: "Descripción", type: "textarea" },
      { key: "precio_venta", label: "Precio venta", type: "number", required: true },
      { key: "costo_referencial", label: "Costo referencial", type: "number", required: true },
      { key: "stock_controlado", label: "Controla stock", type: "boolean" },
      { key: "stock_actual", label: "Stock actual", type: "number" },
      { key: "stock_minimo", label: "Stock mínimo", type: "number" },
      {
        key: "unidad_medida",
        label: "Unidad",
        type: "select",
        required: true,
        options: [
          { value: "UNIDAD", label: "Unidad" },
          { value: "PLATO", label: "Plato" },
          { value: "BOTELLA", label: "Botella" },
          { value: "VASO", label: "Vaso" },
          { value: "PORCION", label: "Porción" }
        ]
      },
      { key: "estado", label: "Activo", type: "boolean" }
    ]
  },
  {
    key: "reservas",
    title: "Reservas",
    description: "Calendario de reservas, estados y capacidad.",
    endpoint: "/api/crud/reservas",
    idField: "id_reserva",
    roles: ["ADMINISTRADOR", "OPERADOR"],
    fields: [
      { key: "codigo_reserva", label: "Código", type: "text", required: true },
      { key: "id_cliente", label: "Cliente", type: "select", required: true, lookupResource: "clientes", optionValue: "id_cliente", optionLabel: "nombres" },
      { key: "id_mesa", label: "Mesa", type: "select", required: true, lookupResource: "mesas", optionValue: "id_mesa", optionLabel: "codigo_mesa" },
      { key: "fecha_reserva", label: "Fecha", type: "date", required: true },
      { key: "hora_inicio", label: "Hora inicio", type: "time", required: true },
      { key: "hora_fin", label: "Hora fin", type: "time", required: true },
      { key: "cantidad_personas", label: "Personas", type: "number", required: true },
      {
        key: "estado_reserva",
        label: "Estado",
        type: "select",
        required: true,
        options: [
          { value: "PENDIENTE", label: "Pendiente" },
          { value: "CONFIRMADA", label: "Confirmada" },
          { value: "EN_USO", label: "En uso" },
          { value: "FINALIZADA", label: "Finalizada" },
          { value: "CANCELADA", label: "Cancelada" },
          { value: "NO_ASISTIO", label: "No asistió" }
        ]
      },
      { key: "id_usuario_registro", label: "Usuario registro", type: "number", required: true },
      { key: "observaciones", label: "Observaciones", type: "textarea" }
    ]
  },
  {
    key: "pedidos",
    title: "Pedidos",
    description: "Pedidos por mesa, cliente y reserva.",
    endpoint: "/api/crud/pedidos",
    idField: "id_pedido",
    roles: ["ADMINISTRADOR", "OPERADOR"],
    fields: [
      { key: "codigo_pedido", label: "Código", type: "text", required: true },
      { key: "id_reserva", label: "Reserva", type: "number" },
      { key: "id_mesa", label: "Mesa", type: "select", required: true, lookupResource: "mesas", optionValue: "id_mesa", optionLabel: "codigo_mesa" },
      { key: "id_cliente", label: "Cliente", type: "select", lookupResource: "clientes", optionValue: "id_cliente", optionLabel: "nombres" },
      {
        key: "estado_pedido",
        label: "Estado",
        type: "select",
        required: true,
        options: [
          { value: "ABIERTO", label: "Abierto" },
          { value: "EN_PREPARACION", label: "En preparación" },
          { value: "ATENDIDO", label: "Atendido" },
          { value: "CERRADO", label: "Cerrado" },
          { value: "ANULADO", label: "Anulado" }
        ]
      },
      { key: "descuento", label: "Descuento", type: "number" },
      { key: "id_usuario_registro", label: "Usuario registro", type: "number", required: true },
      { key: "observaciones", label: "Observaciones", type: "textarea" }
    ]
  },
  {
    key: "detalle-pedido",
    title: "Detalle pedido",
    description: "Productos agregados a cada pedido.",
    endpoint: "/api/crud/detalle-pedido",
    idField: "id_detalle_pedido",
    roles: ["ADMINISTRADOR", "OPERADOR"],
    fields: [
      { key: "id_pedido", label: "Pedido", type: "select", required: true, lookupResource: "pedidos", optionValue: "id_pedido", optionLabel: "codigo_pedido" },
      { key: "id_producto", label: "Producto", type: "select", required: true, lookupResource: "productos", optionValue: "id_producto", optionLabel: "nombre" },
      { key: "cantidad", label: "Cantidad", type: "number", required: true },
      { key: "precio_unitario", label: "Precio unitario", type: "number", required: true },
      { key: "descuento_item", label: "Descuento", type: "number" },
      { key: "observaciones", label: "Observaciones", type: "textarea" }
    ]
  },
  {
    key: "metodos-pago",
    title: "Métodos de pago",
    description: "Catálogo de cobros habilitados.",
    endpoint: "/api/crud/metodos-pago",
    idField: "id_metodo_pago",
    roles: ["ADMINISTRADOR"],
    fields: [
      { key: "nombre", label: "Nombre", type: "text", required: true },
      { key: "descripcion", label: "Descripción", type: "textarea" },
      { key: "estado", label: "Activo", type: "boolean" }
    ]
  },
  {
    key: "simulaciones-pago",
    title: "Simulación de pago",
    description: "Cálculo previo de cobro y vuelto.",
    endpoint: "/api/crud/simulaciones-pago",
    idField: "id_simulacion",
    roles: ["ADMINISTRADOR", "OPERADOR"],
    fields: [
      { key: "id_pedido", label: "Pedido", type: "select", required: true, lookupResource: "pedidos", optionValue: "id_pedido", optionLabel: "codigo_pedido" },
      { key: "subtotal", label: "Subtotal", type: "number", required: true },
      { key: "descuento", label: "Descuento", type: "number" },
      { key: "igv", label: "IGV", type: "number" },
      { key: "total_simulado", label: "Total", type: "number", required: true },
      { key: "monto_recibido", label: "Monto recibido", type: "number", required: true },
      { key: "vuelto_estimado", label: "Vuelto", type: "number", required: true },
      { key: "metodo_pago_sugerido", label: "Método sugerido", type: "text" },
      { key: "id_usuario", label: "Usuario", type: "number", required: true }
    ]
  },
  {
    key: "pagos",
    title: "Pagos",
    description: "Registro de cobros, método y observaciones.",
    endpoint: "/api/crud/pagos",
    idField: "id_pago",
    roles: ["ADMINISTRADOR", "OPERADOR"],
    fields: [
      { key: "id_pedido", label: "Pedido", type: "select", required: true, lookupResource: "pedidos", optionValue: "id_pedido", optionLabel: "codigo_pedido" },
      { key: "monto_pagado", label: "Monto pagado", type: "number", required: true },
      { key: "id_metodo_pago", label: "Método de pago", type: "select", required: true, lookupResource: "metodos-pago", optionValue: "id_metodo_pago", optionLabel: "nombre" },
      { key: "numero_operacion", label: "Nro. operación", type: "text" },
      {
        key: "estado_pago",
        label: "Estado",
        type: "select",
        required: true,
        options: [
          { value: "PENDIENTE", label: "Pendiente" },
          { value: "PAGADO", label: "Pagado" },
          { value: "ANULADO", label: "Anulado" },
          { value: "REEMBOLSADO", label: "Reembolsado" }
        ]
      },
      { key: "id_usuario_registro", label: "Usuario registro", type: "number", required: true },
      { key: "observaciones", label: "Observaciones", type: "textarea" }
    ]
  },
  {
    key: "cajas",
    title: "Cajas",
    description: "Configuración de cajas operativas.",
    endpoint: "/api/crud/cajas",
    idField: "id_caja",
    roles: ["ADMINISTRADOR"],
    fields: [
      { key: "nombre", label: "Nombre", type: "text", required: true },
      { key: "descripcion", label: "Descripción", type: "textarea" },
      { key: "estado", label: "Activa", type: "boolean" }
    ]
  },
  {
    key: "aperturas-caja",
    title: "Apertura de caja",
    description: "Control de caja abierta, cerrada y montos.",
    endpoint: "/api/crud/aperturas-caja",
    idField: "id_apertura",
    roles: ["ADMINISTRADOR"],
    fields: [
      { key: "id_caja", label: "Caja", type: "select", required: true, lookupResource: "cajas", optionValue: "id_caja", optionLabel: "nombre" },
      { key: "monto_inicial", label: "Monto inicial", type: "number", required: true },
      { key: "monto_cierre", label: "Monto cierre", type: "number" },
      { key: "fecha_cierre", label: "Fecha cierre", type: "date" },
      {
        key: "estado",
        label: "Estado",
        type: "select",
        required: true,
        options: [
          { value: "ABIERTA", label: "Abierta" },
          { value: "CERRADA", label: "Cerrada" }
        ]
      },
      { key: "id_usuario_apertura", label: "Usuario apertura", type: "select", required: true, lookupResource: "usuarios", optionValue: "id_usuario", optionLabel: "username" },
      { key: "id_usuario_cierre", label: "Usuario cierre", type: "select", lookupResource: "usuarios", optionValue: "id_usuario", optionLabel: "username" }
    ]
  },
  {
    key: "movimientos-caja",
    title: "Movimientos de caja",
    description: "Ingresos y egresos registrados manualmente.",
    endpoint: "/api/crud/movimientos-caja",
    idField: "id_movimiento",
    roles: ["ADMINISTRADOR"],
    fields: [
      { key: "id_apertura", label: "Apertura", type: "select", required: true, lookupResource: "aperturas-caja", optionValue: "id_apertura", optionLabel: "id_apertura" },
      {
        key: "tipo_movimiento",
        label: "Tipo",
        type: "select",
        required: true,
        options: [
          { value: "INGRESO", label: "Ingreso" },
          { value: "EGRESO", label: "Egreso" }
        ]
      },
      { key: "concepto", label: "Concepto", type: "text", required: true },
      { key: "monto", label: "Monto", type: "number", required: true },
      { key: "referencia", label: "Referencia", type: "text" },
      { key: "id_usuario", label: "Usuario", type: "select", required: true, lookupResource: "usuarios", optionValue: "id_usuario", optionLabel: "username" }
    ]
  },
  {
    key: "auditoria",
    title: "Auditoría",
    description: "Bitácora de acciones sensibles del sistema.",
    endpoint: "/api/crud/auditoria",
    idField: "id_auditoria",
    roles: ["ADMINISTRADOR"],
    fields: [
      { key: "tabla_afectada", label: "Tabla afectada", type: "text", required: true },
      { key: "accion", label: "Acción", type: "text", required: true },
      { key: "id_registro_afectado", label: "ID registro afectado", type: "text" },
      { key: "valores_anteriores", label: "Valores anteriores (JSON)", type: "textarea" },
      { key: "valores_nuevos", label: "Valores nuevos (JSON)", type: "textarea" },
      { key: "fecha_accion", label: "Fecha acción", type: "text", placeholder: "2026-04-08 10:30:00" },
      { key: "id_usuario", label: "Usuario", type: "select", lookupResource: "usuarios", optionValue: "id_usuario", optionLabel: "username" },
      { key: "ip_equipo", label: "IP equipo", type: "text" }
    ]
  }
];

export const summaryCards = [
  { key: "clientes", label: "Clientes" },
  { key: "reservasHoy", label: "Reservas hoy" },
  { key: "pedidosActivos", label: "Pedidos activos" },
  { key: "ventasHoy", label: "Ventas hoy" },
  { key: "cajaAbierta", label: "Cajas abiertas" },
  { key: "productosStockMinimo", label: "Stock mínimo" }
];

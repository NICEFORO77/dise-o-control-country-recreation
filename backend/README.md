# Backend - Heliconias Pucallpa

API REST del sistema de atencion y control interno del Recreo Campestre Heliconias Pucallpa.

## Objetivo del backend

El backend concentra la logica de negocio, seguridad, acceso a datos y servicios operativos del sistema. Su responsabilidad principal es exponer endpoints seguros para:

- autenticacion y perfil del usuario
- CRUD de las tablas del sistema
- carga de foto de producto
- resumen ejecutivo del dashboard
- reportes obligatorios
- operaciones rapidas como generacion de codigos y simulacion de pago

## Stack tecnico

- Spring Boot `4.0.3`
- Java `25`
- Spring Web MVC
- Spring Security
- JDBC Template
- PostgreSQL
- Flyway
- JWT
- Argon2
- Maven Wrapper

## Estructura del backend

```text
backend/
|-- .mvn/
|-- sql/
|   `-- reportes_obligatorios.sql
|-- src/main/java/pe/heliconias/controlinterno/
|   |-- config/
|   |-- controller/
|   |-- dto/
|   |-- security/
|   `-- service/
|-- src/main/resources/
|   |-- db/migration/
|   `-- application.yml
|-- .env.local
|-- .env.prod
|-- Dockerfile.dev
|-- Dockerfile.prod
|-- mvnw
|-- mvnw.cmd
`-- pom.xml
```

## Configuracion

### Archivo principal

- `src/main/resources/application.yml`

Define:

- datasource
- Flyway
- configuracion multipart
- puerto del servidor
- propiedades JWT
- carpeta de uploads
- CORS
- exposicion de endpoints de actuator

### Variables de entorno locales

Archivo:

- `.env.local`

Variables:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION_MINUTES`
- `SERVER_PORT`
- `UPLOAD_DIR`
- `CORS_ALLOWED_ORIGINS`

### Variables de entorno productivas

Archivo:

- `.env.prod`

Antes de desplegar se recomienda cambiar como minimo:

- `DB_PASSWORD`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`

## Arranque local

El backend no depende de Maven global.

### Windows PowerShell

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### Linux o contenedor

```bash
cd backend
./mvnw spring-boot:run
```

## Docker

### Desarrollo

Archivo:

- `Dockerfile.dev`

Caracteristicas:

- imagen base `eclipse-temurin:25-jdk`
- descarga dependencias con Maven Wrapper
- ejecuta `spring-boot:run`

### Produccion

Archivo:

- `Dockerfile.prod`

Caracteristicas:

- build multi-stage
- empaqueta el backend como jar
- imagen final con `eclipse-temurin:25-jre`

## Seguridad

### Autenticacion

La autenticacion se maneja con JWT.

Endpoints:

- `POST /api/auth/login`
- `GET /api/auth/me`

### Comportamiento

- el login valida `username` y `password`
- si la contraseña del usuario seed aun esta en texto plano, se acepta solo esa primera vez
- luego se actualiza automaticamente a Argon2
- el sistema actualiza `ultimo_acceso`
- el frontend guarda el token y los datos basicos del usuario

### Seguridad HTTP

Configurada en:

- `src/main/java/pe/heliconias/controlinterno/config/SecurityConfig.java`

Reglas principales:

- `csrf` desactivado
- sesion `STATELESS`
- filtro JWT antes del filtro de autenticacion por usuario/clave
- rutas publicas:
  - `/api/auth/**`
  - `/uploads/**`
  - `/actuator/health`
  - `/actuator/info`
- todo lo demas requiere token

## Base de datos y migraciones

### Motor

- PostgreSQL

### Schema

- `heliconias`

### Migracion principal

- `src/main/resources/db/migration/V1__init_heliconias.sql`

La migracion crea:

- tablas maestras
- reservas
- pedidos
- detalle de pedido
- pagos
- caja
- auditoria
- indices
- funciones
- triggers
- vistas
- datos iniciales

## Recursos CRUD expuestos

El backend centraliza el mantenimiento de tablas mediante un controlador generico:

- `GET /api/crud/{resource}`
- `GET /api/crud/{resource}/{id}`
- `POST /api/crud/{resource}`
- `PUT /api/crud/{resource}/{id}`
- `DELETE /api/crud/{resource}/{id}`

Controlador:

- `src/main/java/pe/heliconias/controlinterno/controller/CrudController.java`

Registro de recursos:

- `src/main/java/pe/heliconias/controlinterno/service/CrudRegistry.java`

### Recursos disponibles

- `roles`
- `usuarios`
- `clientes`
- `zonas`
- `mesas`
- `categorias-producto`
- `productos`
- `reservas`
- `pedidos`
- `detalle-pedido`
- `metodos-pago`
- `simulaciones-pago`
- `pagos`
- `cajas`
- `aperturas-caja`
- `movimientos-caja`
- `auditoria`

## Permisos por recurso

### Administrador

Lectura y escritura sobre:

- roles
- usuarios
- clientes
- zonas
- mesas
- categorias-producto
- productos
- reservas
- pedidos
- detalle-pedido
- metodos-pago
- simulaciones-pago
- pagos
- cajas
- aperturas-caja
- movimientos-caja
- auditoria

### Operador

Lectura sobre:

- roles
- clientes
- zonas
- mesas
- categorias-producto
- productos
- reservas
- pedidos
- detalle-pedido
- metodos-pago
- simulaciones-pago
- pagos
- cajas
- aperturas-caja
- movimientos-caja

Escritura sobre:

- clientes
- reservas
- pedidos
- detalle-pedido
- simulaciones-pago
- pagos

## Endpoints especificos

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`

### Dashboard

- `GET /api/dashboard/summary`

Resumen actual:

- clientes
- reservas de hoy
- pedidos activos
- ventas de hoy
- cajas abiertas
- productos en stock minimo

### Reportes

- `GET /api/reportes`

Retorna un objeto con colecciones para:

- `reservasDelDia`
- `disponibilidadMesas`
- `pedidosActivosPorMesa`
- `ventasDelDia`
- `ventasPorMetodoPago`
- `cierreCaja`
- `productosMasVendidos`
- `reservasCanceladas`
- `pedidosAnulados`
- `auditoriaSistema`

### Operaciones

- `GET /api/operaciones/codigos`
- `POST /api/operaciones/simular-pago`

`/api/operaciones/codigos` genera:

- siguiente codigo de reserva
- siguiente codigo de pedido

`/api/operaciones/simular-pago`:

- toma un pedido existente
- lee subtotal, descuento, igv y total
- calcula vuelto estimado
- sugiere metodo de pago
- inserta el registro en `simulaciones_pago`
- devuelve la simulacion creada

### Productos y fotos

- `POST /api/productos/{id}/foto`

Permite cargar una imagen de producto via `multipart/form-data`.

Restricciones:

- maximo `15 MB`
- el backend guarda la foto en el directorio configurado por `UPLOAD_DIR`

## Servicios principales

### `AuthService`

Responsable de:

- login
- consulta del perfil actual
- actualizacion de `ultimo_acceso`
- migracion lazy de password plano a Argon2

### `CrudService`

Responsable de:

- listar registros
- obtener por id
- insertar
- actualizar
- eliminar
- manejar serializacion JSON en auditoria
- hashear password en operaciones de usuario

### `DashboardService`

Responsable de:

- armar los indicadores ejecutivos del tablero

### `ReportService`

Responsable de:

- construir el paquete de reportes obligatorios

### `OperationsService`

Responsable de:

- calcular siguientes codigos
- registrar simulaciones de pago

### `BootstrapService`

Responsable de:

- preparar el directorio de uploads al iniciar la aplicacion

## Datos iniciales

El backend parte con registros ficticios para pruebas funcionales.

Incluye:

- usuario `admin`
- usuario `operador`
- clientes
- zonas
- mesas
- categorias
- productos
- caja inicial
- reservas y pedidos de ejemplo

## Archivos clave del backend

- `pom.xml`
- `.env.local`
- `.env.prod`
- `Dockerfile.dev`
- `Dockerfile.prod`
- `src/main/resources/application.yml`
- `src/main/resources/db/migration/V1__init_heliconias.sql`
- `sql/reportes_obligatorios.sql`
- `src/main/java/pe/heliconias/controlinterno/config/SecurityConfig.java`
- `src/main/java/pe/heliconias/controlinterno/service/AuthService.java`
- `src/main/java/pe/heliconias/controlinterno/service/CrudService.java`
- `src/main/java/pe/heliconias/controlinterno/service/CrudRegistry.java`
- `src/main/java/pe/heliconias/controlinterno/service/DashboardService.java`
- `src/main/java/pe/heliconias/controlinterno/service/ReportService.java`
- `src/main/java/pe/heliconias/controlinterno/service/OperationsService.java`

## Pruebas manuales recomendadas

1. iniciar sesion con `admin`
2. consultar `/api/auth/me`
3. listar `clientes`
4. crear una reserva
5. crear un pedido
6. crear detalle de pedido
7. simular pago
8. registrar pago
9. consultar reportes
10. validar que aparezca auditoria

## Troubleshooting

### Error de conexion a PostgreSQL

Revisar:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- que el contenedor `postgres` este listo

### Login invalido con usuarios seed

Revisar:

- que el usuario este activo
- que exista en `heliconias.usuarios`
- que la contraseña usada sea exactamente la seed esperada la primera vez

### Problemas con upload de imagen

Revisar:

- tamano maximo de 15 MB
- permisos del directorio `UPLOAD_DIR`
- existencia del producto

### Error de CORS

Revisar:

- `CORS_ALLOWED_ORIGINS`
- URL real del frontend


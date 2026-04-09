# ATENCION Y CONTROL INTERNO DEL RECREO CAMPESTRE HELICONIAS PUCALLPA

Sistema full-stack para la gestion operativa del recreo campestre Heliconias Pucallpa. El proyecto cubre autenticacion, reservas, pedidos, pagos, caja, productos, reportes y auditoria, con una interfaz administrativa en Next.js y una API REST en Spring Boot.

## Descripcion general

El sistema fue preparado para trabajar con dos perfiles:

- `ADMINISTRADOR`
- `OPERADOR`

El objetivo del proyecto es concentrar en una sola plataforma los procesos diarios del recreo:

- registro y mantenimiento de usuarios
- configuracion de zonas, mesas, categorias y productos
- registro de clientes
- gestion de reservas
- apertura y control de pedidos
- detalle de consumos
- simulacion de pago
- registro de pagos
- control de caja
- reportes operativos y ejecutivos
- auditoria de acciones del sistema

## Arquitectura del proyecto

El repositorio esta dividido en tres niveles principales:

- `raiz`
  - orquestacion con Docker Compose para desarrollo y produccion
  - variables de entorno globales
  - configuracion del workspace
- `backend`
  - API REST con Spring Boot 4.0.3
  - JWT, seguridad, Flyway, PostgreSQL, carga de imagenes y reportes
- `frontend`
  - interfaz web con Next.js 16.2.2, React 19 y Tailwind CSS 4

## Tecnologias y versiones

### Backend

- Spring Boot `4.0.3`
- Java `25`
- Maven Wrapper `3.3.4`
- Apache Maven distribuido `3.9.14`
- Spring Security
- JWT con `jjwt`
- PostgreSQL `17`
- Flyway
- Argon2 con Bouncy Castle

### Frontend

- Next.js `16.2.2`
- React `19.2.0`
- Tailwind CSS `4.1.4`
- TypeScript `5.8.3`
- Node `24.13.0`

### Contenedores

- Docker Compose para `dev`
- Docker Compose para `prod`
- imagen `postgres:17-alpine`
- imagen `eclipse-temurin:25-jdk` y `25-jre`
- imagen `node:24.13.0-alpine`

## Estructura del repositorio

```text
diseño-control-country-recreation/
|-- .vscode/
|-- backend/
|   |-- .mvn/
|   |-- sql/
|   |-- src/main/java/
|   |-- src/main/resources/
|   |-- .env.local
|   |-- .env.prod
|   |-- Dockerfile.dev
|   |-- Dockerfile.prod
|   |-- mvnw
|   |-- mvnw.cmd
|   |-- pom.xml
|   `-- README.md
|-- frontend/
|   |-- app/
|   |-- lib/
|   |-- .env.local
|   |-- .env.prod
|   |-- Dockerfile.dev
|   |-- Dockerfile.prod
|   |-- next.config.ts
|   |-- package.json
|   `-- README.md
|-- .env.local
|-- .env.prod
|-- .nvmrc
|-- docker-compose.dev.yml
|-- docker-compose.prod.yml
`-- README.md
```

## Documentacion por nivel

Este archivo documenta la vision global. Para el detalle tecnico de cada parte:

- backend: `backend/README.md`
- frontend: `frontend/README.md`

## Modulos funcionales del sistema

El sistema esta organizado en los siguientes modulos:

- Seguridad
  - roles
  - usuarios
- Clientes
- Zonas
- Mesas
- Categorias de producto
- Productos
- Reservas
- Pedidos
- Detalle de pedido
- Metodos de pago
- Pagos
- Caja
  - cajas
  - aperturas de caja
  - movimientos de caja
- Reportes
- Auditoria

La simulacion de pago existe como parte del flujo operativo, pero no se muestra como item principal del sidebar. Se usa desde la vista `Operaciones`.

## Roles y permisos

### Administrador

Puede:

- crear usuarios
- configurar mesas, zonas y productos
- ver todos los reportes
- anular pedidos y pagos
- controlar caja
- revisar auditoria
- modificar precios
- gestionar reservas

### Operador

Puede:

- registrar clientes
- reservar mesas
- abrir pedidos
- agregar productos al pedido
- simular pagos
- registrar pagos
- consultar reportes operativos basicos

## Reportes implementados

El backend expone un conjunto de reportes obligatorios que se consumen en el tablero:

- reservas del dia
- disponibilidad de mesas
- pedidos activos por mesa
- ventas del dia
- ventas por metodo de pago
- cierre de caja
- productos mas vendidos
- reservas canceladas
- pedidos anulados
- auditoria del sistema

Tambien existe un archivo SQL auxiliar con consultas de referencia:

- `backend/sql/reportes_obligatorios.sql`

## Base de datos

La base de datos usa el schema `heliconias` y se inicializa con Flyway.

La migracion principal crea:

- tablas maestras
- reservas
- pedidos y detalle
- pagos
- caja
- auditoria
- indices
- funciones y triggers
- vistas
- datos iniciales ficticios

Archivo principal:

- `backend/src/main/resources/db/migration/V1__init_heliconias.sql`

## Datos iniciales y acceso

El sistema se inicializa con datos de prueba para poder trabajar inmediatamente:

- roles
- usuarios
- clientes
- zonas
- mesas
- categorias
- productos
- metodos de pago
- caja inicial
- reservas iniciales
- pedidos iniciales
- detalle de pedidos
- simulacion de pago
- pago inicial

### Credenciales iniciales

- `admin / Admin2026*`
- `operador / Operador2026*`

Nota importante:

- los usuarios seed pueden venir inicialmente con la contraseña en texto plano desde la migracion
- al iniciar sesion correctamente, la aplicacion actualiza la contraseña a Argon2

## Variables de entorno

## Variables globales de la raiz

### Archivo `.env.local`

Se usa con `docker-compose.dev.yml`.

Variables principales:

- `COMPOSE_PROJECT_NAME`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `BACKEND_PORT`
- `FRONTEND_PORT`
- `JWT_SECRET`
- `JWT_EXPIRATION_MINUTES`
- `DOCKER_UPLOAD_DIR`
- `CORS_ALLOWED_ORIGINS`
- `NEXT_PUBLIC_API_URL`

### Archivo `.env.prod`

Se usa con `docker-compose.prod.yml`.

Debe ajustarse antes de un despliegue real:

- cambiar `POSTGRES_PASSWORD`
- cambiar `JWT_SECRET`
- revisar `CORS_ALLOWED_ORIGINS`
- revisar `NEXT_PUBLIC_API_URL`

## Docker

### Desarrollo

Archivo:

- `docker-compose.dev.yml`

Incluye:

- `postgres`
- `backend`
- `frontend`

Caracteristicas:

- volumen de codigo para hot reload
- cache de Maven
- cache de `node_modules`
- cache de `.next`
- backend levantado con `./mvnw`

Comando:

```bash
docker compose --env-file .env.local -f docker-compose.dev.yml up --build
```

### Produccion

Archivo:

- `docker-compose.prod.yml`

Incluye:

- `postgres`
- `backend`
- `frontend`

Caracteristicas:

- imagen optimizada del backend empacada como jar
- imagen optimizada del frontend con salida `standalone`
- volumen persistente para PostgreSQL
- volumen persistente para uploads del backend

Comando:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up --build -d
```

## Ejecucion local sin Docker

### Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Puertos por defecto

- frontend: `3000`
- backend: `8080`
- PostgreSQL: `5432`

## URLs esperadas

- frontend: `http://localhost:3000`
- backend: `http://localhost:8080`
- healthcheck backend: `http://localhost:8080/actuator/health`

## Flujo general de uso

1. ingresar al login
2. autenticarse con administrador u operador
3. acceder al tablero o reportes
4. operar desde las vistas CRUD por modulo
5. usar `Operaciones` para el flujo rapido
6. registrar reservas, pedidos, detalle y pagos
7. revisar indicadores y reportes

## Flujo operativo recomendado

Para una operacion normal en recepcion o caja:

1. registrar o buscar cliente
2. crear reserva
3. abrir pedido
4. agregar productos al pedido
5. simular el cobro
6. registrar el pago
7. validar movimiento de caja

## Workspace y entorno local

El proyecto fue preparado para evitar conflictos con Node de Laragon y para usar Java 25 en VS Code.

Archivos relevantes:

- `.nvmrc`
- `.vscode/settings.json`

Configuracion aplicada:

- Node esperado: `24.13.0`
- Java esperado: `25`
- VS Code prioriza `C:\Program Files\nodejs`
- VS Code usa Java 25 como runtime por defecto

## Estado actual del frontend

El frontend tiene:

- login profesional
- sidebar por rutas reales
- una carpeta y `page.tsx` por cada modulo
- panel de reportes
- panel de operaciones
- CRUD generico conectado a backend
- subida de foto para productos
- paginacion de listas

## Estado actual del backend

El backend tiene:

- autenticacion JWT
- seguridad stateless
- carga de fotos para productos
- CRUD REST generico por recurso
- servicio de resumen ejecutivo
- servicio de reportes
- servicio de operaciones para codigos y simulacion de pago
- migraciones y datos seed

## Archivos mas importantes

### Raiz

- `README.md`
- `.env.local`
- `.env.prod`
- `.nvmrc`
- `docker-compose.dev.yml`
- `docker-compose.prod.yml`
- `.vscode/settings.json`

### Backend

- `backend/pom.xml`
- `backend/mvnw`
- `backend/mvnw.cmd`
- `backend/.env.local`
- `backend/.env.prod`
- `backend/Dockerfile.dev`
- `backend/Dockerfile.prod`
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/db/migration/V1__init_heliconias.sql`
- `backend/sql/reportes_obligatorios.sql`

### Frontend

- `frontend/package.json`
- `frontend/.env.local`
- `frontend/.env.prod`
- `frontend/Dockerfile.dev`
- `frontend/Dockerfile.prod`
- `frontend/next.config.ts`
- `frontend/app/login/page.tsx`
- `frontend/app/dashboard/page.tsx`
- `frontend/lib/api.ts`
- `frontend/lib/modules.ts`

## Troubleshooting

### El login no funciona

Revisar:

- que el backend este levantado
- que la base tenga la migracion aplicada
- que el usuario exista y este activo
- que `NEXT_PUBLIC_API_URL` apunte al backend correcto

### El frontend usa otro Node

Verificar:

- `.nvmrc`
- `.vscode/settings.json`
- que `node -v` apunte a Node 24

### El backend no conecta a PostgreSQL

Verificar:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- que `postgres` este levantado y saludable

### Las imagenes de productos no cargan

Verificar:

- que el archivo no exceda `15 MB`
- que el backend tenga permisos sobre el directorio `uploads`
- que el frontend apunte al backend correcto

## Recomendacion de lectura

Para continuar desarrollando el proyecto con claridad:

1. leer este `README.md`
2. leer `backend/README.md`
3. leer `frontend/README.md`


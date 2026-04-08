# ATENCION Y CONTROL INTERNO DEL RECREO CAMPESTRE HELICONIAS PUCALLPA

Proyecto full-stack actualizado con:

- `backend/`: Spring Boot `4.0.3`, Java `25`, Maven Wrapper, JWT, Argon2, PostgreSQL y Flyway
- `frontend/`: Next.js `16.2.2`, React 19, Tailwind CSS y Node `24.13.0`
- Dockerización completa para `dev` y `prod`
- VS Code configurado para usar Java 25 por defecto y priorizar Node 24 sobre Laragon

## Versiones fijadas

- Spring Boot `4.0.3`
- Java `25`
- Maven Wrapper `3.3.4` con Maven distribuido `3.9.14`
- Next.js `16.2.2`
- Node local esperado `24.13.0`

## Node y Java detectados en este equipo

Verificación hecha en el workspace:

- `node -v` resolvía `v18.8.0` desde `C:\laragon\bin\nodejs\node-v18\node.exe`
- `C:\Program Files\nodejs\node.exe -v` devolvió `v24.13.0`
- `java -version` devolvió `OpenJDK 25.0.2 LTS`

Por eso el workspace quedó configurado en [settings.json](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/.vscode/settings.json) para preferir:

- Java: `C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot`
- Node: `C:\Program Files\nodejs\node.exe`

## Docker

Archivos creados:

- Desarrollo: [docker-compose.dev.yml](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/docker-compose.dev.yml)
- Producción: [docker-compose.prod.yml](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/docker-compose.prod.yml)
- Variables locales: [/.env.local](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/.env.local)
- Variables prod: [/.env.prod](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/.env.prod)

### Levantar desarrollo

```bash
docker compose --env-file .env.local -f docker-compose.dev.yml up --build
```

### Levantar producción

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up --build -d
```

## Backend

Incluye:

- autenticación JWT con roles `ADMINISTRADOR` y `OPERADOR`
- Maven Wrapper para no depender de Maven global
- migración SQL completa con tablas, vistas, triggers, stored procedures y datos ficticios
- contraseñas iniciales convertidas automáticamente a Argon2 al arrancar
- CRUD REST para los módulos operativos
- endpoint para cargar foto de producto
- dashboard y reportes obligatorios

Archivos clave:

- [pom.xml](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/backend/pom.xml)
- [application.yml](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/backend/src/main/resources/application.yml)
- [V1__init_heliconias.sql](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/backend/src/main/resources/db/migration/V1__init_heliconias.sql)
- [Dockerfile.dev](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/backend/Dockerfile.dev)
- [Dockerfile.prod](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/backend/Dockerfile.prod)
- [mvnw](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/backend/mvnw)
- [mvnw.cmd](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/backend/mvnw.cmd)
- [maven-wrapper.properties](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/backend/.mvn/wrapper/maven-wrapper.properties)
- [backend/.env.local](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/backend/.env.local)
- [backend/.env.prod](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/backend/.env.prod)

## Frontend

Incluye:

- login profesional
- dashboard con indicadores
- módulos CRUD conectados al backend
- reportes obligatorios
- soporte de imagen para productos
- salida `standalone` para despliegue productivo

Archivos clave:

- [package.json](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/frontend/package.json)
- [next.config.ts](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/frontend/next.config.ts)
- [login/page.tsx](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/frontend/app/login/page.tsx)
- [dashboard/page.tsx](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/frontend/app/dashboard/page.tsx)
- [Dockerfile.dev](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/frontend/Dockerfile.dev)
- [Dockerfile.prod](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/frontend/Dockerfile.prod)
- [frontend/.env.local](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/frontend/.env.local)
- [frontend/.env.prod](/C:/Users/ffigu/OneDrive/Documentos/niceforo-project/diseño-control-country-recreation/frontend/.env.prod)

## Credenciales iniciales

- `admin / Admin2026*`
- `operador / Operador2026*`

## Endpoints principales

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST /api/crud/{recurso}`
- `GET|PUT|DELETE /api/crud/{recurso}/{id}`
- `POST /api/productos/{id}/foto`
- `GET /api/dashboard/summary`
- `GET /api/reportes`

## Validación hecha

- `npm install` ejecutado en frontend
- `npm run build` ejecutado correctamente con Next.js `16.2.2`
- Docker de desarrollo actualizado para arrancar backend con `./mvnw`

El backend ya no depende de `mvn` global. Puedes arrancarlo localmente con:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

o en Docker dev con el `docker-compose.dev.yml`.

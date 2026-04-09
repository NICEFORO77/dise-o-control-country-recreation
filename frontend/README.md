# Frontend - Heliconias Pucallpa

Aplicacion web del sistema de atencion y control interno del Recreo Campestre Heliconias Pucallpa.

## Objetivo del frontend

El frontend ofrece la interfaz visual para los perfiles `ADMINISTRADOR` y `OPERADOR`. Desde aqui se consume la API del backend para:

- iniciar sesion
- navegar por modulos del sistema
- gestionar CRUD por tabla
- ejecutar operaciones rapidas
- consultar reportes y tablero
- cargar foto de productos

## Stack tecnico

- Next.js `16.2.2`
- React `19.2.0`
- Tailwind CSS `4.1.4`
- TypeScript
- App Router

## Estructura del frontend

```text
frontend/
|-- app/
|   |-- dashboard/
|   |   |-- aperturas-caja/
|   |   |-- auditoria/
|   |   |-- cajas/
|   |   |-- categorias-producto/
|   |   |-- clientes/
|   |   |-- detalle-pedido/
|   |   |-- mesas/
|   |   |-- metodos-pago/
|   |   |-- movimientos-caja/
|   |   |-- operaciones/
|   |   |-- pagos/
|   |   |-- pedidos/
|   |   |-- productos/
|   |   |-- reportes/
|   |   |-- reservas/
|   |   |-- roles/
|   |   |-- simulaciones-pago/
|   |   |-- usuarios/
|   |   |-- zonas/
|   |   `-- page.tsx
|   |-- login/
|   |   `-- page.tsx
|   |-- globals.css
|   |-- layout.tsx
|   `-- page.tsx
|-- lib/
|   |-- api.ts
|   `-- modules.ts
|-- .env.local
|-- .env.prod
|-- Dockerfile.dev
|-- Dockerfile.prod
|-- next.config.ts
`-- package.json
```

## Configuracion

### Variable principal

Archivo:

- `.env.local`
- `.env.prod`

Variable:

- `NEXT_PUBLIC_API_URL`

Por defecto apunta a:

- `http://localhost:8080`

## Arranque local

```powershell
cd frontend
npm install
npm run dev
```

## Docker

### Desarrollo

Archivo:

- `Dockerfile.dev`

Comportamiento:

- usa `node:24.13.0-alpine`
- instala dependencias
- ejecuta `next dev`

### Produccion

Archivo:

- `Dockerfile.prod`

Comportamiento:

- `deps`
- `builder`
- `runner`
- salida `standalone`
- arranque con `node server.js`

## Entrada de la aplicacion

### `/`

Archivo:

- `app/page.tsx`

Comportamiento:

- redirige automaticamente a `/login`

### `/login`

Archivo:

- `app/login/page.tsx`

Responsabilidades:

- mostrar identidad del sistema
- solicitar usuario y contraseña
- autenticar contra el backend
- guardar sesion
- redirigir al dashboard

## Gestion de sesion

La sesion se maneja en:

- `lib/api.ts`

Claves en `localStorage`:

- `heliconias-token`
- `heliconias-user`

Funciones principales:

- `getStoredToken`
- `getStoredUser`
- `persistSession`
- `clearSession`
- `apiFetch`
- `uploadProductPhoto`

## Dashboard

La base del panel esta en:

- `app/dashboard/page.tsx`

Este archivo actua como shell compartido del sistema y resuelve:

- lectura de sesion
- carga de usuario actual
- carga de indicadores
- carga de reportes
- carga de formularios CRUD
- navegacion por rutas reales
- paginacion
- mensajes de exito y error
- carga de foto de producto
- flujo de operaciones

## Rutas del dashboard

Cada modulo tiene su propia carpeta y su propio `page.tsx`.

### Rutas principales

- `/dashboard`
- `/dashboard/reportes`
- `/dashboard/operaciones`
- `/dashboard/roles`
- `/dashboard/usuarios`
- `/dashboard/clientes`
- `/dashboard/zonas`
- `/dashboard/mesas`
- `/dashboard/categorias-producto`
- `/dashboard/productos`
- `/dashboard/reservas`
- `/dashboard/pedidos`
- `/dashboard/detalle-pedido`
- `/dashboard/metodos-pago`
- `/dashboard/pagos`
- `/dashboard/cajas`
- `/dashboard/aperturas-caja`
- `/dashboard/movimientos-caja`
- `/dashboard/auditoria`

### Ruta interna no visible en sidebar

- `/dashboard/simulaciones-pago`

Esta ruta sigue existiendo, pero no aparece como item principal del sidebar porque la simulacion de pago forma parte del flujo operativo y se trabaja desde `Operaciones`.

## Comportamiento por rol

### Administrador

Vista inicial:

- `/dashboard/usuarios`

Acceso esperado:

- modulos administrativos
- modulos operativos
- reportes
- auditoria

### Operador

Vista inicial:

- `/dashboard/clientes`

Acceso esperado:

- clientes
- reservas
- pedidos
- detalle de pedido
- pagos
- operaciones
- reportes operativos

## Definicion de modulos

La definicion central esta en:

- `lib/modules.ts`

Ese archivo describe:

- clave interna del modulo
- titulo
- descripcion
- endpoint backend
- campo id
- roles autorizados
- si se muestra o no en navegacion
- campos del formulario

## Paginas CRUD

Cada pagina del dashboard reutiliza la shell comun pero con una vista inicial distinta. Esto permite:

- tener rutas reales por modulo
- conservar un solo motor CRUD visual
- mantener el sidebar y la estructura consistentes

Cada CRUD ofrece:

- formulario de registro
- edicion
- eliminacion
- tabla de resultados
- paginacion
- busqueda local por texto

## Operaciones

La vista `Operaciones` centraliza el flujo rapido del operador:

- reserva de mesa
- apertura de pedido
- agregado de detalle
- simulacion de pago

La simulacion de pago no se presenta como seccion lateral independiente porque conceptualmente forma parte del proceso de atencion y cobro.

## Reportes y tablero

La vista `Reportes y tablero` agrupa:

- indicadores del dia
- reportes obligatorios
- acceso ejecutivo a la informacion

Los bloques visuales de resumen solo deben mostrarse aqui, no en las paginas CRUD individuales.

## Integracion con backend

El frontend consume:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard/summary`
- `GET /api/reportes`
- `GET /api/operaciones/codigos`
- `POST /api/operaciones/simular-pago`
- `POST /api/productos/{id}/foto`
- `GET|POST|PUT|DELETE /api/crud/{resource}`

## Imagenes de productos

La carga de foto se gestiona desde:

- `lib/api.ts`
- `app/dashboard/page.tsx`

Consideraciones:

- usa `multipart/form-data`
- respeta el limite de 15 MB definido por backend
- no obliga a subir imagen al editar otros campos del producto

## Navegacion

La navegacion se resuelve por URL real con `router.push`.

Esto permite:

- historial correcto del navegador
- rutas compartibles
- estructura clara por modulo

## Estilo visual

La identidad grafica se define en:

- `app/globals.css`

Lineamientos del tema:

- base calida inspirada en recreo turistico
- tonos tierra, arena, verde y acento ambar
- paneles tipo glass
- fondo con gradientes suaves

## Configuracion de Next.js

Archivo:

- `next.config.ts`

Puntos importantes:

- `output: "standalone"` para produccion
- `remotePatterns` habilitado para imagenes desde `http://localhost:8080/uploads/**`

## Archivos clave del frontend

- `package.json`
- `.env.local`
- `.env.prod`
- `next.config.ts`
- `app/layout.tsx`
- `app/page.tsx`
- `app/login/page.tsx`
- `app/dashboard/page.tsx`
- `lib/api.ts`
- `lib/modules.ts`

## Verificacion recomendada

1. abrir `/login`
2. ingresar con `admin` o `operador`
3. validar redireccion al dashboard segun el rol
4. abrir varios modulos del sidebar
5. crear y editar registros
6. probar producto con y sin foto
7. usar `Operaciones`
8. revisar `Reportes y tablero`

## Troubleshooting

### El frontend no conecta al backend

Revisar:

- `NEXT_PUBLIC_API_URL`
- que el backend este levantado
- que no exista error de CORS

### El login redirige otra vez a `/login`

Revisar:

- que el token se haya guardado en `localStorage`
- que `/api/auth/me` responda correctamente

### Las rutas no aparecen

Revisar:

- que exista la carpeta del modulo en `app/dashboard`
- que el modulo este definido en `lib/modules.ts`
- que el rol tenga permiso para verlo

### Una tabla no edita bien

Revisar:

- definicion del campo en `lib/modules.ts`
- si es `select` con opciones fijas
- si es `select` contra lookup
- el tipo de dato esperado por backend


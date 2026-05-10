# Manual de Operacion y Deploy - InduMex 2.0

Este documento centraliza como:

- arrancar el proyecto en local
- preparar build para servidor
- migrar base de datos con Sequelize CLI
- definir variables de entorno para dev y produccion
- desplegar en VPS Linux sin Docker

## 1. Arquitectura

- client: Next.js (App Router, TypeScript, Tailwind)
- server: Node.js + Express + TypeScript + Sequelize (MySQL)

Puertos por defecto:

- Frontend: 3000
- Backend: 4000

## 2. Requisitos de sistema

- Node.js 20 o superior
- npm 10 o superior
- MySQL 8+ (o compatible)
- PM2 recomendado para produccion (opcional)
- Nginx recomendado como reverse proxy (opcional)

## 3. Variables de entorno

## 3.1 Server (.env)

Archivo: server/.env

```env
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=indumex
DB_USER=root
DB_PASSWORD=
JWT_SECRET=indumex-dev-secret-change-in-production
JWT_EXPIRES_IN=8h
```

Variables criticas en produccion:

- NODE_ENV: production
- PORT: puerto interno del servicio backend (ej. 4000)
- DB_HOST: host real de MySQL
- DB_PORT: normalmente 3306
- DB_NAME: nombre de la BD de produccion
- DB_USER: usuario con permisos de DDL/DML
- DB_PASSWORD: password fuerte y no vacio
- JWT_SECRET: clave privada para firmar tokens JWT (obligatoria y fuerte)
- JWT_EXPIRES_IN: duracion de sesion JWT (ej. 8h, 12h, 1d)

Recomendacion de seguridad para produccion (Linux):

```bash
openssl rand -base64 48
```

Usa el valor generado como `JWT_SECRET` en `server/.env` y nunca subas ese secreto al repositorio.

## 3.2 Client (.env.local)

Archivo sugerido: client/.env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

En produccion debe apuntar al dominio API real, por ejemplo:

```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api/v1
```

## 4. Instalacion inicial

Desde la raiz del proyecto:

```bash
npm install
npm --prefix client install
npm --prefix server install
```

## 5. Arranque en desarrollo

Desde la raiz:

```bash
npm run dev
```

Esto inicia las dos instancias al mismo tiempo:

- client (Next.js) en 3000
- server (Express) en 4000

## 6. Build y arranque tipo produccion

### 6.1 Compilar

```bash
npm run build
```

### 6.2 Iniciar

```bash
npm run start
```

Nota: para deploy real, normalmente se ejecuta cada servicio por separado con PM2/Nginx.

## 7. Migraciones con Sequelize CLI

Ya estan configurados scripts en server/package.json.

Tambien existe un comando de conveniencia desde la raiz para deploy de BD completo:

```bash
npm run db:deploy
```

Este comando ejecuta en secuencia:

- `db:migrate`
- `db:seed`

### 7.1 Crear base de datos (si no existe)

```bash
npm --prefix server run db:create
```

### 7.2 Ejecutar migraciones

```bash
npm --prefix server run db:migrate
```

### 7.3 Revertir ultima migracion

```bash
npm --prefix server run db:migrate:undo
```

### 7.4 Revertir todas las migraciones

```bash
npm --prefix server run db:migrate:undo:all
```

### 7.5 Ejecutar seeders

```bash
npm --prefix server run db:seed
```

### 7.6 Revertir seeders

```bash
npm --prefix server run db:seed:undo
```

## 8. Flujo sugerido para cambios de esquema

1. Crear nueva migracion

```bash
cd server
npx sequelize-cli migration:generate --name nombre-del-cambio
```

2. Editar archivo generado en server/migrations
3. Ejecutar migraciones en entorno local

```bash
npm --prefix server run db:migrate
```

4. Probar backend y frontend
5. Desplegar codigo
6. Ejecutar migraciones en servidor productivo antes de exponer trafico

## 9. Deploy manual en VPS (sin Docker)

Ejemplo de secuencia:

1. Clonar repositorio y entrar a la carpeta del proyecto
2. Configurar server/.env y client/.env.local con valores productivos
3. Instalar dependencias

```bash
npm install
npm --prefix client install
npm --prefix server install
```

4. Compilar

```bash
npm run build
```

5. Correr migraciones

```bash
npm run db:deploy
```

6. Levantar servicios con PM2 (recomendado)

```bash
pm2 start "npm --prefix server run start" --name indumex-server
pm2 start "npm --prefix client run start" --name indumex-client
pm2 save
pm2 startup
```

## 10. Reverse proxy (recomendado)

- Frontend: servir en tudominio.com -> localhost:3000
- Backend: servir en api.tudominio.com -> localhost:4000
- Habilitar HTTPS (LetsEncrypt)

## 11. Checklist pre-deploy

- Variables .env correctas para cada entorno
- Conexion MySQL validada
- npm run build sin errores
- Migraciones aplicadas
- Servicio backend responde GET /api/v1/proveedores
- Frontend consume NEXT_PUBLIC_API_URL correcto
- PM2/Nginx levantados

## 12. Comandos Sequelize solicitados (referencia rapida)

Dentro de server:

```bash
npm install sequelize mysql2
npm install -D sequelize-cli
npx sequelize-cli init
```

El init puede ser opcional si ya existe configuracion (como en este proyecto).

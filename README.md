# InduMex 2.0

Proyecto full-stack con arquitectura separada:

- `client`: Next.js (App Router) + TypeScript + Tailwind CSS
- `server`: Node.js + Express + TypeScript + Sequelize (MySQL)

## Requisitos

- Node.js 20+
- MySQL local con base de datos `indumex`
- Usuario local configurado:
  - user: `root`
  - password: vacio
  - host: `localhost`

## Instalacion

En la raiz del proyecto:

```bash
npm install
npm --prefix server install
npm --prefix client install
```

## Desarrollo

Desde la raiz:

```bash
npm run dev
```

Servicios:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Endpoint prueba: http://localhost:4000/api/v1/proveedores

## Scripts utiles

### Raiz

```bash
npm run dev
npm run build
npm run start
```

### Server

```bash
npm --prefix server run dev
npm --prefix server run build
npm --prefix server run start
```

### Client

```bash
npm --prefix client run dev
npm --prefix client run build
npm --prefix client run start
```

## Pasos criticos para VPS/local (manual)

Ejecuta estos comandos dentro de `server` si necesitas reconfigurar Sequelize:

```bash
cd server
npm install sequelize mysql2
npm install -D sequelize-cli
npx sequelize-cli init
```

`npx sequelize-cli init` es opcional para esta version inicial.

## Manual completo

Consulta [MANUAL_DEPLOY.md](MANUAL_DEPLOY.md) para:

- despliegue en VPS sin Docker
- migraciones con Sequelize CLI
- variables de entorno por entorno
- checklist pre-deploy y operacion

# Café Admin — Guía de Instalación

## Requisitos

- Node.js 18+
- Docker Desktop (para PostgreSQL)
- Git

## Pasos

### 1. Levantar la base de datos

```bash
docker-compose up -d
```

Esto crea PostgreSQL en `localhost:5432` con:
- Usuario: `cafe`
- Contraseña: `cafe123`
- Base de datos: `cafe_admin`

### 2. Instalar y configurar el backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run db:seed
```

Esto crea las tablas y carga los usuarios y productos de ejemplo.

**Usuarios creados:**
- Admin: `admin@cafe.com` / `admin123`
- Cajero: `cajero@cafe.com` / `cajero123`

### 3. Iniciar el backend

```bash
npm run dev
```

Corre en `http://localhost:3001`

### 4. Instalar y iniciar el frontend

```bash
cd ../frontend
npm install
npm run dev
```

Abre `http://localhost:5173`

---

## Estructura del sistema

### Roles
- **ADMIN**: Ve todo — dashboard, ventas, egresos, caja, productos, reportes y usuarios
- **CAJERO**: Puede registrar ventas, egresos, abrir/cerrar caja

### Flujo diario
1. Abrir caja (ingresar monto inicial)
2. Registrar ventas (productos + método de pago)
3. Registrar egresos (pagos, compras)
4. Cerrar caja al final del día

### Métodos de pago
- Efectivo (CASH)
- Tarjeta de Crédito
- Tarjeta de Débito
- Transferencia

---

## Instalar como PWA

- **Desktop**: Chrome/Edge → ícono de instalar en la barra de direcciones
- **Android**: Chrome → "Agregar a pantalla de inicio"
- **iOS**: Safari → Compartir → "Agregar a pantalla de inicio"

---

## Producción

Para deploy en producción:

1. Cambiar `JWT_SECRET` por una clave segura aleatoria
2. Cambiar `DATABASE_URL` a tu base de datos de producción
3. Configurar `FRONTEND_URL` con el dominio del frontend
4. `cd backend && npm run build && npm start`
5. `cd frontend && npm run build` → servir la carpeta `dist/` con nginx o similar

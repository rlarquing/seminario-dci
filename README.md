# 🎓 Seminario DCI - Sistema de Gestión Académica

Sistema completo de gestión académica para el Seminario DCI, desarrollado con Next.js 16, TypeScript, Prisma y SQLite.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-green)

## 📋 Características

### Gestión de Alumnos
- Registro completo de información personal (según Excel)
- Número de expediente único
- Carnet de identidad, pasaporte
- Información eclesiástica (iglesia, pastor)
- Control de documentación (huella biométrica, foto)
- Pago de cuotas
- Habilidades y disposición misionera

### Gestión de Profesores
- Registro de datos personales
- Asignación de materias que imparten
- Control de documentación

### Gestión de Asignaturas
- 8 asignaturas del seminario precargadas
- Administración de códigos

### Sistema de Notas
- Ingreso de calificaciones por alumno y asignatura
- Cálculo automático de promedios
- Guardado individual o masivo

### Certificados de Notas
- Vista previa del certificado con logo institucional
- Generación de PDF profesional
- Opción de impresión directa
- Incluye código QR de la institución

## 🚀 Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/rlarquing/seminario-dci.git
cd seminario-dci

# Instalar dependencias
bun install

# Configurar base de datos
bun run db:push

# Inicializar asignaturas
curl -X POST http://localhost:3000/api/asignaturas/init

# Iniciar servidor
bun run dev
```

---

## ☁️ DESPLIEGUE EN VERCEL

### ⚠️ IMPORTANTE: Vercel NO soporta SQLite

Vercel es una plataforma **serverless**, lo que significa que no tiene un sistema de archivos persistente. **SQLite requiere un archivo físico**, por lo que NO funcionará en Vercel.

### ✅ Solución: Usar PostgreSQL

Sigue estos pasos para desplegar correctamente:

---

### PASO 1: Crear base de datos PostgreSQL

#### Opción A: Vercel Postgres (Más fácil)
1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en **Storage** → **Create Database** → **Postgres**
3. Elige una región cercana a tus usuarios
4. Haz clic en **Create**
5. Vercel creará automáticamente las variables de entorno

#### Opción B: Neon (PostgreSQL gratuito)
1. Ve a [neon.tech](https://neon.tech) y crea una cuenta
2. Crea un nuevo proyecto
3. Copia la **Connection string** (formato: `postgresql://...`)
4. Guárdala para el siguiente paso

#### Opción C: Supabase (PostgreSQL gratuito)
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a **Project Settings** → **Database**
4. Copia la **Connection string** (formato: `postgresql://...`)

---

### PASO 2: Modificar el Schema

Edita el archivo `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"  // Cambiar de "sqlite" a "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")  // Agregar esta línea
}

// ... resto del schema sin cambios
```

---

### PASO 3: Configurar Variables de Entorno en Vercel

Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**

Agrega estas variables:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Tu connection string de PostgreSQL (con `?pgbouncer=true` si usa pooler) |
| `DIRECT_DATABASE_URL` | Tu connection string directo (sin pgbouncer) |

**Ejemplo para Neon:**
```
DATABASE_URL=postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
DIRECT_DATABASE_URL=postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Ejemplo para Supabase:**
```
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

---

### PASO 4: Configurar Build Settings

En Vercel → **Settings** → **General** → **Build & Development Settings**:

**Build Command:**
```
prisma generate && prisma migrate deploy && next build
```

**Install Command:**
```
bun install
```

---

### PASO 5: Desplegar

1. Haz push a tu repositorio:
```bash
git add .
git commit -m "configure for vercel deployment"
git push
```

2. Vercel detectará los cambios y desplegará automáticamente

3. **Primera vez:** Después del despliegue, inicializa las asignaturas:
```bash
curl -X POST https://tu-app.vercel.app/api/asignaturas/init
```

---

## 🔧 Solución de Problemas

### Error: "Can't reach database server"
- Verifica que las variables `DATABASE_URL` y `DIRECT_DATABASE_URL` estén correctas
- Asegúrate de que la base de datos PostgreSQL esté activa

### Error: "Prisma Client could not be generated"
- El schema tiene un error de sintaxis
- Verifica que el provider sea `postgresql`

### Error: "Table doesn't exist"
- Ejecuta las migraciones: `prisma migrate deploy`
- O usa `prisma db push` en el build

---

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide Icons
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **ORM**: Prisma
- **PDF**: jsPDF, jspdf-autotable

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/           # API Routes (REST)
│   │   ├── alumnos/   # CRUD alumnos
│   │   ├── profesores/# CRUD profesores
│   │   ├── asignaturas/# CRUD asignaturas
│   │   ├── notas/     # CRUD notas
│   │   └── certificado/ # Generación certificados
│   └── page.tsx       # Página principal
├── components/        # Componentes React
└── lib/
    └── db.ts          # Cliente Prisma
```

## 🎨 Personalización

### Logo y QR
Reemplaza los archivos en `public/images/`:
- `logo.png` - Logo del seminario
- `qr.png` - Código QR institucional

---

Desarrollado con ❤️ para el Seminario DCI

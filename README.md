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

## ☁️ DESPLIEGUE EN VERCEL CON TURSO

### ¿Por qué Turso?

**Vercel NO soporta SQLite local** porque es serverless. **Turso** es la mejor opción porque:
- ✅ SQLite distribuido (compatible con tu schema actual)
- ✅ Plan GRATIS generoso
- ✅ Fácil configuración
- ✅ Baja latencia global

---

### PASO 1: Crear cuenta en Turso

1. Ve a [turso.tech](https://turso.tech) y crea una cuenta GRATIS
2. Haz clic en **"Create Database"**
3. Ponle un nombre (ej: `seminario-dci`)
4. Selecciona la región más cercana a Cuba

---

### PASO 2: Obtener las credenciales

1. En tu base de datos, ve a **"Settings"** → **"Database Authentication"**
2. Haz clic en **"Create Token"**
3. Copia el **Token** que aparece (solo se muestra una vez)

4. También necesitas la **URL** de la base de datos, que se ve así:
   ```
   libsql://seminario-dci-[tu-usuario].turso.io
   ```

---

### PASO 3: Configurar variables en Vercel

Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**

Agrega esta variable:

| Nombre | Valor |
|--------|-------|
| `DATABASE_URL` | `libsql://TU-BASE-DEDATOS.turso.io?authToken=TU-TOKEN` |

**Ejemplo real:**
```
DATABASE_URL="libsql://seminario-dci-rlarquing.turso.io?authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### PASO 4: Instalar dependencia Turso

```bash
bun add @libsql/client
```

---

### PASO 5: Actualizar Prisma para Turso

Edita `prisma/schema.prisma` - solo necesitas agregar el output:

```prisma
generator client {
  provider        = "prisma-client-js"
  output          = "../node_modules/.prisma/client"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

---

### PASO 6: Actualizar el cliente de base de datos

Reemplaza el contenido de `src/lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || (() => {
  // Detectar si es Turso (URL comienza con libsql://)
  if (process.env.DATABASE_URL?.startsWith('libsql://')) {
    const url = process.env.DATABASE_URL.split('?')[0]
    const authToken = process.env.DATABASE_URL.split('authToken=')[1]
    
    const libsql = createClient({ url, authToken })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter })
  }
  
  // SQLite local para desarrollo
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })
})()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

---

### PASO 7: Configurar Build en Vercel

En Vercel → **Settings** → **General** → **Build Command**:

```
prisma generate && next build
```

---

### PASO 8: Desplegar

1. Sube los cambios:
```bash
git add .
git commit -m "configurar para turso"
git push
```

2. Vercel desplegará automáticamente

3. Después del despliegue, inicializa las asignaturas:
```bash
curl -X POST https://tu-app.vercel.app/api/asignaturas/init
```

---

## 📋 RESUMEN DE VARIABLES DE ENTORNO

### Para DESARROLLO LOCAL (`.env`):
```env
DATABASE_URL="file:./db/local.db"
```

### Para VERCEL con TURSO:
```env
DATABASE_URL="libsql://TU-BASE.turso.io?authToken=TU-TOKEN"
```

---

## 🔧 Solución de Problemas

### Error: "libsql client not found"
```bash
bun add @libsql/client
```

### Error: "PrismaLibSQL not found"
```bash
bun add @prisma/adapter-libsql
```

### Error: "Can't reach database"
- Verifica que el token de Turso sea correcto
- Asegúrate de que la URL sea `libsql://...` (no `https://...`)

### Error: "Database locked"
- Turso no tiene este problema (es serverless)
- Si pasa localmente, reinicia el servidor

---

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide Icons
- **Base de Datos**: SQLite (desarrollo) / Turso (producción)
- **ORM**: Prisma
- **PDF**: jsPDF, jspdf-autotable

---

## 🎨 Personalización

### Logo y QR
Reemplaza los archivos en `public/images/`:
- `logo.png` - Logo del seminario
- `qr.png` - Código QR institucional

---

Desarrollado con ❤️ para el Seminario DCI

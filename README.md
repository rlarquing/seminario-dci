# 🎓 Seminario DCI - Sistema de Gestión Académica

Sistema completo de gestión académica para el Seminario DCI, desarrollado con Next.js 16, TypeScript, Prisma y SQLite/Turso.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-green)

## 📋 Características

- **Gestión de Alumnos**: Registro completo con información personal y eclesiástica
- **Gestión de Profesores**: Datos personales y asignaturas que imparten
- **Gestión de Asignaturas**: 8 materias del seminario precargadas
- **Sistema de Notas**: Calificaciones con cálculo automático de promedios
- **Certificados**: Vista previa, PDF e impresión

---

## 🚀 INICIO RÁPIDO

### Opción A: Desarrollo Local (SQLite)

```bash
# 1. Clonar el repositorio
git clone https://github.com/rlarquing/seminario-dci.git
cd seminario-dci

# 2. Instalar dependencias
npm install

# 3. Crear la base de datos local
npm run db:push

# 4. Iniciar el servidor
npm run dev
```

Abre http://localhost:3000 en tu navegador.

---

### Opción B: Producción con Turso (Vercel)

#### Paso 1: Crear base de datos en Turso

1. Ve a [turso.tech](https://turso.tech) y crea una cuenta **GRATIS**
2. Haz clic en **"Create Database"**
3. Nombre: `seminario-dci` (o el que prefieras)
4. Selecciona cualquier región

#### Paso 2: Obtener credenciales

En el dashboard de Turso:

- **DATABASE_URL**: La URL de tu base de datos (ej: `libsql://seminario-dci-abc123.turso.io`)
- **TURSO_AUTH_TOKEN**: 
  1. Ve a **Settings** → **Database Authentication**
  2. Clic en **"Create Token"**
  3. Copia el token (solo se muestra una vez)

#### Paso 3: Configurar variables en Vercel

Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**

Agrega estas **DOS** variables:

| Nombre | Valor | Ejemplo |
|--------|-------|---------|
| `DATABASE_URL` | URL de Turso | `libsql://seminario-dci-abc123.turso.io` |
| `TURSO_AUTH_TOKEN` | Token de autenticación | `eyJhbGciOiJIUzI1NiIs...` |

#### Paso 4: Desplegar

1. Conecta tu repositorio de GitHub a Vercel
2. Vercel detectará Next.js automáticamente
3. Clic en **Deploy**

#### Paso 5: Inicializar la base de datos

**IMPORTANTE**: Después del despliegue, debes crear las tablas.

Abre la consola del navegador (F12) en tu sitio y ejecuta:
```javascript
fetch('/api/init-db', { method: 'POST' }).then(r => r.json()).then(console.log)
```

O desde terminal:
```bash
curl -X POST https://tu-app.vercel.app/api/init-db
```

#### Paso 6: Verificar

Visita este endpoint para ver el estado de la base de datos:
```
https://tu-app.vercel.app/api/status
```

---

## 🔧 Endpoints de Diagnóstico

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/status` | GET | Verifica conexión y cuenta registros |
| `/api/init-db` | GET | Muestra instrucciones de inicialización |
| `/api/init-db` | POST | Crea las tablas y datos iniciales |

---

## 🐛 Solución de Problemas

### Error: "Falta configurar DATABASE_URL"
- Ve a Vercel → Settings → Environment Variables
- Agrega `DATABASE_URL` con tu URL de Turso

### Error: "Falta configurar TURSO_AUTH_TOKEN"
- Ve a Vercel → Settings → Environment Variables
- Agrega `TURSO_AUTH_TOKEN` con tu token de Turso

### Error: "Table not found" o "no such table"
- Ejecuta el inicializador: `curl -X POST https://tu-app.vercel.app/api/init-db`
- O desde la consola del navegador: `fetch('/api/init-db', {method: 'POST'}).then(r=>r.json()).then(console.log)`

### La página carga pero muestra "No hay alumnos"
- Primero debes agregar alumnos desde la pestaña "Alumnos"
- Las asignaturas se crean automáticamente al inicializar

### Error en Windows: "tee no se reconoce"
- Ya está solucionado en la última versión
- Ejecuta `git pull` para obtener los cambios

---

## 📁 Estructura del Proyecto

```
├── prisma/
│   └── schema.prisma      # Esquema de la base de datos
├── public/
│   └── images/            # Logo y QR del seminario
├── src/
│   ├── app/
│   │   ├── api/           # Endpoints REST
│   │   └── page.tsx       # Página principal
│   ├── components/        # Componentes React
│   └── lib/
│       └── db.ts          # Cliente de base de datos
└── .env                   # Configuración local
```

---

## 🔐 Variables de Entorno

### Desarrollo Local (.env)
```env
DATABASE_URL="file:./db/custom.db"
```

### Producción (Vercel)
```env
DATABASE_URL="libsql://tu-base.turso.io"
TURSO_AUTH_TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

---

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide Icons
- **Base de Datos**: SQLite (desarrollo) / Turso (producción)
- **ORM**: Prisma
- **PDF**: jsPDF, jspdf-autotable

---

Desarrollado con ❤️ para el Seminario DCI

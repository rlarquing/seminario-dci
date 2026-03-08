# 🎓 Seminario DCI - Sistema de Gestión Académica

Sistema completo de gestión académica para el Seminario DCI, desarrollado con Next.js 16, TypeScript, Prisma y SQLite.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-green)
![SQLite](https://img.shields.io/badge/SQLite-Database-lightgrey)

## 📋 Características

### Gestión de Alumnos
- Registro completo de información personal
- Datos de contacto y ubicación
- Información eclesiástica (iglesia, pastores)
- Control de documentación y pagos
- Búsqueda y filtrado

### Gestión de Profesores
- Registro de datos personales y contacto
- Asignación de materias que imparten

### Gestión de Asignaturas
- 8 asignaturas precargadas del seminario
- Administración de códigos y nombres

### Sistema de Notas
- Ingreso de calificaciones por alumno
- Cálculo automático de promedios
- Guardado individual o masivo

### Certificados de Notas
- Vista previa del certificado con logo institucional
- Generación de PDF profesional
- Opción de impresión directa
- Incluye código QR de la institución

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd seminario-dci

# Instalar dependencias
bun install

# Configurar base de datos
bun run db:push

# Inicializar asignaturas por defecto
curl -X POST http://localhost:3000/api/asignaturas/init

# Iniciar servidor de desarrollo
bun run dev
```

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide Icons
- **Base de Datos**: SQLite con Prisma ORM
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
│   ├── alumnos-tab.tsx
│   ├── profesores-tab.tsx
│   ├── asignaturas-tab.tsx
│   ├── notas-tab.tsx
│   └── certificados-tab.tsx
└── lib/
    └── db.ts          # Cliente Prisma
```

## 📊 Base de Datos

### Modelo de Datos

- **Alumnos**: Información personal completa (20+ campos)
- **Profesores**: Datos básicos + asignatura asignada
- **Asignaturas**: Código y nombre de la materia
- **Notas**: Relación alumno-asignatura con calificación

## 🎨 Personalización

### Logo y QR
Reemplaza los archivos en `public/images/`:
- `logo.png` - Logo del seminario
- `qr.png` - Código QR institucional

### Asignaturas
Las asignaturas se pueden modificar desde la pestaña "Asignaturas" en la aplicación o directamente en la base de datos.

## 📄 Licencia

Este proyecto es de uso interno para el Seminario DCI.

---

Desarrollado con ❤️ para el Seminario DCI

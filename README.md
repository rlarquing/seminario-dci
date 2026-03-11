# 🎓 Seminario DCI - Sistema de Gestión Académica

Sistema completo de gestión académica para el Seminario DCI, desarrollado con Next.js 16, TypeScript, Prisma y SQLite/Turso.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-green)

## 📋 Características

### Gestión de Alumnos
- Registro completo de información personal
- Número de expediente único
- Carnet de identidad, pasaporte
- Información eclesiástica (iglesia, pastor)
- Control de documentación (huella biométrica, foto)
- Pago de cuotas

### Gestión de Profesores
- Registro de datos personales
- Asignación de materias que imparten

### Gestión de Asignaturas
- 8 asignaturas del seminario precargadas
- Administración de códigos

### Sistema de Notas
- Ingreso de calificaciones por alumno y asignatura
- Cálculo automático de promedios

### Certificados de Notas
- Vista previa del certificado con logo institucional
- Generación de PDF profesional
- Opción de impresión directa

---

## 🚀 DESPLIEGUE EN VERCEL CON TURSO

### Paso 1: Crear cuenta en Turso

1. Ve a [turso.tech](https://turso.tech) y crea una cuenta GRATIS
2. Haz clic en **"Create Database"**
3. Ponle un nombre (ej: `seminario-dci`)
4. Selecciona cualquier región

### Paso 2: Obtener las credenciales

En el dashboard de Turso:

1. **URL de la base de datos**: Se ve así:
   ```
   libsql://seminario-dci-TU-USUARIO.turso.io
   ```
   (La encuentras en la página principal de tu base de datos)

2. **Token de autenticación**:
   - Ve a **Settings** → **Database Authentication**
   - Haz clic en **"Create Token"**
   - Copia el token (solo se muestra una vez)

### Paso 3: Configurar variables en Vercel

Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**

Agrega estas **DOS** variables:

| Nombre | Valor | Ejemplo |
|--------|-------|---------|
| `TURSO_DATABASE_URL` | La URL de tu base de datos | `libsql://seminario-dci-abc123.turso.io` |
| `TURSO_AUTH_TOKEN` | El token que copiaste | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

⚠️ **IMPORTANTE**: Son DOS variables separadas, NO una sola.

### Paso 4: Desplegar en Vercel

1. Conecta tu repositorio de GitHub a Vercel
2. Vercel detectará Next.js automáticamente
3. Haz clic en **Deploy**

### Paso 5: Inicializar la base de datos

Después de que Vercel termine el despliegue, necesitas crear las tablas y los datos iniciales.

**Opción A - Desde el navegador:**
1. Abre tu navegador
2. Ve a: `https://TU-APP.vercel.app/api/init-db`
3. Verás un mensaje de instrucciones
4. Ahora usa una herramienta como Postman, Insomnia o curl para hacer un **POST** a esa misma URL

**Opción B - Desde terminal (curl):**
```bash
curl -X POST https://TU-APP.vercel.app/api/init-db
```

**Opción C - Desde el navegador (método simple):**
1. Abre la consola del navegador (F12)
2. Escribe:
```javascript
fetch('/api/init-db', { method: 'POST' }).then(r => r.json()).then(console.log)
```

### Paso 6: Verificar

Si todo salió bien, verás una respuesta como:
```json
{
  "success": true,
  "message": "Base de datos inicializada correctamente",
  "tablas": ["alumnos", "asignaturas", "profesores", "notas"],
  "asignaturas": [
    { "id": 1, "nombre": "Hermenéutica", "codigo": "HER-101" },
    { "id": 2, "nombre": "Homilética", "codigo": "HOM-101" },
    ...
  ]
}
```

---

## 💻 Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/rlarquing/seminario-dci.git
cd seminario-dci

# Instalar dependencias
bun install

# Configurar base de datos local
bun run db:push

# Iniciar servidor
bun run dev
```

La base de datos local se crea automáticamente en `prisma/db/custom.db`

**Nota**: Después de ejecutar `db:push`, debes inicializar los datos iniciales (asignaturas):

```bash
curl -X POST http://localhost:3000/api/init-db
```

O desde el navegador, abre la consola (F12) y ejecuta:
```javascript
fetch('/api/init-db', { method: 'POST' }).then(r => r.json()).then(console.log)
```

---

## 🔧 Solución de Problemas

### Error: "Authentication failed"
- Verifica que el `TURSO_AUTH_TOKEN` sea correcto
- Asegúrate de que el token no haya expirado

### Error: "Database not found"
- Verifica que la `TURSO_DATABASE_URL` sea correcta
- Debe empezar con `libsql://` (no `https://`)

### Error: "Table not found"
- Ejecuta el endpoint `/api/init-db` con método POST

### La página carga pero no muestra datos
- Ejecuta `/api/init-db` para crear las tablas y datos iniciales

---

## 💻 Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/rlarquing/seminario-dci.git
cd seminario-dci

# Instalar dependencias
bun install

# Configurar base de datos local
bun run db:push

# Iniciar servidor
bun run dev
```

La base de datos local se crea automáticamente en `prisma/db/custom.db`

---

## 📝 Variables de Entorno

### Para DESARROLLO LOCAL:
No necesitas configurar nada, usa SQLite local automáticamente.

### Para VERCEL (PRODUCCIÓN):
```
TURSO_DATABASE_URL=libsql://tu-base.turso.io
TURSO_AUTH_TOKEN=tu-token-de-turso
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

import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'
import { db } from '@/lib/db'

// SQL para crear las tablas
const CREATE_TABLES_SQL = `
-- Tabla de Alumnos
CREATE TABLE IF NOT EXISTS alumnos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numeroExpediente INTEGER NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  ci TEXT NOT NULL UNIQUE,
  telefono TEXT,
  email TEXT,
  pasaporte TEXT,
  direccion TEXT,
  genero TEXT,
  nombreIglesia TEXT,
  nombrePastor TEXT,
  tomaHuellaBiometrica INTEGER DEFAULT 0,
  entregaFoto INTEGER DEFAULT 0,
  pagoCuotas TEXT,
  disposicionCampoMisionero INTEGER DEFAULT 0,
  habilidades TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Asignaturas
CREATE TABLE IF NOT EXISTS asignaturas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Profesores
CREATE TABLE IF NOT EXISTS profesores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  ci TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  genero TEXT,
  nombreIglesia TEXT,
  nombrePastor TEXT,
  tomaHuellaBiometrica INTEGER DEFAULT 0,
  entregaFoto INTEGER DEFAULT 0,
  asignaturaId INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asignaturaId) REFERENCES asignaturas(id)
);

-- Tabla de Notas
CREATE TABLE IF NOT EXISTS notas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alumnoId INTEGER NOT NULL,
  asignaturaId INTEGER NOT NULL,
  nota REAL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alumnoId) REFERENCES alumnos(id) ON DELETE CASCADE,
  FOREIGN KEY (asignaturaId) REFERENCES asignaturas(id),
  UNIQUE(alumnoId, asignaturaId)
);
`

// Asignaturas iniciales del Seminario DCI
const ASIGNATURAS_INICIALES = [
  { nombre: 'Hermenéutica', codigo: 'HER-101' },
  { nombre: 'Homilética', codigo: 'HOM-101' },
  { nombre: 'Eclesiología', codigo: 'ECL-101' },
  { nombre: 'Evangelismo', codigo: 'EVA-101' },
  { nombre: 'Vida Cristiana', codigo: 'VCR-101' },
  { nombre: 'Historia de la Iglesia', codigo: 'HCI-101' },
  { nombre: 'Escatología', codigo: 'ESC-101' },
  { nombre: 'Doctrinas Bíblicas', codigo: 'DBI-101' },
]

export async function POST() {
  try {
    const databaseUrl = process.env.DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN
    
    // Mostrar información de configuración
    const configInfo = {
      databaseUrl: databaseUrl ? (databaseUrl.startsWith('libsql://') ? databaseUrl : 'SQLite local') : 'NO CONFIGURADO',
      hasAuthToken: !!authToken,
      isTurso: databaseUrl?.startsWith('libsql://') || false
    }

    // Si es Turso, usar libsql client directamente
    if (databaseUrl?.startsWith('libsql://')) {
      if (!authToken) {
        return NextResponse.json(
          { 
            error: 'Falta TURSO_AUTH_TOKEN',
            configuracion: configInfo,
            ayuda: 'Agrega TURSO_AUTH_TOKEN en las variables de entorno de Vercel'
          },
          { status: 400 }
        )
      }

      const client = createClient({
        url: databaseUrl,
        authToken: authToken,
      })

      // Crear las tablas
      console.log('Creando tablas en Turso...')
      const sqlStatements = CREATE_TABLES_SQL.split(';').filter(sql => sql.trim())
      
      for (const sql of sqlStatements) {
        try {
          await client.execute(sql.trim())
        } catch (e) {
          // Ignorar errores de "table already exists"
          if (!(e instanceof Error && e.message.includes('already exists'))) {
            console.log('SQL Warning:', e)
          }
        }
      }
      console.log('Tablas creadas correctamente')

      // Insertar asignaturas iniciales
      console.log('Insertando asignaturas...')
      for (const asignatura of ASIGNATURAS_INICIALES) {
        try {
          await client.execute({
            sql: 'INSERT OR IGNORE INTO asignaturas (nombre, codigo) VALUES (?, ?)',
            args: [asignatura.nombre, asignatura.codigo]
          })
        } catch (e) {
          console.log('Insert warning:', e)
        }
      }

      // Verificar
      const result = await client.execute('SELECT * FROM asignaturas ORDER BY id')
      
      return NextResponse.json({
        success: true,
        message: 'Base de datos Turso inicializada correctamente',
        configuracion: configInfo,
        tablas: ['alumnos', 'asignaturas', 'profesores', 'notas'],
        asignaturasCreadas: result.rows.length,
        asignaturas: result.rows
      })
    }

    // Si es SQLite local, usar Prisma
    console.log('Usando SQLite local con Prisma...')
    
    // Intentar crear asignaturas con Prisma
    for (const asignatura of ASIGNATURAS_INICIALES) {
      await db.asignatura.upsert({
        where: { codigo: asignatura.codigo },
        create: asignatura,
        update: asignatura
      })
    }

    const asignaturas = await db.asignatura.findMany({ orderBy: { id: 'asc' } })

    return NextResponse.json({
      success: true,
      message: 'Base de datos local inicializada correctamente',
      configuracion: configInfo,
      asignaturasCreadas: asignaturas.length,
      asignaturas,
      nota: 'Para desarrollo local, usa: npm run db:push para crear las tablas'
    })

  } catch (error) {
    console.error('Error inicializando base de datos:', error)
    return NextResponse.json(
      { 
        error: 'Error al inicializar la base de datos',
        details: error instanceof Error ? error.message : 'Error desconocido',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  
  return NextResponse.json({
    message: 'Inicializador de Base de Datos - Seminario DCI',
    configuracionActual: {
      DATABASE_URL: databaseUrl ? (databaseUrl.startsWith('libsql://') ? databaseUrl : 'SQLite local (file:./db/custom.db)') : 'NO CONFIGURADO',
      TURSO_AUTH_TOKEN: authToken ? '✓ Configurado' : '✗ No configurado',
      modo: databaseUrl?.startsWith('libsql://') ? 'TURSO (Producción)' : 'SQLite Local (Desarrollo)'
    },
    instrucciones: {
      inicializar: 'Haz POST a este endpoint para inicializar la base de datos',
      curl: 'curl -X POST https://tu-app.vercel.app/api/init-db',
      navegador: 'Abre la consola (F12) y ejecuta: fetch("/api/init-db", {method: "POST"}).then(r=>r.json()).then(console.log)'
    }
  })
}

import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

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
    // Verificar que estamos usando Turso
    const databaseUrl = process.env.DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN
    
    // Debug: Mostrar qué variables están configuradas
    if (!databaseUrl) {
      return NextResponse.json(
        { 
          error: 'Falta configurar DATABASE_URL en Vercel',
          ayuda: 'Ve a Settings → Environment Variables y agrega DATABASE_URL con el valor: libsql://tu-base.turso.io'
        },
        { status: 400 }
      )
    }

    if (!databaseUrl.startsWith('libsql://')) {
      return NextResponse.json(
        { 
          error: 'DATABASE_URL debe empezar con libsql://',
          valorActual: databaseUrl.substring(0, 30) + '...',
          ayuda: 'El formato correcto es: libsql://tu-base.turso.io'
        },
        { status: 400 }
      )
    }

    if (!authToken) {
      return NextResponse.json(
        { 
          error: 'Falta configurar TURSO_AUTH_TOKEN en Vercel',
          ayuda: 'Ve a Settings → Environment Variables y agrega TURSO_AUTH_TOKEN con tu token de Turso'
        },
        { status: 400 }
      )
    }

    // Crear cliente de Turso
    const client = createClient({
      url: databaseUrl,
      authToken: authToken,
    })

    // Crear las tablas
    console.log('Creando tablas...')
    await client.executeBatch(CREATE_TABLES_SQL.split(';').filter(sql => sql.trim()).map(sql => ({ sql: sql.trim() })))
    console.log('Tablas creadas correctamente')

    // Insertar asignaturas iniciales si no existen
    console.log('Insertando asignaturas iniciales...')
    for (const asignatura of ASIGNATURAS_INICIALES) {
      await client.execute({
        sql: 'INSERT OR IGNORE INTO asignaturas (nombre, codigo) VALUES (?, ?)',
        args: [asignatura.nombre, asignatura.codigo]
      })
    }

    // Verificar las asignaturas insertadas
    const result = await client.execute('SELECT * FROM asignaturas')
    
    return NextResponse.json({
      success: true,
      message: 'Base de datos inicializada correctamente',
      tablas: ['alumnos', 'asignaturas', 'profesores', 'notas'],
      asignaturas: result.rows,
      instrucciones: 'La base de datos está lista. Ahora puedes usar la aplicación normalmente.'
    })

  } catch (error) {
    console.error('Error inicializando base de datos:', error)
    return NextResponse.json(
      { 
        error: 'Error al inicializar la base de datos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Usa POST para inicializar la base de datos de Turso',
    endpoint: 'POST /api/init-db',
    instrucciones: 'Haz un POST a este endpoint después de configurar las variables de entorno en Vercel'
  })
}

import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'
import { db } from '@/lib/db'

// SQL para crear las tablas
const CREATE_TABLES_SQL = `
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

CREATE TABLE IF NOT EXISTS asignaturas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

function getConfig() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN
  const databaseUrl = process.env.DATABASE_URL
  
  if (tursoUrl?.startsWith('libsql://') && tursoToken) {
    return { type: 'turso', url: tursoUrl, token: tursoToken }
  }
  
  if (databaseUrl?.startsWith('libsql://') && tursoToken) {
    return { type: 'turso', url: databaseUrl, token: tursoToken }
  }
  
  return { type: 'local', url: databaseUrl || 'file:./db/custom.db', token: null }
}

export async function POST() {
  const config = getConfig()
  
  try {
    // Si es Turso, usar libsql client directamente
    if (config.type === 'turso') {
      const client = createClient({
        url: config.url,
        authToken: config.token!,
      })

      // Crear las tablas
      console.log('Creando tablas en Turso...')
      const sqlStatements = CREATE_TABLES_SQL.split(';').filter(sql => sql.trim())
      
      for (const sql of sqlStatements) {
        try {
          await client.execute(sql.trim())
        } catch (e) {
          if (!(e instanceof Error && e.message.includes('already exists'))) {
            console.log('SQL Warning:', e)
          }
        }
      }

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

      const result = await client.execute('SELECT * FROM asignaturas ORDER BY id')
      
      return NextResponse.json({
        success: true,
        message: 'Base de datos Turso inicializada correctamente',
        configuracion: {
          tipo: 'Turso',
          url: config.url
        },
        tablas: ['alumnos', 'asignaturas', 'profesores', 'notas'],
        asignaturasCreadas: result.rows.length,
        asignaturas: result.rows
      })
    }

    // SQLite local - usar Prisma
    console.log('Usando SQLite local con Prisma...')
    
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
      configuracion: {
        tipo: 'SQLite Local',
        url: config.url
      },
      asignaturasCreadas: asignaturas.length,
      asignaturas,
      nota: 'Para desarrollo local, ejecuta: npm run db:push'
    })

  } catch (error) {
    console.error('Error inicializando base de datos:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al inicializar la base de datos',
        details: error instanceof Error ? error.message : 'Error desconocido',
        configuracion: config
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const config = getConfig()
  
  return NextResponse.json({
    message: 'Inicializador de Base de Datos - Seminario DCI',
    configuracionDetectada: {
      tipo: config.type === 'turso' ? 'Turso (Producción)' : 'SQLite Local (Desarrollo)',
      url: config.url,
      token: config.token ? '✓ Configurado' : '✗ No configurado'
    },
    variablesDeEntorno: {
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? '✓ Configurado' : '✗ No configurado',
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? '✓ Configurado' : '✗ No configurado',
      DATABASE_URL: process.env.DATABASE_URL ? '✓ Configurado' : '✗ No configurado'
    },
    instrucciones: {
      inicializar: 'POST /api/init-db - Crea las tablas y datos iniciales',
      verificar: 'GET /api/status - Verifica el estado de la base de datos',
      curlProduccion: 'curl -X POST https://tu-app.vercel.app/api/init-db',
      navegadorConsola: 'fetch("/api/init-db", {method: "POST"}).then(r=>r.json()).then(console.log)'
    }
  })
}

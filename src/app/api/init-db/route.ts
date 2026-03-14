import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

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
    // Detect environment
    const tursoUrl = process.env.TURSO_DATABASE_URL
    const tursoToken = process.env.TURSO_AUTH_TOKEN
    const isTurso = tursoUrl?.startsWith('libsql://') && tursoToken
    
    // For Turso, we need to create tables with raw SQL
    if (isTurso) {
      const { createClient } = await import('@libsql/client')
      
      const client = createClient({
        url: tursoUrl!,
        authToken: tursoToken!,
      })

      console.log('Creating tables in Turso...')
      
      // Create tables
      await client.execute(`
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
        )
      `)

      await client.execute(`
        CREATE TABLE IF NOT EXISTS asignaturas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          codigo TEXT UNIQUE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      await client.execute(`
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
        )
      `)

      await client.execute(`
        CREATE TABLE IF NOT EXISTS notas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          alumnoId INTEGER NOT NULL,
          asignaturaId INTEGER NOT NULL,
          nota REAL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (alumnoId) REFERENCES alumnos(id) ON DELETE CASCADE,
          FOREIGN KEY (asignaturaId) REFERENCES asignaturas(id) ON DELETE CASCADE,
          UNIQUE(alumnoId, asignaturaId)
        )
      `)

      console.log('Tables created, inserting subjects...')

      // Insert subjects
      for (const asignatura of ASIGNATURAS_INICIALES) {
        await client.execute({
          sql: 'INSERT OR IGNORE INTO asignaturas (nombre, codigo) VALUES (?, ?)',
          args: [asignatura.nombre, asignatura.codigo]
        })
      }

      const result = await client.execute('SELECT * FROM asignaturas ORDER BY id')

      return NextResponse.json({
        success: true,
        message: 'Turso database initialized successfully!',
        database: { type: 'Turso', url: tursoUrl },
        tables: ['alumnos', 'asignaturas', 'profesores', 'notas'],
        subjectsCreated: result.rows.length,
        subjects: result.rows
      })
    }

    // Local SQLite - use Prisma
    console.log('Initializing local SQLite with Prisma...')
    const db = getDb()
    
    // Insert subjects if not exist
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
      message: 'Local SQLite database initialized successfully!',
      database: { 
        type: 'SQLite Local', 
        url: process.env.DATABASE_URL || 'file:./db/custom.db' 
      },
      subjectsCreated: asignaturas.length,
      subjects: asignaturas
    })

  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error initializing database',
        details: error instanceof Error ? error.message : 'Unknown error',
        env: {
          TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? 'Set' : 'Not set',
          TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? 'Set' : 'Not set',
          DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set'
        }
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Database Initializer - Seminario DCI',
    environment: {
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? '✓ Configured' : '✗ Not configured',
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? '✓ Configured' : '✗ Not configured',
      DATABASE_URL: process.env.DATABASE_URL ? '✓ Configured' : '✗ Not configured'
    },
    instructions: {
      init: 'POST /api/init-db - Creates tables and initial data',
      curl: 'curl -X POST https://your-app.vercel.app/api/init-db'
    }
  })
}

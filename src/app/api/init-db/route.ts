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
    // Verificar si estamos usando Turso o SQLite local
    const isTurso = process.env.TURSO_DATABASE_URL?.startsWith('libsql://')
    
    if (isTurso) {
      // Modo Turso - usar cliente directo de libsql
      const { createClient } = await import('@libsql/client')
      const databaseUrl = process.env.TURSO_DATABASE_URL!
      const authToken = process.env.TURSO_AUTH_TOKEN
      
      if (!authToken) {
        return NextResponse.json(
          {
            error: 'Falta configurar TURSO_AUTH_TOKEN en Vercel',
            ayuda: 'Ve a Settings → Environment Variables y agrega TURSO_AUTH_TOKEN con tu token de Turso'
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
      
      const sqlStatements = [
        `CREATE TABLE IF NOT EXISTS alumnos (
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
        )`,
        `CREATE TABLE IF NOT EXISTS asignaturas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          codigo TEXT UNIQUE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS profesores (
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
        )`,
        `CREATE TABLE IF NOT EXISTS notas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          alumnoId INTEGER NOT NULL,
          asignaturaId INTEGER NOT NULL,
          nota REAL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (alumnoId) REFERENCES alumnos(id) ON DELETE CASCADE,
          FOREIGN KEY (asignaturaId) REFERENCES asignaturas(id),
          UNIQUE(alumnoId, asignaturaId)
        )`
      ]
      
      for (const sql of sqlStatements) {
        await client.execute({ sql })
      }
      
      console.log('Tablas creadas correctamente en Turso')

      // Insertar asignaturas iniciales si no existen
      console.log('Insertando asignaturas iniciales en Turso...')
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
        message: 'Base de datos Turso inicializada correctamente',
        tablas: ['alumnos', 'asignaturas', 'profesores', 'notas'],
        asignaturas: result.rows,
        instrucciones: 'La base de datos Turso está lista. Ahora puedes usar la aplicación normalmente.'
      })
    } else {
      // Modo SQLite local - usar Prisma
      // Verificar que hay base de datos configurada
      const databaseUrl = process.env.DATABASE_URL
      if (!databaseUrl) {
        return NextResponse.json(
          {
            error: 'Falta configurar DATABASE_URL para desarrollo local',
            ayuda: 'Crea un archivo .env con: DATABASE_URL="file:./prisma/custom.db"'
          },
          { status: 400 }
        )
      }

      // Usar Prisma para crear las tablas (ya están gestionadas por Prisma migrate/db push)
      // Solo insertar asignaturas iniciales si no existen
      console.log('Inicializando datos en SQLite local...')
      
      const db = getDb()
      
      // Verificar si ya hay asignaturas
      const existingAsignaturas = await db.asignatura.findMany()
      
      if (existingAsignaturas.length === 0) {
        // Insertar asignaturas iniciales
        for (const asignatura of ASIGNATURAS_INICIALES) {
          await db.asignatura.create({
            data: {
              nombre: asignatura.nombre,
              codigo: asignatura.codigo,
            }
          })
        }
        console.log('Asignaturas iniciales insertadas en SQLite local')
      } else {
        console.log(`Ya existen ${existingAsignaturas.length} asignaturas en la base de datos`)
      }

      // Obtener todas las asignaturas
      const allAsignaturas = await db.asignatura.findMany({
        orderBy: { id: 'asc' }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Base de datos SQLite local inicializada correctamente',
        tablas: ['alumnos', 'asignaturas', 'profesores', 'notas'],
        asignaturas: allAsignaturas,
        instrucciones: 'La base de datos local está lista. Ahora puedes usar la aplicación normalmente.',
        nota: 'Las tablas deben crearse previamente con: npm run db:push'
      })
    }
    
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
    message: 'Usa POST para inicializar la base de datos',
    endpoint: 'POST /api/init-db',
    instrucciones: 'Este endpoint funciona tanto para SQLite local como para Turso. Para Turso configura TURSO_DATABASE_URL y TURSO_AUTH_TOKEN. Para local configura DATABASE_URL y ejecuta primero: npm run db:push',
    modos: {
      local: 'DATABASE_URL + npm run db:push + POST /api/init-db',
      turso: 'TURSO_DATABASE_URL + TURSO_AUTH_TOKEN + POST /api/init-db'
    }
  })
}

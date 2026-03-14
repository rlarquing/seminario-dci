import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  // Check all possible database variables
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.TURSO_DB_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN
  const databaseUrl = process.env.DATABASE_URL

  // Determine database type
  let dbType = 'SQLite Local'
  let dbUrl = databaseUrl || 'file:./db/custom.db'

  if (tursoUrl?.startsWith('libsql://') && tursoToken) {
    dbType = 'Turso'
    dbUrl = tursoUrl
  }

  const status = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      type: dbType,
      url: dbUrl,
      variables: {
        TURSO_DATABASE_URL: tursoUrl ? '✓ Configured' : '✗ Not configured',
        TURSO_AUTH_TOKEN: tursoToken ? '✓ Configured' : '✗ Not configured',
        DATABASE_URL: databaseUrl ? '✓ Configured' : '✗ Not configured'
      }
    },
    connection: 'checking' as string,
    tables: {} as Record<string, number>,
    errors: [] as string[]
  }

  try {
    const db = getDb()

    // Test connection by counting records
    const [alumnosCount, profesoresCount, asignaturasCount, notasCount] = await Promise.all([
      db.alumno.count(),
      db.profesor.count(),
      db.asignatura.count(),
      db.nota.count()
    ])

    status.connection = 'connected'
    status.tables = {
      alumnos: alumnosCount,
      profesores: profesoresCount,
      asignaturas: asignaturasCount,
      notas: notasCount
    }
  } catch (error) {
    status.connection = 'error'
    status.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  return NextResponse.json(status, {
    status: status.connection === 'error' ? 500 : 200
  })
}

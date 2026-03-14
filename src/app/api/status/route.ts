/* eslint-disable @typescript-eslint/no-require-imports */
import { NextResponse } from 'next/server'

export async function GET() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
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
    // Try Turso first (production)
    if (tursoUrl?.startsWith('libsql://') && tursoToken) {
      const { createClient } = require('@libsql/client')
      const client = createClient({
        url: tursoUrl,
        authToken: tursoToken,
      })

      // Count records in each table
      const [alumnos, profesores, asignaturas, notas] = await Promise.all([
        client.execute('SELECT COUNT(*) as count FROM alumnos'),
        client.execute('SELECT COUNT(*) as count FROM profesores'),
        client.execute('SELECT COUNT(*) as count FROM asignaturas'),
        client.execute('SELECT COUNT(*) as count FROM notas'),
      ])

      status.connection = 'connected'
      status.tables = {
        alumnos: alumnos.rows[0]?.count as number || 0,
        profesores: profesores.rows[0]?.count as number || 0,
        asignaturas: asignaturas.rows[0]?.count as number || 0,
        notas: notas.rows[0]?.count as number || 0,
      }
    } else {
      // Local development with Prisma
      const { db } = await import('@/lib/db')
      
      const [alumnosCount, profesoresCount, asignaturasCount, notasCount] = await Promise.all([
        db.alumno.count(),
        db.profesor.count(),
        db.asignatura.count(),
        db.nota.count(),
      ])

      status.connection = 'connected'
      status.tables = {
        alumnos: alumnosCount,
        profesores: profesoresCount,
        asignaturas: asignaturasCount,
        notas: notasCount,
      }
    }
  } catch (error) {
    status.connection = 'error'
    status.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  return NextResponse.json(status, {
    status: status.connection === 'error' ? 500 : 200
  })
}

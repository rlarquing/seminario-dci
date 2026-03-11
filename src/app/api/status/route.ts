import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  
  const status = {
    timestamp: new Date().toISOString(),
    database: {
      type: databaseUrl?.startsWith('libsql://') ? 'Turso' : 'SQLite Local',
      url: databaseUrl ? (databaseUrl.startsWith('libsql://') ? databaseUrl : 'file:./db/custom.db') : null,
      hasAuthToken: !!authToken
    },
    connection: 'checking' as string,
    tables: {} as Record<string, number>,
    errors: [] as string[]
  }

  try {
    // Probar conexión contando registros
    const alumnosCount = await db.alumno.count()
    const profesoresCount = await db.profesor.count()
    const asignaturasCount = await db.asignatura.count()
    const notasCount = await db.nota.count()

    status.connection = 'connected'
    status.tables = {
      alumnos: alumnosCount,
      profesores: profesoresCount,
      asignaturas: asignaturasCount,
      notas: notasCount
    }
  } catch (error) {
    status.connection = 'error'
    status.errors.push(error instanceof Error ? error.message : 'Error desconocido')
  }

  return NextResponse.json(status)
}

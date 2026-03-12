import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  // Detectar configuración de base de datos
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN
  const databaseUrl = process.env.DATABASE_URL
  
  let dbType = 'SQLite Local'
  let dbUrl = 'file:./prisma/custom.db'
  
  if (tursoUrl?.startsWith('libsql://') && tursoToken) {
    dbType = 'Turso'
    dbUrl = tursoUrl
  } else if (databaseUrl?.startsWith('libsql://') && tursoToken) {
    dbType = 'Turso'
    dbUrl = databaseUrl
  } else if (databaseUrl) {
    dbType = 'SQLite Local'
    dbUrl = databaseUrl
  }
  
  const status = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      type: dbType,
      url: dbUrl,
      variables: {
        TURSO_DATABASE_URL: tursoUrl ? '✓ Configurado' : '✗ No configurado',
        TURSO_AUTH_TOKEN: tursoToken ? '✓ Configurado' : '✗ No configurado',
        DATABASE_URL: databaseUrl ? '✓ Configurado' : '✗ No configurado'
      }
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

  return NextResponse.json(status, { status: status.connection === 'error' ? 500 : 200 })
}

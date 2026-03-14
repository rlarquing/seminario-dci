/* eslint-disable @typescript-eslint/no-require-imports */
import { NextResponse } from 'next/server'

// Direct Turso client for production
function getTursoClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (!tursoUrl || !tursoToken) {
    return null
  }

  const { createClient } = require('@libsql/client')
  return createClient({
    url: tursoUrl,
    authToken: tursoToken,
  })
}

// GET - Verificar estado de las tablas
export async function GET() {
  try {
    const client = getTursoClient()
    
    if (!client) {
      return NextResponse.json({ 
        message: 'Modo local - usando SQLite local',
        local: true 
      })
    }

    // Verificar estructura de las tablas
    const tables = ['alumnos', 'profesores', 'asignaturas']
    const results: Record<string, string[]> = {}
    
    for (const table of tables) {
      const tableInfo = await client.execute(`PRAGMA table_info(${table})`)
      results[table] = tableInfo.rows.map(r => r.name as string)
    }
    
    return NextResponse.json({
      message: 'Estructura actual de las tablas',
      tables: results,
      needsMigration: !results.alumnos.includes('activo')
    })
  } catch (error) {
    console.error('Error checking migration:', error)
    return NextResponse.json({ error: 'Error al verificar migración' }, { status: 500 })
  }
}

// POST - Ejecutar migración
export async function POST() {
  try {
    const client = getTursoClient()
    
    if (!client) {
      return NextResponse.json({ 
        message: 'Modo local - la migración ya se aplicó con prisma db push',
        local: true 
      })
    }

    const migrations: string[] = []
    const errors: string[] = []

    // Migraciones para ALUMNOS
    try {
      // Verificar si existe la columna activo
      const alumnosInfo = await client.execute('PRAGMA table_info(alumnos)')
      const alumnosCols = alumnosInfo.rows.map(r => r.name as string)
      
      if (!alumnosCols.includes('activo')) {
        await client.execute('ALTER TABLE alumnos ADD COLUMN activo INTEGER DEFAULT 1')
        migrations.push('alumnos.activo agregado')
      }
      
      if (!alumnosCols.includes('deletedAt')) {
        await client.execute('ALTER TABLE alumnos ADD COLUMN deletedAt TEXT')
        migrations.push('alumnos.deletedAt agregado')
      }
    } catch (e) {
      errors.push(`Error en alumnos: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }

    // Migraciones para PROFESORES
    try {
      const profesoresInfo = await client.execute('PRAGMA table_info(profesores)')
      const profesoresCols = profesoresInfo.rows.map(r => r.name as string)
      
      if (!profesoresCols.includes('activo')) {
        await client.execute('ALTER TABLE profesores ADD COLUMN activo INTEGER DEFAULT 1')
        migrations.push('profesores.activo agregado')
      }
      
      if (!profesoresCols.includes('deletedAt')) {
        await client.execute('ALTER TABLE profesores ADD COLUMN deletedAt TEXT')
        migrations.push('profesores.deletedAt agregado')
      }
    } catch (e) {
      errors.push(`Error en profesores: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }

    // Migraciones para ASIGNATURAS
    try {
      const asignaturasInfo = await client.execute('PRAGMA table_info(asignaturas)')
      const asignaturasCols = asignaturasInfo.rows.map(r => r.name as string)
      
      if (!asignaturasCols.includes('activo')) {
        await client.execute('ALTER TABLE asignaturas ADD COLUMN activo INTEGER DEFAULT 1')
        migrations.push('asignaturas.activo agregado')
      }
      
      if (!asignaturasCols.includes('deletedAt')) {
        await client.execute('ALTER TABLE asignaturas ADD COLUMN deletedAt TEXT')
        migrations.push('asignaturas.deletedAt agregado')
      }
    } catch (e) {
      errors.push(`Error en asignaturas: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }

    // Actualizar registros existentes para que tengan activo = 1
    try {
      await client.execute('UPDATE alumnos SET activo = 1 WHERE activo IS NULL')
      await client.execute('UPDATE profesores SET activo = 1 WHERE activo IS NULL')
      await client.execute('UPDATE asignaturas SET activo = 1 WHERE activo IS NULL')
      migrations.push('Registros existentes actualizados con activo = 1')
    } catch (e) {
      errors.push(`Error actualizando registros: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Migración completada',
      migrations,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Error running migration:', error)
    return NextResponse.json({ 
      error: 'Error al ejecutar migración',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

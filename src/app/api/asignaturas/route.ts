/* eslint-disable @typescript-eslint/no-require-imports */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

// GET - List all asignaturas (activas por defecto)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const onlyDeleted = searchParams.get('onlyDeleted') === 'true'
    
    const client = getTursoClient()
    
    if (!client) {
      // Fallback to Prisma for local development
      const { db } = await import('@/lib/db')
      
      const where: { activo?: boolean } = {}
      if (!includeDeleted) {
        where.activo = true
      } else if (onlyDeleted) {
        where.activo = false
      }
      
      const asignaturas = await db.asignatura.findMany({
        where,
        orderBy: { id: 'asc' }
      })
      return NextResponse.json(asignaturas)
    }

    // Turso production
    let sql = 'SELECT * FROM asignaturas'
    if (!includeDeleted) {
      sql += ' WHERE activo = 1'
    } else if (onlyDeleted) {
      sql += ' WHERE activo = 0'
    }
    sql += ' ORDER BY id ASC'
    
    const result = await client.execute(sql)

    return NextResponse.json(result.rows.map(row => ({
      ...row,
      activo: row.activo === 1 || row.activo === true
    })))
  } catch (error) {
    console.error('Error fetching asignaturas:', error)
    return NextResponse.json({ 
      error: 'Error al obtener asignaturas',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Create new asignatura
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.nombre) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }

    const client = getTursoClient()
    
    if (!client) {
      // Fallback to Prisma for local development
      const { db } = await import('@/lib/db')
      const asignatura = await db.asignatura.create({
        data: {
          nombre: data.nombre,
          codigo: data.codigo || null,
        }
      })
      return NextResponse.json(asignatura, { status: 201 })
    }

    // Turso production
    const result = await client.execute({
      sql: `INSERT INTO asignaturas (nombre, codigo, activo) VALUES (?, ?, 1)`,
      args: [data.nombre, data.codigo || null]
    })

    const newAsignatura = await client.execute({
      sql: 'SELECT * FROM asignaturas WHERE id = ?',
      args: [result.lastInsertRowid as number]
    })

    return NextResponse.json({
      ...newAsignatura.rows[0],
      activo: true
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating asignatura:', error)
    return NextResponse.json({ 
      error: 'Error al crear asignatura',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

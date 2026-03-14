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

// GET - List all asignaturas
export async function GET() {
  try {
    const client = getTursoClient()
    
    if (!client) {
      // Fallback to Prisma for local development
      const { db } = await import('@/lib/db')
      const asignaturas = await db.asignatura.findMany({
        orderBy: { id: 'asc' }
      })
      return NextResponse.json(asignaturas)
    }

    // Turso production
    const result = await client.execute(`
      SELECT * FROM asignaturas ORDER BY id ASC
    `)

    return NextResponse.json(result.rows)
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
      sql: `INSERT INTO asignaturas (nombre, codigo) VALUES (?, ?)`,
      args: [data.nombre, data.codigo || null]
    })

    const newAsignatura = await client.execute({
      sql: 'SELECT * FROM asignaturas WHERE id = ?',
      args: [result.lastInsertRowid as number]
    })

    return NextResponse.json(newAsignatura.rows[0], { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating asignatura:', error)
    return NextResponse.json({ 
      error: 'Error al crear asignatura',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
